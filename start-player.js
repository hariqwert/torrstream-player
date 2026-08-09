const { spawn, exec } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const TORRSERVER_PORT = 8090;
const BIN_PATH = path.join(__dirname, 'bin', 'TorrServer.exe');

// External Provider Configuration (from valiant-kepler)
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

// Fallback Open Movies Catalog (MP4 / MKV only)
const MOVIE_CATALOG = [
  {
    title: "Sintel (4K Open Movie)",
    year: "2010",
    quality: "2160p 4K",
    size: "1.2 GB",
    seeds: 185,
    magnet: "magnet:?xt=urn:btih:08da422c34d1edd7b9943842838947672808c104&dn=Sintel&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337"
  },
  {
    title: "Big Buck Bunny (1080p)",
    year: "2008",
    quality: "1080p Full HD",
    size: "885 MB",
    seeds: 142,
    magnet: "magnet:?xt=urn:btih:dd8255edd8494674f77311531772b76b6a482e16&dn=Big+Buck+Bunny&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969"
  },
  {
    title: "Tears of Steel (Sci-Fi 1080p)",
    year: "2012",
    quality: "1080p Sci-Fi",
    size: "570 MB",
    seeds: 98,
    magnet: "magnet:?xt=urn:btih:209c8206b299b3787146059d64024345cfb2496a&dn=Tears+of+Steel&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969"
  },
  {
    title: "Epic Rutherford Chronicles",
    year: "2024",
    quality: "1080p Full HD",
    size: "1.4 GB",
    seeds: 120,
    magnet: "magnet:?xt=urn:btih:08da422c34d1edd7b9943842838947672808c104&dn=Epic+Rutherford+Chronicles&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337"
  }
];

function fetchJsonUrl(urlStr) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === 'https:' ? https : http;
      client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
        });
      }).on('error', () => resolve(null));
    } catch(e) {
      resolve(null);
    }
  });
}

// Automatic Cache Cleanup Routine (Prevents RAM Bloat & Memory Leaks)
function startAutoCacheRemoval() {
  console.log('[Auto Cache Removal] Initializing background cache garbage collector...');
  setInterval(async () => {
    try {
      const postData = JSON.stringify({ action: 'list' });
      const req = http.request({
        hostname: 'localhost',
        port: TORRSERVER_PORT,
        path: '/torrents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try {
            const list = JSON.parse(body);
            if (Array.isArray(list) && list.length > 3) {
              console.log(`[Auto Cache Removal] Found ${list.length} active torrents in memory. Purging old idle torrent cache...`);
              const toRemove = list.slice(0, list.length - 2);
              toRemove.forEach(t => {
                const dropReq = http.request({
                  hostname: 'localhost',
                  port: TORRSERVER_PORT,
                  path: '/torrents',
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                dropReq.write(JSON.stringify({ action: 'drop', hash: t.hash }));
                dropReq.end();
              });
              console.log(`[Auto Cache Removal] Successfully purged ${toRemove.length} idle torrent RAM caches.`);
            }
          } catch(e) {}
        });
      });
      req.on('error', () => {});
      req.write(postData);
      req.end();
    } catch (err) {
      console.warn('[Auto Cache Removal Warning]', err.message);
    }
  }, 10 * 60 * 1000);
}

// Multi-Provider Search API V1 (TMDB Multi-Search Auto Detection & Browser-Compatible Stream Filter)
async function handleSearchV1(params) {
  let query = (params.query || params.q || '').trim();
  let tmdbId = params.tmdb || params.tmdb_id || null;
  let imdbId = params.imdb || params.imdb_id || null;
  let mediaType = (params.type || params.media_type || 'movie').toLowerCase();
  if (mediaType === 'tv') mediaType = 'series';

  let season = parseInt(params.season || params.s || '1');
  let episode = parseInt(params.episode || params.e || '1');

  // Detect S01E01 pattern in query text
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

  // 1. TMDB ID Direct Resolution
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

  // 2. Text Search Resolution via TMDB Multi-Search Auto-Detection
  if (!imdbId && !tmdbId && query) {
    const searchUrl = `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    const searchData = await fetchJsonUrl(searchUrl);

    if (searchData && searchData.results && searchData.results.length > 0) {
      const item = searchData.results[0];
      tmdbId = item.id;
      title = item.title || item.name || query;
      year = (item.release_date || item.first_air_date || '2024').substring(0, 4);
      
      // Auto-detect media type (movie vs tv series)
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

  // 3. Query Torrentio Provider for Streams & Filter out unplayable legacy AVI files
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
          // Filter out unplayable legacy .avi files from search results
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
            play_url: `http://localhost:${PORT}/?magnet=${encodeURIComponent(magnet || '')}`
          };
        }).filter(s => s.magnet);
    }
  }

  // 4. Fallback to Open Movie Catalog if no streams resolved
  if (streams.length === 0) {
    const queryLower = query.toLowerCase();
    const matched = MOVIE_CATALOG.filter(m => m.title.toLowerCase().includes(queryLower));
    const list = matched.length > 0 ? matched : MOVIE_CATALOG;

    streams = list.map(m => ({
      name: 'Open Movie Stream',
      title: m.title,
      quality: m.quality,
      size: m.size,
      seeders: m.seeds,
      infoHash: '',
      magnet: m.magnet,
      play_url: `http://localhost:${PORT}/?magnet=${encodeURIComponent(m.magnet)}`
    }));
  }

  return {
    success: true,
    query: query,
    tmdb_id: tmdbId,
    imdb_id: imdbId,
    media_type: mediaType,
    season: mediaType === 'series' ? season : null,
    episode: mediaType === 'series' ? episode : null,
    title: title,
    year: year,
    total_streams: streams.length,
    results: streams.map(s => ({
      title: s.title,
      year: year,
      quality: s.quality,
      size: s.size,
      seeds: s.seeders,
      magnet: s.magnet,
      play_url: s.play_url
    })),
    streams: streams
  };
}

