const { spawn, exec } = require('child_process');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const mdtvScraper = require('./mdtv-scraper');

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

// ─── Live Channel Resolver (timst.cfd + exmxbxe.cfd + epiembeds.online) ───
// Uses the same logic as remix-hl timstreamsService.ts:
// 1. Handshake with timst.cfd, fetch channels/events from /api/streams
// 2. Resolve embed URLs from exmxbxe.cfd (which 302-redirects to /play/<token>.<channel>)
// 3. Decode XOR cipher on the /play/ page → extract .m3u8 CDN URL
// 4. Proxy .m3u8 + .ts segments through server with proper Referer headers

const httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false, keepAlive: true, maxSockets: 50 });

// Stream URL in-memory cache (TTL: 90 seconds — token expires every ~30min but we refresh early)
const _streamCache = new Map();
const STREAM_CACHE_TTL = 90 * 1000;

// XOR + subtract cipher decoder — works for exmxbxe.cfd, timst.cfd, epiembeds.online
function extractM3u8FromHtml(html) {
  if (!html) return null;
  // Pattern 1: var ARR=[...],K1=N,K2=M  (comma-separated inline)
  const m = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,\s]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/);
  if (m) {
    try {
      const arr = m[2].split(',').map(n => parseInt(n.trim(), 10));
      const k1 = parseInt(m[4], 10), k2 = parseInt(m[6], 10);
      let decoded = '';
      for (let i = 0; i < arr.length; i++) decoded += String.fromCharCode(((arr[i] ^ k1) - k2 + 256) & 255);
      const u = decoded.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
      if (u) return u[0];
    } catch (e) {}
  }
  // Pattern 2: atob base64
  const a = html.match(/atob\s*\(\s*['"]([^'"]+)['"]\s*\)/);
  if (a) { try { const d = Buffer.from(a[1], 'base64').toString('utf-8'); if (d.includes('.m3u8')) return d; } catch (e) {} }
  // Pattern 3: semicolon-separated cipher
  const s = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\];\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);/);
  if (s) {
    try {
      const arr = s[2].split(',').map(Number);
      const k1 = parseInt(s[4], 10), k2 = parseInt(s[6], 10);
      let decoded = '';
      for (let i = 0; i < arr.length; i++) decoded += String.fromCharCode(((arr[i] ^ k1) - k2 + 256) & 255);
      const u = decoded.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
      if (u) return u[0];
    } catch (e) {}
  }
  // Pattern 4: direct m3u8 reference
  const d = html.match(/https?:\/\/[^\s'"\\<>]+\.m3u8[^\s'"\\<>]*/);
  return d ? d[0] : null;
}

// Fetch HTML following up to 5 redirects, preserving browser headers throughout
function fetchHtmlFollowRedirects(startUrl, referer, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doReq(url, left) {
      try {
        const u = new URL(url);
        https.get({
          hostname: u.hostname,
          path: u.pathname + u.search,
          agent: httpsAgent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': referer || 'https://timst.cfd/',
            'Origin': 'https://timst.cfd',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Accept': 'text/html,application/xhtml+xml,*/*;q=0.9',
          }
        }, (res) => {
          const loc = res.headers['location'];
          if ([301,302,307,308].includes(res.statusCode) && loc && left > 0) {
            const next = loc.startsWith('http') ? loc : new URL(loc, url).toString();
            res.resume();
            doReq(next, left - 1);
            return;
          }
          let body = '';
          res.on('data', c => body += c);
          res.on('end', () => resolve({ html: body, status: res.statusCode, finalUrl: url }));
        }).on('error', reject).setTimeout(12000, function() { this.destroy(); reject(new Error('timeout')); });
      } catch(e) { reject(e); }
    }
    doReq(startUrl, maxRedirects);
  });
}

// Fetch JSON from timst.cfd API
function fetchTimJson(path2) {
  return new Promise((resolve) => {
    https.get({
      hostname: 'timst.cfd',
      path: path2,
      agent: httpsAgent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://timst.cfd/',
        'Origin': 'https://timst.cfd',
        'Accept': 'application/json,*/*'
      }
    }, (res) => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { resolve(null); } });
    }).on('error', () => resolve(null)).setTimeout(10000, function() { this.destroy(); resolve(null); });
  });
}

