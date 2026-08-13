"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();

const PIPED_INSTANCES = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.video',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.drgns.space'
];

const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space'
];

async function fetchJsonUrl(url) {
    try {
        const res = await axios_1.default.get(url, {
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        return res.data;
    } catch (e) {
        return null;
    }
}

function parseYouTubeId(input) {
    if (!input) return null;
    const str = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/i);
    return match ? match[1] : null;
}

async function resolveDirectYouTubeStreams(videoId) {
    let mp4Url = null;
    let mp3Url = null;
    let title = `YouTube_Video_${videoId}`;

    // TIER 1: Cobalt API (Fastest 1080p Direct MP4/MP3)
    for (const cobaltHost of ['https://co.wuk.sh/api/json', 'https://api.cobalt.tools/api/json']) {
        try {
            const cobRes = await axios_1.default.post(cobaltHost, {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                vCodec: 'h264',
                vQuality: '1080'
            }, {
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                timeout: 5000
            }).catch(() => null);

            if (cobRes && cobRes.data && cobRes.data.url) {
                mp4Url = cobRes.data.url;
                mp3Url = cobRes.data.url;
                break;
            }
        } catch (e) {}
    }

    // TIER 2: Piped Streams API (Direct Google CDN Stream URLs)
    if (!mp4Url || !mp3Url) {
        for (const pipedHost of PIPED_INSTANCES) {
            const data = await fetchJsonUrl(`${pipedHost}/streams/${videoId}`);
            if (data) {
                if (data.title) title = data.title;

                if (!mp4Url && Array.isArray(data.videoStreams)) {
                    const h264Streams = data.videoStreams.filter(s => (s.mimeType || '').includes('video/mp4'));
                    if (h264Streams.length > 0) {
                        mp4Url = h264Streams[0].url;
                    } else if (data.videoStreams[0]) {
                        mp4Url = data.videoStreams[0].url;
                    }
                }

                if (!mp3Url && Array.isArray(data.audioStreams)) {
                    const m4aStreams = data.audioStreams.filter(s => (s.mimeType || '').includes('audio/mp4') || (s.mimeType || '').includes('audio/m4a'));
                    if (m4aStreams.length > 0) {
                        mp3Url = m4aStreams[0].url;
                    } else if (data.audioStreams[0]) {
                        mp3Url = data.audioStreams[0].url;
                    }
                }

                if (mp4Url) break;
            }
        }
    }

    // TIER 3: Invidious Video Info API
    if (!mp4Url || !mp3Url) {
        for (const invHost of INVIDIOUS_INSTANCES) {
            const data = await fetchJsonUrl(`${invHost}/api/v1/videos/${videoId}`);
            if (data) {
                if (data.title) title = data.title;

                if (!mp4Url && Array.isArray(data.formatStreams)) {
                    const mp4Streams = data.formatStreams.filter(s => (s.container || '').toLowerCase() === 'mp4');
                    if (mp4Streams.length > 0) {
                        mp4Url = mp4Streams[0].url;
                    }
                }

                if (!mp3Url && Array.isArray(data.adaptiveFormats)) {
                    const audioFormats = data.adaptiveFormats.filter(s => (s.type || '').includes('audio'));
                    if (audioFormats.length > 0) {
                        mp3Url = audioFormats[0].url;
                    }
                }

                if (mp4Url) break;
            }
        }
    }

    return {
        videoId,
        title,
        mp4Url: mp4Url || `/api/v1/youtube/stream?v=${videoId}&type=mp4`,
        mp3Url: mp3Url || `/api/v1/youtube/stream?v=${videoId}&type=mp3`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
    };
}

router.get('/api/v1/youtube/search', async (req, res) => {
    const q = (req.query.q || req.query.query || '').toString().trim();
    if (!q) return res.status(400).json({ error: 'Missing search query or link' });

    const videoId = parseYouTubeId(q);
    if (videoId) {
        return res.json({
            query: q,
            isDirectLink: true,
            results: [{
                videoId: videoId,
                title: 'YouTube Video Link',
                author: 'YouTube',
                lengthSeconds: 0,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`
            }]
        });
    }

    let results = [];
    for (const pipedHost of PIPED_INSTANCES) {
        const pipedData = await fetchJsonUrl(`${pipedHost}/search?q=${encodeURIComponent(q)}&filter=videos`);
        if (pipedData && Array.isArray(pipedData.items) && pipedData.items.length > 0) {
            results = pipedData.items.slice(0, 20).map((v) => {
                const vId = parseYouTubeId(v.url) || v.url.replace('/watch?v=', '');
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
        }
    }

    if (results.length === 0) {
        for (const instance of INVIDIOUS_INSTANCES) {
            const data = await fetchJsonUrl(`${instance}/api/v1/search?q=${encodeURIComponent(q)}&type=video`);
            if (Array.isArray(data) && data.length > 0) {
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
        }
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

    const info = await resolveDirectYouTubeStreams(videoId);
    res.json(info);
});

router.all('/api/v1/youtube/stream', async (req, res) => {
    const videoId = (req.query.v || req.query.id || '').toString().trim();
    const type = (req.query.type || 'mp4').toString().toLowerCase();
    if (!videoId) return res.status(400).send('Missing video ID');

    const info = await resolveDirectYouTubeStreams(videoId);
    const targetUrl = type === 'mp3' ? info.mp3Url : info.mp4Url;

    if (targetUrl && targetUrl.startsWith('http')) {
        return res.redirect(targetUrl);
    }

    res.status(404).send('YouTube video stream currently unavailable.');
});

module.exports = router;
