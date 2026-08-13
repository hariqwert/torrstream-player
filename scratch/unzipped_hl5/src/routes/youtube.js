"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();

const INVIDIOUS_INSTANCES = [
    'https://inv.tux.pizza',
    'https://yewtu.be',
    'https://invidious.nerdvpn.de',
    'https://invidious.drgns.space'
];

async function fetchJsonUrl(url) {
    try {
        const res = await axios_1.default.get(url, {
            timeout: 7000,
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

    if (results.length === 0) {
        try {
            const pipedData = await fetchJsonUrl(`https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(q)}&filter=videos`);
            if (pipedData && Array.isArray(pipedData.items)) {
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

    let videoStreamUrl = `https://www.youtube.com/watch?v=${videoId}`;
    let downloadMp4Url = `https://co.wuk.sh/api/json`;

    try {
        const cobaltRes = await axios_1.default.post('https://co.wuk.sh/api/json', {
            url: `https://www.youtube.com/watch?v=${videoId}`,
            vCodec: 'h264',
            vQuality: '1080'
        }, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            timeout: 6000
        }).catch(() => null);

        if (cobaltRes && cobaltRes.data && cobaltRes.data.url) {
            return res.json({
                videoId,
                title: `YouTube Video (${videoId})`,
                mp4Url: cobaltRes.data.url,
                mp3Url: cobaltRes.data.url,
                embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
            });
        }
    } catch (e) {}

    res.json({
        videoId,
        title: `YouTube Stream (${videoId})`,
        mp4Url: `https://yewtu.be/latest_version?id=${videoId}&itag=22`,
        mp3Url: `https://yewtu.be/latest_version?id=${videoId}&itag=140`,
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1`
    });
});

module.exports = router;
