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
            timeout: 8000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });
        return res.data;
    }
    catch (e) {
        return null;
    }
}
function formatBytes(bytes, decimals = 2) {
    if (!bytes || bytes === 0)
        return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function parseSizeBytes(input) {
    if (typeof input === 'number' && !isNaN(input))
        return input;
    if (!input || typeof input !== 'string')
        return 0;
    const str = input.trim();
    const match = str.match(/([\d\.]+)\s*([GMKT]?i?B)/i);
    if (match) {
        const val = parseFloat(match[1]);
        const unit = match[2].toUpperCase().replace('I', '');
        if (unit === 'TB')
            return val * 1024 * 1024 * 1024 * 1024;
        if (unit === 'GB')
            return val * 1024 * 1024 * 1024;
        if (unit === 'MB')
            return val * 1024 * 1024;
        if (unit === 'KB')
            return val * 1024;
        if (unit === 'B')
            return val;
    }
    return 0;
}
function getStreamPriorityScore(item, isMovie) {
    let bytes = item.sizeBytes || 0;
    if (!bytes && item.size) {
        bytes = parseSizeBytes(item.size);
    }
    if (!bytes && item.raw_title) {
        bytes = parseSizeBytes(item.raw_title);
    }
    const sizeInGB = bytes / (1024 * 1024 * 1024);
    const seeders = item.seeders || item.seeds || 0;
    let tierScore = 0;
    if (isMovie) {
        if (sizeInGB >= 1.45 && sizeInGB <= 2.55) {
            tierScore = 300000;
        }
        else if (sizeInGB > 0 && sizeInGB < 1.45) {
            tierScore = 200000;
        }
        else if (sizeInGB > 2.55) {
            tierScore = 100000;
        }
        else {
            tierScore = 50000;
        }
    }
    else {
        tierScore = 100000;
    }
    return tierScore + Math.min(seeders, 9999);
}
router.get('/api/v1/search', async (req, res) => {
    let query = String(req.query.query || req.query.q || '');
    let tmdbId = String(req.query.tmdb || req.query.tmdb_id || '');
    let imdbId = String(req.query.imdb || req.query.imdb_id || '');
    let mediaType = String(req.query.type || req.query.media_type || 'movie').toLowerCase();
    if (mediaType === 'tv')
        mediaType = 'series';
    let season = parseInt(String(req.query.season || req.query.s || '1'), 10);
    let episode = parseInt(String(req.query.episode || req.query.e || '1'), 10);
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
            if (item.media_type === 'tv')
                mediaType = 'series';
            else if (item.media_type === 'movie')
                mediaType = 'movie';
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
    const streamsMap = new Map();
    const createMagnet = (hash, displayTitle) => {
        let mag = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(displayTitle)}`;
        DEFAULT_TRACKERS.forEach(tr => { mag += `&tr=${encodeURIComponent(tr)}`; });
        return mag;
    };
    const promises = [];
    const apibayQuery = imdbId || query || title;
    if (apibayQuery) {
        promises.push((async () => {
            const data = await fetchJsonUrl(`https://apibay.org/q.php?q=${encodeURIComponent(apibayQuery)}`);
            if (Array.isArray(data)) {
                data.forEach((item) => {
                    const cat = parseInt(item.category) || 0;
                    const rawTitleLower = (item.name || '').toLowerCase();
                    if (cat >= 500 && cat < 600)
                        return;
                    if (/(xxx|porn|adult|brazzers|naughty|onlyfans)/i.test(rawTitleLower))
                        return;
                    if (item.info_hash && item.info_hash !== '0000000000000000000000000000000000000000') {
                        const hash = item.info_hash.toLowerCase();
                        if (!streamsMap.has(hash)) {
                            const rawTitle = item.name || title;
                            const seeders = parseInt(item.seeders) || 0;
                            const sizeBytes = parseInt(item.size) || 0;
                            const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);
                            streamsMap.set(hash, {
                                name: 'ThePirateBay',
                                title: rawTitle,
                                raw_title: rawTitle,
                                magnet: createMagnet(hash, rawTitle),
                                infoHash: hash,
                                seeders: seeders,
                                sizeBytes: sizeBytes,
                                size: sizeBytes ? formatBytes(sizeBytes) : 'Unknown',
                                quality: qualityMatch ? qualityMatch[1] : 'HD'
                            });
                        }
                    }
                });
            }
        })());
    }
    if (mediaType === 'movie') {
        const ytsTerm = imdbId || query || title;
        if (ytsTerm) {
            promises.push((async () => {
                const data = await fetchJsonUrl(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(ytsTerm)}`);
                if (data && data.data && data.data.movies) {
                    data.data.movies.forEach((m) => {
                        if (m.torrents && Array.isArray(m.torrents)) {
                            m.torrents.forEach((t) => {
                                if (t.hash) {
                                    const hash = t.hash.toLowerCase();
                                    if (!streamsMap.has(hash)) {
                                        const rawTitle = `${m.title_long || m.title} [${t.quality}] [YTS]`;
                                        const sizeBytes = t.size_bytes || parseSizeBytes(t.size);
                                        streamsMap.set(hash, {
                                            name: 'YTS',
                                            title: rawTitle,
                                            raw_title: rawTitle,
                                            magnet: createMagnet(hash, rawTitle),
                                            infoHash: hash,
                                            seeders: t.seeds || 0,
                                            sizeBytes: sizeBytes,
                                            size: t.size || (sizeBytes ? formatBytes(sizeBytes) : 'Unknown'),
                                            quality: t.quality || '1080p'
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            })());
        }
    }
    if (imdbId) {
        const torrentioType = mediaType === 'series' ? 'series' : 'movie';
        const streamPath = torrentioType === 'series' ? `${imdbId}:${season}:${episode}` : imdbId;
        ['https://torrentio.strem.fun', 'https://knightcrawler.elfhosted.com'].forEach(baseUrl => {
            promises.push((async () => {
                const torData = await fetchJsonUrl(`${baseUrl}/stream/${torrentioType}/${streamPath}.json`);
                if (torData && torData.streams && Array.isArray(torData.streams)) {
                    torData.streams.forEach((s) => {
                        const hash = (s.infoHash || '').toLowerCase();
                        if (hash && !streamsMap.has(hash)) {
                            const rawTitle = s.title || s.name || title;
                            const seedMatch = rawTitle.match(/👤\s*(\d+)/);
                            const sizeMatch = rawTitle.match(/💾\s*([\d\.]+\s*[GMK]B)/i);
                            const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);
                            const sizeBytes = sizeMatch ? parseSizeBytes(sizeMatch[1]) : parseSizeBytes(rawTitle);
                            streamsMap.set(hash, {
                                name: s.name || 'Stremio',
                                title: `${title} ${mediaType === 'series' ? `S${season}E${episode}` : ''} (${qualityMatch ? qualityMatch[1] : '1080p'})`,
                                raw_title: rawTitle,
                                magnet: s.magnet || createMagnet(hash, title),
                                infoHash: hash,
                                seeders: seedMatch ? parseInt(seedMatch[1]) : 10,
                                sizeBytes: sizeBytes,
                                size: sizeMatch ? sizeMatch[1] : (sizeBytes ? formatBytes(sizeBytes) : 'Unknown'),
                                quality: qualityMatch ? qualityMatch[1] : 'HD'
                            });
                        }
                    });
                }
            })());
        });
    }
    await Promise.all(promises);
    const isMovie = mediaType === 'movie';
    const streams = Array.from(streamsMap.values());
    streams.sort((a, b) => {
        const scoreA = getStreamPriorityScore(a, isMovie);
        const scoreB = getStreamPriorityScore(b, isMovie);
        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }
        return (b.seeders || 0) - (a.seeders || 0);
    });
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
function getVideoDuration(streamUrl) {
    return new Promise((resolve) => {
        const args = [
            '-v', 'error',
            '-analyzeduration', '5000000',
            '-probesize', '5000000',
            '-show_entries', 'format=duration:stream=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            streamUrl
        ];
        (0, child_process_1.execFile)('ffprobe', args, { timeout: 8000 }, (error, stdout) => {
            if (!error && stdout) {
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    const exactSeconds = parseFloat(line.trim());
                    if (!isNaN(exactSeconds) && exactSeconds > 0) {
                        return resolve(exactSeconds);
                    }
                }
            }
            resolve(0);
        });
    });
}
router.get('/api/torrent/duration', async (req, res) => {
    let urlStr = (req.query.url || req.query.link || '').toString().trim();
    if (!urlStr)
        return res.status(400).json({ error: 'Missing stream URL' });
    if (urlStr.startsWith('/')) {
        const port = process.env.PORT || 3000;
        urlStr = `http://127.0.0.1:${port}${urlStr}`;
    }
    const duration = await getVideoDuration(urlStr);
    res.json({ duration });
});
function convertSrtToVtt(srtText) {
    if (!srtText)
        return 'WEBVTT\n\n';
    let vtt = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    vtt = vtt.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
    if (!vtt.trim().startsWith('WEBVTT')) {
        vtt = 'WEBVTT\n\n' + vtt;
    }
    return vtt;
}
router.get('/api/torrent/check-subtitles', async (req, res) => {
    const link = (req.query.link || req.query.hash || '').toString().trim();
    if (!link)
        return res.json({ subtitles: [] });
    try {
        let hash = link;
        if (link.startsWith('magnet:')) {
            const mMatch = link.match(/xt=urn:btih:([a-zA-Z0-9]+)/i);
            if (mMatch)
                hash = mMatch[1].toLowerCase();
        }
        let response = await axios_1.default.post('http://127.0.0.1:8090/torrents', {
            action: 'add',
            link: link,
            save_to_db: false
        }, { timeout: 5000 }).catch(() => null);
        if (!response || !response.data) {
            response = await axios_1.default.post('http://127.0.0.1:8090/torrents', {
                action: 'get',
                hash: hash
            }, { timeout: 5000 }).catch(() => null);
        }
        const torrentData = response?.data;
        const fileStats = torrentData?.file_stats || torrentData?.files || [];
        const subtitles = [];
        fileStats.forEach((f) => {
            const filePath = f.path || f.name || '';
            const lower = filePath.toLowerCase();
            if (lower.endsWith('.srt') || lower.endsWith('.vtt') || lower.endsWith('.sub') || lower.endsWith('.ass')) {
                const parts = filePath.split('/');
                const fileName = parts[parts.length - 1];
                subtitles.push({
                    id: f.id,
                    name: fileName,
                    path: filePath,
                    url: `/api/torrent/srt-proxy?link=${encodeURIComponent(link)}&index=${f.id}`
                });
            }
        });
        res.json({ subtitles });
    }
    catch (e) {
        console.error('[Check Subtitles Error]', e?.message || e);
        res.json({ subtitles: [] });
    }
});
router.get('/api/torrent/srt-proxy', async (req, res) => {
    const link = (req.query.link || '').toString().trim();
    const index = (req.query.index || '1').toString().trim();
    if (!link)
        return res.status(400).send('Missing link');
    const streamUrl = `http://127.0.0.1:8090/stream?link=${encodeURIComponent(link)}&index=${encodeURIComponent(index)}&play=1`;
    try {
        const response = await axios_1.default.get(streamUrl, {
            responseType: 'text',
            timeout: 10000
        });
        const vttContent = convertSrtToVtt(response.data);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(vttContent);
    }
    catch (e) {
        console.error('[SRT Proxy Error]', e?.message || e);
        res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
        res.send('WEBVTT\n\n');
    }
});
router.get('/api/torrent/audio-tracks', async (req, res) => {
    let urlStr = (req.query.url || '').toString().trim();
    const link = (req.query.link || '').toString().trim();
    const index = (req.query.index || '1').toString().trim();
    if (!urlStr && link) {
        urlStr = `http://127.0.0.1:8090/stream?link=${encodeURIComponent(link)}&index=${encodeURIComponent(index)}&play=1`;
    }
    if (urlStr && urlStr.startsWith('/')) {
        const port = process.env.PORT || 3000;
        urlStr = `http://127.0.0.1:${port}${urlStr}`;
    }
    if (!urlStr)
        return res.status(400).json({ tracks: [] });
    const cmd = `ffprobe -v error -select_streams a -show_entries stream=index,codec_name:stream_tags=language,title -of json "${urlStr}"`;
    (0, child_process_1.exec)(cmd, { timeout: 6000 }, (error, stdout) => {
        if (error || !stdout) {
            return res.json({ tracks: [{ index: 0, streamIndex: 0, label: 'Default Audio Track (AAC)', lang: 'default' }] });
        }
        try {
            const data = JSON.parse(stdout);
            const streams = data.streams || [];
            if (streams.length === 0) {
                return res.json({ tracks: [{ index: 0, streamIndex: 0, label: 'Default Audio Track', lang: 'default' }] });
            }
            const tracks = streams.map((st, i) => {
                const lang = st.tags?.language || st.tags?.LANGUAGE || 'und';
                const title = st.tags?.title || st.tags?.TITLE || `Track ${i + 1}`;
                const codec = st.codec_name || 'aac';
                return {
                    index: i,
                    streamIndex: st.index,
                    label: `${title} [${lang.toUpperCase()}] (${codec.toUpperCase()})`,
                    lang: lang,
                    codec: codec
                };
            });
            res.json({ tracks });
        }
        catch (e) {
            res.json({ tracks: [{ index: 0, streamIndex: 0, label: 'Default Audio Track', lang: 'default' }] });
        }
    });
});
router.all('/api/torrent/stream-ffmpeg', async (req, res) => {
    let urlStr = (req.query.url || '').toString().trim();
    const link = (req.query.link || '').toString().trim();
    const index = (req.query.index || '1').toString().trim();
    const mode = (req.query.mode || 'remux').toString().trim();
    const startTime = (req.query.startTime || req.query.ss || req.query.start || '0').toString();
    const audioTrack = (req.query.audioTrack || req.query.a || '').toString().trim();
    if (!urlStr && link) {
        urlStr = `http://127.0.0.1:8090/stream?link=${encodeURIComponent(link)}&index=${encodeURIComponent(index)}&play=1&preload=1`;
    }
    if (!urlStr)
        return res.status(400).send('Missing stream URL or torrent link');
    if (urlStr.startsWith('/')) {
        const port = process.env.PORT || 3000;
        urlStr = `http://127.0.0.1:${port}${urlStr}`;
    }
    const exactDuration = await getVideoDuration(urlStr);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Expose-Headers', 'X-Video-Duration, Content-Range, Accept-Ranges');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    if (exactDuration > 0) {
        res.setHeader('X-Video-Duration', exactDuration.toString());
    }
    if (req.method === 'HEAD')
        return res.status(200).end();
    if (req.method === 'OPTIONS')
        return res.status(204).end();
    res.status(200);
    let videoArgs = [];
    if (mode === 'transcode') {
        videoArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '24', '-threads', '0', '-pix_fmt', 'yuv420p'];
    }
    else {
        videoArgs = ['-c:v', 'copy'];
    }
    let audioArgs = ['-c:a', 'aac', '-ac', '2', '-b:a', '128k', '-ar', '44100'];
    if (audioTrack !== '') {
        const aIdx = parseInt(audioTrack, 10);
        if (!isNaN(aIdx)) {
            audioArgs = ['-map', '0:v:0', '-map', `0:a:${aIdx}`, '-c:a', 'aac', '-ac', '2', '-b:a', '128k', '-ar', '44100'];
        }
    }
    const ffmpegArgs = [
        '-loglevel', 'warning',
        '-analyzeduration', '5000000',
        '-probesize', '5000000',
        ...(startTime && startTime !== '0' ? ['-ss', startTime] : []),
        '-fflags', '+nobuffer+genpts+discardcorrupt+igndts',
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-i', urlStr,
        ...videoArgs,
        ...audioArgs,
        '-sn', '-dn',
        '-avoid_negative_ts', 'make_zero',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        'pipe:1'
    ];
    const ffmpegProcess = (0, child_process_1.spawn)('ffmpeg', ffmpegArgs);
    ffmpegProcess.stdout.pipe(res);
    ffmpegProcess.stdin.on('error', () => { });
    ffmpegProcess.stdout.on('error', () => { });
    req.on('close', () => {
        try {
            ffmpegProcess.kill('SIGKILL');
        }
        catch (e) { }
    });
});
function setupTorrentProxies(app) {
    let torrProcess = null;
    let isStarting = false;
    const isWin = process.platform === 'win32';
    const binPath = path_1.default.join(process.cwd(), 'bin');
    if (!fs_1.default.existsSync(binPath)) {
        fs_1.default.mkdirSync(binPath, { recursive: true });
    }
    const torrServerName = isWin ? 'TorrServer.exe' : 'TorrServer';
    const torrServerPath = path_1.default.join(binPath, torrServerName);
    const dbPath = path_1.default.join(binPath, 'db');
    if (!fs_1.default.existsSync(dbPath))
        fs_1.default.mkdirSync(dbPath, { recursive: true });
    const configDbPath = path_1.default.join(dbPath, 'config.db');
    const lockDbPath = path_1.default.join(dbPath, 'config.db.lock');
    if (fs_1.default.existsSync(torrServerPath)) {
        startTorrServer();
    }
    else {
        console.log(`[TorrServer] Binary not found at ${torrServerPath}`);
    }
    function cleanupDbFiles() {
        try {
            if (fs_1.default.existsSync(lockDbPath))
                fs_1.default.unlinkSync(lockDbPath);
            if (fs_1.default.existsSync(configDbPath))
                fs_1.default.unlinkSync(configDbPath);
        }
        catch (e) { }
    }
    async function isTorrServerHealthy() {
        try {
            const res = await axios_1.default.get('http://127.0.0.1:8090/echo', { timeout: 1000 });
            return res.status === 200;
        }
        catch (e) {
            return false;
        }
    }
    async function startTorrServer() {
        if (isStarting)
            return;
        isStarting = true;
        const healthy = await isTorrServerHealthy();
        if (healthy) {
            console.log("[TorrServer] Service is already running and healthy on port 8090.");
            isStarting = false;
            return;
        }
        console.log("Starting TorrServer on port 8090...");
        try {
            if (!isWin)
                (0, child_process_1.execSync)('pkill -9 TorrServer || true');
        }
        catch (e) { }
        if (torrProcess) {
            try {
                torrProcess.kill('SIGKILL');
            }
            catch (e) { }
        }
        await new Promise(r => setTimeout(r, 500));
        if (fs_1.default.existsSync(lockDbPath)) {
            try {
                fs_1.default.unlinkSync(lockDbPath);
            }
            catch (e) { }
        }
        torrProcess = (0, child_process_1.spawn)(torrServerPath, ['-p', '8090', '-d', dbPath], {
            cwd: binPath,
            env: { ...process.env, GOGC: '50', GOMEMLIMIT: '512MiB' }
        });
        torrProcess.stdout.on('data', (d) => console.log(`[TorrServer] ${d.toString().trim()}`));
        torrProcess.stderr.on('data', (d) => console.error(`[TorrServer] ${d.toString().trim()}`));
        torrProcess.on('close', (code) => {
            isStarting = false;
            console.log(`TorrServer exited with code ${code}.`);
            cleanupDbFiles();
            setTimeout(startTorrServer, 1500);
        });
        let retries = 10;
        while (retries > 0) {
            await new Promise(r => setTimeout(r, 300));
            if (await isTorrServerHealthy()) {
                break;
            }
            retries--;
        }
        isStarting = false;
        try {
            await axios_1.default.post('http://127.0.0.1:8090/settings', {
                action: 'set',
                sets: {
                    CacheSize: 209715200,
                    ConnectionsLimit: 150,
                    PreloadCache: 5,
                    ReaderReadAHead: 30,
                    ResponsiveMode: true,
                    RemoveCacheOnDrop: true,
                    TorrentDisconnectTimeout: 30
                }
            }, { timeout: 3000 });
            console.log("[TorrServer] Initialized default fast-seeking memory settings");
        }
        catch (e) { }
    }
    app.use(router);
    const handleTorrApiProxy = async (req, res, retryCount = 0) => {
        const maxRetries = 10;
        const targetUrl = `http://127.0.0.1:8090${req.originalUrl}`;
        try {
            const payload = (req.method !== 'GET' && req.method !== 'HEAD' && req.body)
                ? (typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
                : undefined;
            const response = await (0, axios_1.default)({
                method: req.method,
                url: targetUrl,
                data: payload,
                headers: {
                    'Content-Type': req.headers['content-type'] || 'application/json',
                    'User-Agent': req.headers['user-agent'] || 'StalkerPro'
                },
                timeout: 30000,
                validateStatus: () => true
            });
            res.status(response.status);
            if (typeof response.data === 'object') {
                res.setHeader('Content-Type', 'application/json');
                res.json(response.data);
            }
            else {
                res.send(response.data);
            }
        }
        catch (err) {
            if (retryCount < maxRetries) {
                if (!isStarting)
                    startTorrServer();
                await new Promise(r => setTimeout(r, 400));
                return handleTorrApiProxy(req, res, retryCount + 1);
            }
            if (!res.headersSent) {
                res.status(503).json({ status: "error", message: "TorrServer service starting up." });
            }
        }
    };
    const handleTorrStreamProxy = (req, res, retryCount = 0) => {
        const maxRetries = 5;
        const targetUrl = `http://127.0.0.1:8090${req.originalUrl}`;
        try {
            const parsedUrl = new URL(targetUrl);
            const http = require('http');
            const proxyReq = http.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: req.method,
                headers: {
                    ...req.headers,
                    host: `${parsedUrl.hostname}:${parsedUrl.port}`
                }
            }, (proxyRes) => {
                res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
                proxyRes.pipe(res);
            });
            proxyReq.setTimeout(0);
            req.on('close', () => {
                try {
                    proxyReq.destroy();
                }
                catch (e) { }
            });
            req.on('aborted', () => {
                try {
                    proxyReq.destroy();
                }
                catch (e) { }
            });
            proxyReq.on('error', async (err) => {
                if (req.destroyed || res.writableEnded)
                    return;
                if (retryCount < maxRetries) {
                    if (!isStarting)
                        startTorrServer();
                    await new Promise(r => setTimeout(r, 500));
                    return handleTorrStreamProxy(req, res, retryCount + 1);
                }
                if (!res.headersSent) {
                    res.status(503).send('Stream unavailable.');
                }
            });
            if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
                proxyReq.end();
            }
            else {
                req.pipe(proxyReq, { end: true });
            }
        }
        catch (e) {
            if (!res.headersSent) {
                res.status(503).send('Stream proxy error.');
            }
        }
    };
    app.all('/torrents', handleTorrApiProxy);
    app.all('/settings', handleTorrApiProxy);
    app.all('/echo', handleTorrApiProxy);
    app.all('/stream', handleTorrStreamProxy);
    process.on('exit', () => { if (torrProcess)
        torrProcess.kill(); });
    process.on('SIGINT', () => { if (torrProcess)
        torrProcess.kill(); process.exit(); });
    process.on('SIGTERM', () => { if (torrProcess)
        torrProcess.kill(); process.exit(); });
}
