import { Router } from 'express';
import { spawn, exec, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import axios from 'axios';

const router = Router();

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

async function fetchJsonUrl(url: string) {
    try {
        const res = await axios.get(url, { timeout: 10000 });
        return res.data;
    } catch (e) {
        return null;
    }
}

router.get('/api/v1/search', async (req, res) => {
    let query = (req.query.query || req.query.q || '') as string;
    let tmdbId = (req.query.tmdb || req.query.tmdb_id || '') as string;
    let imdbId = (req.query.imdb || req.query.imdb_id || '') as string;
    let mediaType = ((req.query.type || req.query.media_type || 'movie') as string).toLowerCase();
    if (mediaType === 'tv') mediaType = 'series';

    let season = parseInt((req.query.season || req.query.s || '1') as string);
    let episode = parseInt((req.query.episode || req.query.e || '1') as string);

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

    let streams: any[] = [];
    if (imdbId) {
        const isSeries = mediaType === 'series';
        let searchQuery = imdbId;
        if (isSeries) {
            searchQuery = `${title} S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
        }
        
        const torUrl = `https://apibay.org/q.php?q=${encodeURIComponent(searchQuery)}`;
        console.log(`[Search V1] Querying ApiBay for ${title}: ${torUrl}`);
        const torData = await fetchJsonUrl(torUrl);

        if (torData && Array.isArray(torData) && torData.length > 0 && torData[0].id !== "0") {
            streams = torData
                .filter((s: any) => {
                    const raw = (s.name || '').toLowerCase();
                    return !raw.includes('.avi') && !raw.includes(' xvid ') && !raw.includes(' divx ');
                })
                .map((s: any) => {
                    const infoHash = s.info_hash;
                    let magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(s.name)}`;
                    DEFAULT_TRACKERS.forEach(tr => {
                        magnet += `&tr=${encodeURIComponent(tr)}`;
                    });

                    const rawTitle = s.name || title;
                    const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);

                    let sizeStr = 'Unknown';
                    if (s.size) {
                        const bytes = parseInt(s.size);
                        if (bytes > 1024 * 1024 * 1024) sizeStr = (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
                        else if (bytes > 1024 * 1024) sizeStr = (bytes / (1024 * 1024)).toFixed(2) + ' MB';
                    }

                    return {
                        name: 'Torrent Stream',
                        title: `${title} ${isSeries ? `S${season}E${episode}` : ''} (${qualityMatch ? qualityMatch[1] : 'HD'})`,
                        raw_title: rawTitle,
                        magnet: magnet,
                        infoHash: infoHash,
                        seeders: parseInt(s.seeders || '0'),
                        size: sizeStr,
                        quality: qualityMatch ? qualityMatch[1] : 'HD'
                    };
                });
            
            // Sort by seeders
            streams.sort((a, b) => b.seeders - a.seeders);
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
        results: streams
    });
});

export function setupTorrentProxies(app: any) {
    let torrProcess: any = null;
    const binPath = path.join(process.cwd(), 'bin');
    if (!fs.existsSync(binPath)) {
        fs.mkdirSync(binPath, { recursive: true });
    }
    const torrServerPath = path.join(binPath, 'TorrServer');
    
    // Download TorrServer if not exists
    if (!fs.existsSync(torrServerPath)) {
        console.log("Downloading TorrServer for Linux...");
        exec(`wget https://github.com/YouRoK/TorrServer/releases/latest/download/TorrServer-linux-amd64 -O ${torrServerPath} && chmod +x ${torrServerPath}`, (err) => {
            if (err) console.error("Failed to download TorrServer", err);
            else {
                console.log("TorrServer downloaded successfully");
                startTorrServer();
            }
        });
    } else {
        startTorrServer();
    }

    
    function startTorrServer() {
        console.log("Starting TorrServer on port 8090...");
        try { execSync('pkill -9 TorrServer || true'); } catch(e) {}
        if (typeof torrProcess !== 'undefined' && torrProcess !== null) {
            torrProcess.kill();
        }
        const dbPath = path.join(binPath, 'db');
        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
        torrProcess = spawn(torrServerPath, ['-p', '8090', '-d', dbPath], { env: { ...process.env, GOGC: '50', GOMEMLIMIT: '512MiB' } });
        torrProcess.stdout.on('data', (d: any) => console.log(`[TorrServer] ${d.toString().trim()}`));
        torrProcess.stderr.on('data', (d: any) => console.error(`[TorrServer] ${d.toString().trim()}`));
        
        torrProcess.on('close', (code: number) => {
            console.log(`TorrServer exited with code ${code}. Restarting...`);
            setTimeout(startTorrServer, 3000);
        });

        // Initialize stable settings on boot
        setTimeout(async () => {
            try {
                await axios.post('http://127.0.0.1:8090/settings', {
                    action: 'set',
                    sets: { CacheSize: 33554432, ConnectionsLimit: 60, PreloadCache: 10, ReaderReadAHead: 30 }
                }, { timeout: 3000 });
                console.log("[TorrServer] Initialized default stable memory settings");
            } catch(e) {}
        }, 1500);
    }

    app.use(router);
    
    const torrProxyStream = createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, proxyTimeout: 300000, timeout: 300000 });
    const torrProxyDef = createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, proxyTimeout: 300000, timeout: 300000, on: { proxyReq: fixRequestBody } });
    
    app.use((req: any, res: any, next: any) => {
        if (req.url.startsWith('/stream')) {
            const http = require('http');
            const url = 'http://127.0.0.1:8090' + req.url;
            
            const proxyReq = http.request(url, {
                method: req.method,
                headers: req.headers
            }, (proxyRes: any) => {
                res.writeHead(proxyRes.statusCode, proxyRes.headers);
                proxyRes.pipe(res, { end: true });
            });

            proxyReq.setTimeout(0);
            
            proxyReq.on('error', (err: any) => {
                console.error('[Torrent Stream Proxy Error]', err?.message);
                if (!res.headersSent) {
                    res.status(502).send('Bad Gateway');
                }
            });
            
            req.pipe(proxyReq, { end: true });
            return;
        }
        if (req.url.startsWith('/torrents') || req.url.startsWith('/echo') || req.url.startsWith('/settings')) {
            return torrProxyDef(req, res, next);
        }
        next();
    });

    process.on('exit', () => { if (torrProcess) torrProcess.kill(); });
    process.on('SIGINT', () => { if (torrProcess) torrProcess.kill(); process.exit(); });
    process.on('SIGTERM', () => { if (torrProcess) torrProcess.kill(); process.exit(); });

}

