"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupTorrentProxies = setupTorrentProxies;
const express_1 = require("express");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const http_proxy_middleware_1 = require("http-proxy-middleware");
const axios_1 = __importDefault(require("axios"));
const router = (0, express_1.Router)();

const TMDB_API_KEY = '9d83476d2e27f56748167514c69cd2b4';
const DEFAULT_TRACKERS = [
    'http://nyaa.tracker.wf:7777/announce',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://open.stealth.si:80/announce',
    'udp://tracker.torrent.eu.org:451/announce',
    'udp://exodus.desync.com:6969/announce',
    'udp://tracker.dler.org:6969/announce',
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:6969/announce',
    'udp://opentracker.i2p.rocks:6969/announce'
];

async function fetchJsonUrl(url) {
    try {
        const res = await axios_1.default.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        return res.data;
    }
    catch (e) {
        return null;
    }
}

router.get('/api/v1/search', async (req, res) => {
    let query = (req.query.query || req.query.q || '').toString().trim();
    let tmdbId = (req.query.tmdb || req.query.tmdb_id || '').toString();
    let imdbId = (req.query.imdb || req.query.imdb_id || '').toString();
    let mediaType = (req.query.type || req.query.media_type || 'movie').toString().toLowerCase();
    if (mediaType === 'tv') mediaType = 'series';

    let season = parseInt((req.query.season || req.query.s || '1').toString());
    let episode = parseInt((req.query.episode || req.query.e || '1').toString());

    if (query) {
        const seMatch = query.match(/s(\d+)e(\d+)/i) || query.match(/(\d+)x(\d+)/i);
        if (seMatch) {
            season = parseInt(seMatch[1]);
            episode = parseInt(seMatch[2]);
            mediaType = 'series';
            query = query.replace(/s\d+e\d+/i, '').replace(/\d+x\d+/i, '').trim();
        }
    }

    let title = query || 'Media Stream';
    let year = '2024';

    // TMDB Direct ID Resolution
    if (tmdbId && !imdbId) {
        const endpoint = mediaType === 'series' ? 'tv' : 'movie';
        const extUrl = endpoint === 'tv'
            ? `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
            : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
        const extData = await fetchJsonUrl(extUrl);
        if (extData) {
            imdbId = extData.imdb_id || (extData.external_ids && extData.external_ids.imdb_id);
            title = extData.title || extData.name || title;
            if (extData.release_date || extData.first_air_date) {
                year = (extData.release_date || extData.first_air_date).substring(0, 4);
            }
        }
    }

    // TMDB Multi-Search Auto-Detection
    if (!imdbId && !tmdbId && query) {
        const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
        const searchData = await fetchJsonUrl(searchUrl);
        if (searchData && searchData.results && searchData.results.length > 0) {
            const item = searchData.results[0];
            tmdbId = item.id;
            title = item.title || item.name || query;
            year = (item.release_date || item.first_air_date || '2024').substring(0, 4);
            if (item.media_type === 'tv') mediaType = 'series';
            else if (item.media_type === 'movie') mediaType = 'movie';

            const endpoint = mediaType === 'series' ? 'tv' : 'movie';
            const extUrl = endpoint === 'tv'
                ? `https://api.themoviedb.org/3/tv/${item.id}/external_ids?api_key=${TMDB_API_KEY}`
                : `https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}`;
            const extData = await fetchJsonUrl(extUrl);
            if (extData) {
                imdbId = extData.imdb_id || (extData.external_ids && extData.external_ids.imdb_id);
            }
        }
    }

    let streams = [];
    if (imdbId) {
        const torrentioType = mediaType === 'series' ? 'series' : 'movie';
        const streamPath = torrentioType === 'series' ? `${imdbId}:${season}:${episode}` : imdbId;
        const torUrl = `https://torrentio.strem.fun/stream/${torrentioType}/${streamPath}.json`;
        console.log(`[Search V1] Querying Torrentio for ${title} (${torrentioType}): ${torUrl}`);
        const torData = await fetchJsonUrl(torUrl);

        if (torData && torData.streams && torData.streams.length > 0) {
            streams = torData.streams
                .filter(s => {
                    const raw = (s.title || s.name || '').toLowerCase();
                    return !raw.includes('.avi') && !raw.includes(' xvid ') && !raw.includes(' divx ');
                })
                .map(s => {
                    const infoHash = s.infoHash;
                    let magnet = s.magnet;
                    if (!magnet && infoHash) {
                        magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(title)}`;
                        DEFAULT_TRACKERS.forEach(tr => {
                            magnet += `&tr=${encodeURIComponent(tr)}`;
                        });
                    }

                    const rawTitle = s.title || s.name || title;
                    const seedMatch = rawTitle.match(/👤\s*(\d+)/);
                    const sizeMatch = rawTitle.match(/💾\s*([\d\.]+\s*[GMK]B)/i);
                    const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);

                    return {
                        name: s.name || 'Torrent Stream',
                        title: `${title} ${mediaType === 'series' ? `S${season}E${episode}` : ''} (${qualityMatch ? qualityMatch[1] : '1080p'})`,
                        raw_title: rawTitle,
                        quality: qualityMatch ? qualityMatch[1] : '1080p HD',
                        size: sizeMatch ? sizeMatch[1] : '1.5 GB',
                        seeders: seedMatch ? parseInt(seedMatch[1]) : 45,
                        infoHash: infoHash || '',
                        magnet: magnet || '',
                        play_url: `/?magnet=${encodeURIComponent(magnet || '')}`
                    };
                }).filter(s => s.magnet);
        }
    }

    res.json({
        query,
        tmdbId,
        imdbId,
        mediaType,
        season,
        episode,
        title,
        year,
        total_streams: streams.length,
        results: streams
    });
});

function setupTorrentProxies(app) {
    let torrProcess = null;
    const isWin = process.platform === 'win32';
    const binPath = path_1.default.join(process.cwd(), 'bin');
    if (!fs_1.default.existsSync(binPath)) {
        fs_1.default.mkdirSync(binPath, { recursive: true });
    }
    const torrServerName = isWin ? 'TorrServer.exe' : 'TorrServer';
    const torrServerPath = path_1.default.join(binPath, torrServerName);

    if (fs_1.default.existsSync(torrServerPath)) {
        startTorrServer();
    } else {
        console.log(`[TorrServer] Binary not found at ${torrServerPath}. Ensure binary is downloaded.`);
    }

    function startTorrServer() {
        console.log(`[TorrServer] Starting ${torrServerName} on port 8090...`);
        try {
            if (!isWin) (0, child_process_1.execSync)('pkill -9 TorrServer || true');
        } catch (e) { }

        if (torrProcess) torrProcess.kill();
        const dbPath = path_1.default.join(binPath, 'db');
        if (!fs_1.default.existsSync(dbPath)) fs_1.default.mkdirSync(dbPath, { recursive: true });

        torrProcess = (0, child_process_1.spawn)(torrServerPath, ['-p', '8090', '-d', dbPath], { cwd: binPath });
        torrProcess.stdout.on('data', (d) => console.log(`[TorrServer] ${d.toString().trim()}`));
        torrProcess.stderr.on('data', (d) => console.error(`[TorrServer] ${d.toString().trim()}`));
        torrProcess.on('close', (code) => {
            console.log(`TorrServer exited with code ${code}.`);
        });
    }

    app.use(router);

    const torrProxy = (0, http_proxy_middleware_1.createProxyMiddleware)({
        target: 'http://127.0.0.1:8090',
        changeOrigin: true,
        pathFilter: ['/torrents', '/stream', '/settings', '/echo'],
        on: { proxyReq: http_proxy_middleware_1.fixRequestBody }
    });

    app.use(torrProxy);
}
