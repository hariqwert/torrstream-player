"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();

function getYtdlpBinaryPath() {
    const candidates = [
        path_1.default.join(process.cwd(), 'bin', 'ytdlp.exe'),
        path_1.default.join(__dirname, '..', '..', 'bin', 'ytdlp.exe'),
        path_1.default.join(process.cwd(), 'bin', 'yt-dlp.exe'),
        path_1.default.join(__dirname, '..', '..', 'bin', 'yt-dlp.exe')
    ];
    for (const p of candidates) {
        if (fs_1.default.existsSync(p)) return p;
    }
    return 'yt-dlp';
}

function parseYouTubeId(input) {
    if (!input) return null;
    const str = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
}

function extractStreamUrlWithYtdlp(videoId, formatType = 'mp4') {
    return new Promise((resolve) => {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const binPath = getYtdlpBinaryPath();
        const formatArg = formatType === 'mp3' ? 'bestaudio' : 'best';

        (0, child_process_1.execFile)(binPath, ['-g', '-f', formatArg, videoUrl], { timeout: 15000 }, (err, stdout, stderr) => {
            if (err || !stdout) {
                console.error('[YTDLP Stream Error]', err?.message || stderr);
                return resolve(null);
            }
            const lines = stdout.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length > 0) {
                return resolve(lines[0]);
            }
            resolve(null);
        });
    });
}

function getYouTubeTitleWithYtdlp(videoId) {
    return new Promise((resolve) => {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const binPath = getYtdlpBinaryPath();

        (0, child_process_1.execFile)(binPath, ['--get-title', videoUrl], { timeout: 10000 }, (err, stdout) => {
            if (err || !stdout) return resolve(`YouTube_Video_${videoId}`);
            resolve(stdout.trim());
        });
    });
}

router.get('/api/v1/youtube/search', async (req, res) => {
    const q = (req.query.q || req.query.query || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'Missing search query or link' });

    const videoId = parseYouTubeId(q);
    if (videoId) {
        const title = await getYouTubeTitleWithYtdlp(videoId);
        return res.json({
            query: q,
            isDirectLink: true,
            results: [{
                videoId: videoId,
                title: title,
                author: 'YouTube',
                lengthSeconds: 0,
                viewCountText: '',
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`
            }]
        });
    }

    let results = [];
    const searchInstances = [
        'https://pipedapi.kavin.rocks',
        'https://invidious.flokinet.to',
        'https://inv.tux.pizza'
    ];

    for (const host of searchInstances) {
        try {
            const isPiped = host.includes('piped');
            const searchUrl = isPiped ? `${host}/search?q=${encodeURIComponent(q)}&filter=videos` : `${host}/api/v1/search?q=${encodeURIComponent(q)}&type=video`;
            const searchRes = await axios_1.default.get(searchUrl, { timeout: 4000 });
            const data = searchRes.data;

            if (isPiped && data && Array.isArray(data.items)) {
                results = data.items.slice(0, 20).map((v) => {
                    const vId = parseYouTubeId(v.url) || (v.url || '').replace('/watch?v=', '');
                    return {
                        videoId: vId,
                        title: v.title || 'YouTube Video',
                        author: v.uploaderName || 'YouTube Channel',
                        lengthSeconds: v.duration || 0,
                        viewCountText: v.views ? `${(v.views / 1000).toFixed(1)}K views` : '',
                        thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
                        url: `https://www.youtube.com/watch?v=${vId}`
                    };
                });
                break;
            } else if (!isPiped && Array.isArray(data)) {
                results = data.slice(0, 20).map((v) => ({
                    videoId: v.videoId,
                    title: v.title || 'YouTube Video',
                    author: v.author || v.authorName || 'YouTube Channel',
                    lengthSeconds: v.lengthSeconds || 0,
                    viewCountText: v.viewCount ? `${(v.viewCount / 1000).toFixed(1)}K views` : '',
                    thumbnail: v.videoThumbnails && v.videoThumbnails[0] ? v.videoThumbnails[0].url : `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
                    url: `https://www.youtube.com/watch?v=${v.videoId}`
                }));
                break;
            }
        } catch (e) {}
    }

    res.json({
        query: q,
        isDirectLink: false,
        results: results
    });
});

router.get('/api/v1/youtube/download', async (req, res) => {
    const link = (req.query.url || req.query.link || req.query.v || '').toString().trim();
    const videoId = parseYouTubeId(link) || link;
    if (!videoId) return res.status(400).json({ error: 'Invalid YouTube link or Video ID' });

    const title = await getYouTubeTitleWithYtdlp(videoId);
    res.json({
        videoId,
        title,
        mp4Url: `/api/v1/youtube/stream?v=${videoId}&type=mp4`,
        mp3Url: `/api/v1/youtube/stream?v=${videoId}&type=mp3`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
    });
});

router.all('/api/v1/youtube/stream', async (req, res) => {
    const videoId = (req.query.v || req.query.id || '').toString().trim();
    const type = (req.query.type || 'mp4').toString().toLowerCase();
    if (!videoId) return res.status(400).send('Missing video ID');

    console.log(`[YouTube Stream Proxy] Extracting stream for Video ID: ${videoId}, Type: ${type}`);
    const directCdnUrl = await extractStreamUrlWithYtdlp(videoId, type);

    if (!directCdnUrl || !directCdnUrl.startsWith('http')) {
        return res.status(503).send('YouTube video stream currently unavailable.');
    }

    try {
        const title = await getYouTubeTitleWithYtdlp(videoId);
        const safeTitle = (title || 'YouTube_Video').replace(/[^a-zA-Z0-9_\-]/g, '_');

        const streamRes = await (0, axios_1.default)({
            method: 'GET',
            url: directCdnUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            },
            timeout: 60000
        });

        res.setHeader('Content-Type', type === 'mp3' ? 'audio/mpeg' : 'video/mp4');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.${type}"`);
        if (streamRes.headers['content-length']) {
            res.setHeader('Content-Length', streamRes.headers['content-length']);
        }

        streamRes.data.pipe(res);
    } catch (e) {
        console.warn('[YouTube Stream Pipe Warning] Falling back to 302 redirect:', e?.message);
        res.redirect(directCdnUrl);
    }
});

module.exports = router;
