"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const router = express_1.default.Router();
// Helper to convert SRT string to WebVTT string
function srtToVtt(srtText) {
    if (!srtText)
        return 'WEBVTT\n\n';
    let vtt = 'WEBVTT\n\n' + srtText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
    return vtt;
}
// Proxy endpoint to convert any SRT/VTT subtitle URL to valid WebVTT format for browser <track>
router.get('/vtt', async (req, res) => {
    const subUrl = req.query.url;
    if (!subUrl) {
        return res.status(400).send('Missing subtitle url');
    }
    try {
        const response = await axios_1.default.get(subUrl, {
            responseType: 'text',
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const rawText = response.data || '';
        const vttContent = rawText.includes('WEBVTT') ? rawText : srtToVtt(rawText);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(vttContent);
    }
    catch (e) {
        console.error('Subtitle VTT proxy error:', e?.message || e);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.send('WEBVTT\n\n1\n00:00:00.000 --> 00:00:05.000\nFailed to load subtitle track');
    }
});
// Comprehensive Subtitle Fetcher (Wyzie Subs API + OpenSubtitles / Fallbacks)
router.get('/fetch', async (req, res) => {
    const title = (req.query.title || req.query.q || '');
    const imdbId = (req.query.imdb || req.query.imdb_id || '');
    const tmdbId = (req.query.tmdb || '');
    const season = (req.query.season || req.query.s || '1');
    const episode = (req.query.episode || req.query.e || '1');
    const lang = (req.query.lang || '');
    const subtitles = [];
    // 1. Try Wyzie Subs API (Fastest & Most Reliable for Movies & TV Shows)
    if (imdbId || tmdbId || title) {
        try {
            let wyzieUrl = `https://sub.wyzie.ru/search?id=${imdbId || tmdbId}`;
            if (season && episode && season !== '0') {
                wyzieUrl += `&season=${season}&episode=${episode}`;
            }
            const wyzieRes = await axios_1.default.get(wyzieUrl, { timeout: 6000, validateStatus: () => true });
            if (wyzieRes.status === 200 && Array.isArray(wyzieRes.data)) {
                wyzieRes.data.forEach((sub) => {
                    if (sub.url) {
                        subtitles.push({
                            id: sub.id || sub.url,
                            display: `${sub.display || sub.language || 'English'} (${sub.format || 'SRT'})`,
                            language: sub.language || sub.lang || 'English',
                            langCode: (sub.lang || sub.language || 'en').substring(0, 2).toLowerCase(),
                            url: `/api/subtitles/vtt?url=${encodeURIComponent(sub.url)}`,
                            rawUrl: sub.url,
                            source: 'Wyzie Subs'
                        });
                    }
                });
            }
        }
        catch (e) {
            console.warn('Wyzie subs fetch warning:', e?.message || e);
        }
    }
    // Filter by language if specified
    let filtered = subtitles;
    if (lang && lang !== 'all') {
        const targetLang = lang.toLowerCase();
        filtered = subtitles.filter(s => s.language.toLowerCase().includes(targetLang) ||
            s.langCode.toLowerCase().includes(targetLang));
        if (filtered.length === 0)
            filtered = subtitles; // Fallback to all if specific language not found
    }
    res.json({
        title,
        imdbId,
        count: filtered.length,
        subtitles: filtered
    });
});
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }
    try {
        const searchUrl = `https://malayalamsubtitles.org/?s=${encodeURIComponent(query)}`;
        const response = await axios_1.default.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.5' }, validateStatus: () => true });
        if (response.status === 403 || response.data.includes('Just a moment...')) {
            return res.json({ error: 'Search blocked by Cloudflare. Please try again later or use the exact movie name.' });
        }
        const $ = cheerio.load(response.data);
        const results = [];
        // Msone usually has articles inside main or specific classes
        $('article').each((i, el) => {
            const titleElement = $(el).find('.entry-title a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            const image = $(el).find('img').attr('src');
            if (title && link) {
                results.push({ title, link, image });
            }
        });
        res.json({ results });
    }
    catch (error) {
        console.error('Subtitle search error:', error.message);
        res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
});
router.get('/download', async (req, res) => {
    const postUrl = req.query.url;
    if (!postUrl || !postUrl.startsWith('https://malayalamsubtitles.org/')) {
        return res.status(400).json({ error: 'Valid Post URL from malayalamsubtitles.org is required' });
    }
    try {
        let response = await axios_1.default.get(postUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            validateStatus: () => true // Don't throw on 403
        });
        // Fallback to web archive if blocked by Cloudflare
        if (response.status === 403 || response.status === 520 || response.data.includes('Just a moment...')) {
            console.log(`Cloudflare blocked ${postUrl}. Attempting Web Archive fallback...`);
            const archiveUrl = `https://web.archive.org/web/2/${postUrl}`;
            try {
                response = await axios_1.default.get(archiveUrl, { validateStatus: () => true });
            }
            catch (archiveErr) {
                console.warn('Web archive fallback failed');
            }
        }
        const $ = cheerio.load(response.data);
        let downloadLink = '';
        // 1. Try to find the link in onclick="window.location.href='...'"
        const onclickMatch = response.data.match(/onclick=["']window\.location\.href=['"]([^'"]+)['"]/i);
        if (onclickMatch && onclickMatch[1]) {
            downloadLink = onclickMatch[1];
            // Clean up if it's a web archive URL
            if (downloadLink.includes('web.archive.org') && downloadLink.includes('http')) {
                const match = downloadLink.match(/https?:\/\/.*/);
                if (match) {
                    // It might match the first http which is web.archive.org, we want the second one
                    const originalUrlMatch = downloadLink.match(/web\.archive\.org\/web\/\d+\/(https?:\/\/.*)/);
                    if (originalUrlMatch) {
                        downloadLink = originalUrlMatch[1];
                    }
                }
            }
        }
        else {
            // 2. Try to find wpdmdl=\d+ anywhere in the HTML
            const wpdmdlMatch = response.data.match(/wpdmdl=\d+/i);
            if (wpdmdlMatch) {
                downloadLink = `https://malayalamsubtitles.org/?${wpdmdlMatch[0]}`;
            }
        }
        if (!downloadLink) {
            // Find anchor tags that contain wpdmdl or zip or srt
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && (href.includes('wpdmdl=') || href.includes('.zip') || href.includes('.srt') || href.includes('download'))) {
                    const text = $(el).text().toLowerCase();
                    if (href.includes('wpdmdl=') || text.includes('download') || text.includes('zip') || text.includes('srt') || $(el).hasClass('download-button')) {
                        downloadLink = href;
                        return false; // Break the loop
                    }
                }
            });
            // Backup plan for download buttons
            if (!downloadLink) {
                const buttons = $('a.wp-block-button__link'); // Common in WP
                buttons.each((i, el) => {
                    const text = $(el).text().toLowerCase();
                    const href = $(el).attr('href');
                    if (href && (href.includes('wpdmdl=') || text.includes('download'))) {
                        downloadLink = href || '';
                    }
                });
            }
            if (!downloadLink) {
                console.warn('Download link not found, possibly due to Cloudflare protection. Returning post URL as fallback.');
                return res.json({ downloadUrl: postUrl });
            }
        } // Close the outer if(!downloadLink) block
        res.json({ downloadUrl: downloadLink });
    }
    catch (error) {
        console.error('Subtitle download error:', error.message);
        res.status(500).json({ error: 'Failed to extract download link' });
    }
});
exports.default = router;