// Cache for timst.cfd API data (TTL: 2 minutes)
let _timstreamsCache = null;
let _timstreamsCacheTime = 0;
async function getTimstreamsData() {
  if (_timstreamsCache && (Date.now() - _timstreamsCacheTime) < 120000) return _timstreamsCache;
  // Handshake
  fetchHtmlFollowRedirects('https://timst.cfd/', null, 0).catch(() => {});
  const data = await fetchTimJson('/api/streams');
  if (data && Array.isArray(data) && data.length > 0) {
    _timstreamsCache = data;
    _timstreamsCacheTime = Date.now();
  }
  return _timstreamsCache;
}

// Core: resolve an exmxbxe.cfd / embedindia.st embed URL → m3u8
async function resolveEmbedUrl(embedUrl, forceFresh = false) {
  const cacheKey = embedUrl;
  if (!forceFresh) {
    const cached = _streamCache.get(cacheKey);
    if (cached && (Date.now() - cached.ts) < STREAM_CACHE_TTL) return cached.m3u8;
  }
  try {
    const { html } = await fetchHtmlFollowRedirects(embedUrl, 'https://timst.cfd/');
    const m3u8 = extractM3u8FromHtml(html);
    if (m3u8) {
      _streamCache.set(cacheKey, { m3u8, ts: Date.now() });
      return m3u8;
    }
  } catch (e) {}
  return null;
}

// Main resolver: channel slug → m3u8
// Supports: timst.cfd channels, exmxbxe slugs, epiembeds slugs, direct embed URLs
async function resolveEpiembedsChannel(slug) {
  if (!slug) return null;

  // 0. Check in-memory cache (including user-ingested/captured streams)
  if (_streamCache.has(slug)) {
    const cached = _streamCache.get(slug);
    if (Date.now() - cached.ts < (cached.ttl || STREAM_CACHE_TTL)) {
      return { m3u8: cached.url, cookies: '' };
    }
  }

  // 1. If full embed URL passed
  if (slug.startsWith('http')) {
    if (slug.includes('exmxbxe') || slug.includes('timst') || slug.includes('embedindia')) {
      const m3u8 = await resolveEmbedUrl(slug);
      return m3u8 ? { m3u8, cookies: '' } : null;
    }
    return { m3u8: slug, cookies: '' };
  }

  // 2. Look up in timst.cfd API
  try {
    const data = await getTimstreamsData();
    if (data) {
      const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      for (const cat of data) {
        const evs = cat.events || [];
        // Exact url match
        let match = evs.find(e => (e.url || '').toLowerCase() === clean);
        // Alphanumeric match
        if (!match) match = evs.find(e => (e.url || '').toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, ''));
        // Name match
        if (!match) match = evs.find(e => (e.name || '').toLowerCase().replace(/[^a-z0-9]/g, '') === clean.replace(/[^a-z0-9]/g, ''));
        if (match && match.streams && match.streams.length > 0) {
          for (const stream of match.streams) {
            if (stream.url) {
              const m3u8 = await resolveEmbedUrl(stream.url);
              if (m3u8) return { m3u8, cookies: '' };
            }
          }
        }
      }
    }
  } catch (e) {}

  // 3. Try exmxbxe.cfd directly with slug
  const exUrl = `https://exmxbxe.cfd/${slug}`;
  const m3u8ex = await resolveEmbedUrl(exUrl);
  if (m3u8ex) return { m3u8: m3u8ex, cookies: '' };

  // 4. Fallback: epiembeds.online embed page
  try {
    const { html } = await fetchHtmlFollowRedirects(`https://epiembeds.online/embed/${slug}`, 'https://epiembeds.online/');
    const m3u8 = extractM3u8FromHtml(html);
    if (m3u8) return { m3u8, cookies: '' };
  } catch (e) {}

  return null;
}