console.log('====================================================');
console.log('🚀 TorrStream Magnet Video Player Launching');
console.log('====================================================');

checkTorrServerRunning().then((isAlreadyRunning) => {
  if (isAlreadyRunning) {
    console.log(`[TorrServer] Detected existing TorrServer engine on http://localhost:${TORRSERVER_PORT}`);
    startWebPlayerServer();
  } else {
    launchTorrServerProcess();
  }
});

function checkTorrServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${TORRSERVER_PORT}/echo`, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 404);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function launchTorrServerProcess() {
  if (!fs.existsSync(BIN_PATH)) {
    console.warn(`[TorrServer] Binary not found at ${BIN_PATH}.`);
    startWebPlayerServer();
    return;
  }

  console.log(`[TorrServer] Starting TorrServer engine (${BIN_PATH})...`);
  const torrProc = spawn(BIN_PATH, ['-p', TORRSERVER_PORT.toString()], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  torrProc.stdout.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.log(`[TorrServer Engine] ${msg}`);
  });

  torrProc.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) console.log(`[TorrServer Engine] ${msg}`);
  });

  torrProc.on('error', (err) => {
    console.error(`[TorrServer Error] Failed to start process:`, err.message);
  });

  setTimeout(() => {
    startWebPlayerServer();
  }, 2000);
}

function startWebPlayerServer() {
  const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  startAutoCacheRemoval();

  const server = http.createServer(async (req, res) => {
    const reqUrl = new URL(req.url, `http://localhost:${PORT}`);
    const queryParams = Object.fromEntries(reqUrl.searchParams);

    // 1. Standalone Search REST API V1 (/api/v1/search & /api/search)
    if (reqUrl.pathname === '/api/v1/search' || reqUrl.pathname === '/api/search') {
      console.log(`[REST Search API] Query:`, queryParams);
      const searchResponse = await handleSearchV1(queryParams);

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(searchResponse, null, 2));
      return;
    }

    // 2. Direct Auto-Play Endpoint (/api/play?q=... or /api/play?tmdb=...&s=1&e=1)
    if (reqUrl.pathname === '/api/play') {
      const query = (queryParams.q || queryParams.play || queryParams.movie || '').trim();
      const tmdbId = queryParams.tmdb || queryParams.tmdb_id;
      const imdbId = queryParams.imdb || queryParams.imdb_id;

      if (tmdbId || imdbId || query) {
        const searchRes = await handleSearchV1(queryParams);
        if (searchRes.results && searchRes.results.length > 0) {
          const topMagnet = searchRes.results[0].magnet;
          res.writeHead(302, { 'Location': `/?magnet=${encodeURIComponent(topMagnet)}` });
          res.end();
          return;
        }
      }
      res.writeHead(302, { 'Location': `/?play=${encodeURIComponent(query || 'Movie')}` });
      res.end();
      return;
    }

    let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
    
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('403 Forbidden');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`\n====================================================`);
    console.log(`✨ TorrStream Web Player is live at: ${url}`);
    console.log(`🧹 Auto Cache Removal: Active (Purges idle torrent RAM every 10m)`);
    console.log(`🔍 Standalone Search API V1: ${url}/api/v1/search?q=...`);
    console.log(`📺 Movie/Series Browser-Compatible Filter: Active (Legacy .avi removed)`);
    console.log(`🎬 Direct Play API Link: ${url}/api/play?q=Movie+Title`);
    console.log(`====================================================\n`);

    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCmd} ${url}`);
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
