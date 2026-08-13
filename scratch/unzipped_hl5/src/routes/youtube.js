"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const ytdl = require('@distube/ytdl-core');
const router = (0, express_1.Router)();

function parseYouTubeId(input) {
    if (!input) return null;
    const str = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
}

async function getYouTubeInfo(videoId) {
    try {
        const info = await ytdl.getInfo(videoId);
        const title = info.videoDetails?.title || `YouTube_Video_${videoId}`;
        const author = info.videoDetails?.author?.name || 'YouTube Channel';
        const lengthSeconds = parseInt(info.videoDetails?.lengthSeconds || '0', 10);
        const thumbnail = info.videoDetails?.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        const viewCount = info.videoDetails?.viewCount ? `${(parseInt(info.videoDetails.viewCount) / 1000).toFixed(1)}K views` : '';

        // Extract MP4 format (360p / 720p / 1080p combined audio+video or highest video)
        let mp4Format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' });
        if (!mp4Format || !mp4Format.url) {
            mp4Format = ytdl.chooseFormat(info.formats, { quality: '18' });
        }
        if (!mp4Format || !mp4Format.url) {
            mp4Format = info.formats.find(f => f.url && (f.mimeType || '').includes('video/mp4'));
        }

        // Extract Audio format (MP3/M4A)
        let audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        if (!audioFormat || !audioFormat.url) {
            audioFormat = info.formats.find(f => f.url && (f.mimeType || '').includes('audio'));
        }

        const mp4Url = mp4Format && mp4Format.url ? mp4Format.url : `/api/v1/youtube/stream?v=${videoId}&type=mp4`;
        const mp3Url = audioFormat && audioFormat.url ? audioFormat.url : `/api/v1/youtube/stream?v=${videoId}&type=mp3`;

        return {
            videoId,
            title,
            author,
            lengthSeconds,
            viewCountText: viewCount,
            thumbnail,
            mp4Url,
            mp3Url,
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
        };
    } catch (e) {
        console.error('[YTDL Core Error]', e.message);
        return {
            videoId,
            title: `YouTube Video (${videoId})`,
            author: 'YouTube',
            lengthSeconds: 0,
            viewCountText: '',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            mp4Url: `/api/v1/youtube/stream?v=${videoId}&type=mp4`,
            mp3Url: `/api/v1/youtube/stream?v=${videoId}&type=mp3`,
            embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
        };
    }
}

router.get('/api/v1/youtube/search', async (req, res) => {
    const q = (req.query.q || req.query.query || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'Missing search query or link' });

    const videoId = parseYouTubeId(q);
    if (videoId) {
        const info = await getYouTubeInfo(videoId);
        return res.json({
            query: q,
            isDirectLink: true,
            results: [{
                videoId: info.videoId,
                title: info.title,
                author: info.author,
                lengthSeconds: info.lengthSeconds,
                viewCountText: info.viewCountText,
                thumbnail: info.thumbnail,
                url: `https://www.youtube.com/watch?v=${info.videoId}`
            }]
        });
    }

    // Search query fallback
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

    const info = await getYouTubeInfo(videoId);
    res.json(info);
});

router.all('/api/v1/youtube/stream', async (req, res) => {
    const videoId = (req.query.v || req.query.id || '').toString().trim();
    const type = (req.query.type || 'mp4').toString().toLowerCase();
    if (!videoId) return res.status(400).send('Missing video ID');

    try {
        const info = await ytdl.getInfo(videoId);
        let format;
        if (type === 'mp3') {
            format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
        } else {
            format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'videoandaudio' }) || ytdl.chooseFormat(info.formats, { quality: '18' });
        }

        if (format && format.url) {
            return res.redirect(format.url);
        }
    } catch (e) {}

    res.status(404).send('YouTube video stream currently unavailable.');
});

module.exports = router;