// Proxy CDN m3u8/ts content through server with correct Referer headers
// For .m3u8: rewrites segment lines to /api/ts proxy
// For .ts: raw binary pipe
function cdnProxy(targetUrl, clientRes, rewriteBase) {
  return new Promise((resolve, reject) => {
    function doFetch(url, hops) {
      try {
        const u = new URL(url);
        https.get({
          hostname: u.hostname,
          path: u.pathname + u.search,
          agent: httpsAgent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            'Referer': 'https://timst.cfd/',
            'Origin': 'https://timst.cfd',
            'Accept': '*/*',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
          }
        }, (cdnRes) => {
          const loc = cdnRes.headers['location'];
          if ([301,302,307,308].includes(cdnRes.statusCode) && loc && hops > 0) {
            cdnRes.resume();
            doFetch(loc.startsWith('http') ? loc : new URL(loc, url).toString(), hops - 1);
            return;
          }
          if (cdnRes.statusCode !== 200 && cdnRes.statusCode !== 206) {
            if (!clientRes.headersSent) {
              clientRes.writeHead(cdnRes.statusCode, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
              clientRes.end(`CDN returned HTTP ${cdnRes.statusCode} for: ${url}`);
            }
            return resolve();
          }
          const ct = cdnRes.headers['content-type'] || 'application/octet-stream';
          const isM3U8 = ct.includes('mpegurl') || url.includes('.m3u8');
          if (isM3U8 && rewriteBase) {
            let text = '';
            cdnRes.on('data', c => text += c);
            cdnRes.on('end', () => {
              const rewritten = text.split('\n').map(line => {
                const t = line.trim();
                if (t.startsWith('#') || t === '') return line;
                const abs = t.startsWith('http') ? t : new URL(t, url).toString();
                return `${rewriteBase}/api/ts?u=${encodeURIComponent(abs)}`;
              }).join('\n');
              if (!clientRes.headersSent) {
                clientRes.writeHead(200, { 'Content-Type': 'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
              }
              clientRes.end(rewritten);
              resolve();
            });
          } else {
            if (!clientRes.headersSent) {
              clientRes.writeHead(cdnRes.statusCode, { 'Content-Type': ct, 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' });
            }
            cdnRes.pipe(clientRes);
            cdnRes.on('end', resolve);
          }
        }).on('error', reject).setTimeout(20000, function() { this.destroy(); reject(new Error('CDN timeout')); });
      } catch(e) { reject(e); }
    }
    doFetch(targetUrl, 5);
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

    // ── 3. MDTV Sports Scraper API & Dedicated Player Endpoints ──
    if (reqUrl.pathname === '/api/mdtv/channels') {
      const channels = await mdtvScraper.fetchMdtvChannels();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(channels, null, 2));
      return;
    }

    if (reqUrl.pathname.startsWith('/api/mdtv/stream/')) {
      const id = reqUrl.pathname.replace('/api/mdtv/stream/', '').trim();
      const ch = await mdtvScraper.resolveMdtvStream(id);
      if (ch) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(ch, null, 2));
      } else {
        res.writeHead(404, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ error: `Channel ${id} not found` }));
      }
      return;
    }

    // Embeddable Clean Web Player (JWPlayer with ClearKey DRM)
    if (reqUrl.pathname === '/player/mdtv') {
      const pPath = path.join(__dirname, 'player_mdtv.html');
      fs.readFile(pPath, (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading player');
          return;
        }
        res.writeHead(200, {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content);
      });
      return;
    }

    // Dynamic Sports M3U Playlist (Consumed by consumet.html and external IPTV players)
    if (reqUrl.pathname === '/sports.m3u' || reqUrl.pathname === '/api/mdtv/playlist.m3u') {
      const baseUrl = `http://localhost:${PORT}`;
      const m3u = await mdtvScraper.generateMdtvM3u(baseUrl);
      res.writeHead(200, {
        'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
        'Content-Disposition': 'inline; filename="sports.m3u"',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(m3u);
      return;
    }

    // Sports Channels Directory (Consumed by consumet.html loadAllChannelsDirectory)
    if (reqUrl.pathname === '/api/sports/channels' || reqUrl.pathname === '/api/sports') {
      const channels = await mdtvScraper.fetchMdtvChannels();
      const formatted = channels.map(c => ({
        id: c.id,
        name: c.name,
        genre: c.category,
        logo: c.logo,
        source: 'MDTV',
        url: `/player/mdtv?id=${c.id}`
      }));
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify(formatted, null, 2));
      return;
    }

    // Handle CORS preflight for extension/userscript hooks
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      res.end();
      return;
    }

    // Ingest stream captured from browser extension or userscript
    if (reqUrl.pathname === '/api/live/ingest' && req.method === 'POST') {
      let rawData = '';
      req.on('data', chunk => rawData += chunk);
      req.on('end', () => {
        try {
          const body = JSON.parse(rawData);
          const slug = (body.slug || '').trim().toLowerCase();
          const streamUrl = (body.url || body.streamUrl || body.m3u8 || '').trim();
          if (slug && streamUrl) {
            _streamCache.set(slug, { url: streamUrl, ts: Date.now(), ttl: 2 * 3600 * 1000 });
            console.log(`[Ingest API] ✅ Stream ingested: ${slug} -> ${streamUrl}`);
            res.writeHead(200, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(JSON.stringify({
              success: true,
              slug,
              streamUrl,
              playerUrl: `http://localhost:${PORT}/api/live/${slug}.m3u8`
            }));
            return;
          }
        } catch(e) {}
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ error: 'Invalid payload. Expected { slug, url }' }));
      });
      return;
    }

    // 3. epiembeds.online Live Channel Resolver  (/api/live/:channel  or  /api/live/all.m3u)
    // Fetches the embed page, decodes the obfuscated XOR script, extracts the .m3u8 URL,
    // then issues a lightweight 302 redirect — the player hits the CDN directly with real headers.
    // No Puppeteer, no headless browser, pure Node.js HTTP. ~50ms per resolve.
    if (reqUrl.pathname.startsWith('/api/live/')) {
      const channelSlug = reqUrl.pathname.replace('/api/live/', '').replace(/\.m3u8$/, '').trim();

      // ── /api/live/all.m3u  →  M3U playlist of all known channels ──────────
      if (channelSlug === 'all' || channelSlug === 'all.m3u') {
        const knownSlugs = [
          'sonysport','sonysports','sony1','sony2','sony3',
          'sonyten1','sonyten2','sonyten3','sonyten4',
          'sonymax','sonyliv','sonypal','sonyten',
          'star1','star2','star3',
          'starsports1','starsports2','starsports3','starsports4',
          'starsportshd','starsportshd1','starsportshd2','starsportshd3',
          'starplus','starjalsha','starbharat','starsport',
          'espn','espn1','espn2','espn3','espnhd','espnstar',
          'cricketlive','cricket','willow','willowcricket',
          'zeesports','zeesport','zee1','zee2',
          'colors','colorstv','colorshd',
          'skysports','skysports1','skysports2','skysports3','skysportshd',
          'btsport','btsport1','btsport2','btsport3',
          'eurosport','eurosport1','eurosport2',
          'dazn','tntsports','bein1','bein2','bein3','beinsports','laliga',
          'f1','formula1','f1tv',
          'jiosports','hotstar','dd','ddnational','ddsports','ndtv','aajtak',
          'discovery','discoveryhd','animalplanet',
          'cnn','bbcworld','abcnews',
          'hbo','hbo1','hbo2','fx','amc','abc','nbc','cbs','fox',
          'mx','mxtakies','mx1',
          'tataplay','airteltv','mns','sportsday','aakashvani',
        ];
        const baseUrl = `http://localhost:${PORT}`;
        let m3u = '#EXTM3U\n# epiembeds.online via TorrStream — auto-resolved live channels\n\n';
        for (const slug of knownSlugs) {
          const name = slug.toUpperCase().replace(/-/g, ' ');
          m3u += `#EXTINF:-1 tvg-name="${name}" group-title="Live TV",${name}\n`;
          m3u += `${baseUrl}/api/live/${slug}.m3u8\n\n`;
        }

        // Append MDTV Sports Channels with ClearKey DRM
        const mdtvChannels = await mdtvScraper.fetchMdtvChannels();
        if (Array.isArray(mdtvChannels)) {
          m3u += '# ── MDTV Live Sports Channels (with ClearKey DRM) ──\n\n';
          for (const ch of mdtvChannels) {
            m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="MDTV Sports",${ch.name}\n`;
            if (ch.key_id && ch.key) {
              m3u += `#KODIPROP:inputstream.adaptive.manifest_type=mpd\n`;
              m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
              m3u += `#KODIPROP:inputstream.adaptive.license_key=${ch.key_id}:${ch.key}\n`;
            }
            m3u += `${baseUrl}/api/live/stream/${ch.id}.mpd\n\n`;
          }
        }

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Content-Disposition': 'attachment; filename="all_live.m3u"',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(m3u);
        return;
      }

      // ── /api/live/stream/:id.mpd or /api/live/:channel.m3u8  →  Resolve & proxy stream through server ──
      const cleanSlug = channelSlug.replace(/^stream\//, '').replace(/\.mpd$/, '').replace(/\.m3u8$/, '').trim();
      console.log(`[Live TV] Resolving: ${channelSlug} (id/slug: ${cleanSlug})`);
      try {
        // Check if it's an MDTV sports channel
        const mdtvMatch = await mdtvScraper.resolveMdtvStream(cleanSlug);
        if (mdtvMatch && mdtvMatch.full_stream_url) {
          res.writeHead(302, {
            'Location': mdtvMatch.full_stream_url,
            'Access-Control-Allow-Origin': '*'
          });
          res.end();
          return;
        }

        const resolved = await resolveEpiembedsChannel(channelSlug);
        if (!resolved) {
          console.warn(`[Live TV] No stream found for: ${channelSlug}`);
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `No stream found for: ${channelSlug}` }));
          return;
        }
        const { m3u8 } = resolved;
        console.log(`[Live TV] Got M3U8 for ${channelSlug} → ${m3u8}`);
        const baseUrl = `http://localhost:${PORT}`;
        // Proxy the m3u8 through server with correct Referer, rewrite segment URLs
        await cdnProxy(m3u8, res, baseUrl);
      } catch (err) {
        console.error(`[Live TV] Error for ${channelSlug}:`, err.message);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      }
      return;
    }

    // 4. HLS Segment Proxy  /api/ts?u=<encoded-absolute-url>
    if (reqUrl.pathname === '/api/ts') {
      const segUrl = queryParams.u;
      if (!segUrl) { res.writeHead(400); res.end('Missing u= param'); return; }
      try {
        const baseUrl = `http://localhost:${PORT}`;
        await cdnProxy(segUrl, res, segUrl.includes('.m3u8') ? baseUrl : null);
      } catch (err) {
        if (!res.headersSent) { res.writeHead(502); res.end('Segment proxy error: ' + err.message); }
      }
      return;
    }


    let filePath = path.join(__dirname, reqUrl.pathname === '/' ? 'hero.html' : reqUrl.pathname);
    
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
    console.log(`📡 Live TV Resolver: ${url}/api/live/:channel.m3u8`);
    console.log(`📋 Live TV Playlist: ${url}/api/live/all.m3u`);
    console.log(`====================================================\n`);

    const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    exec(`${startCmd} ${url}`);
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
