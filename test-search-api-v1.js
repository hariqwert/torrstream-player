const http = require('http');
const https = require('https');

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

async function handleSearchV1(params) {
  let query = params.query || params.q || '';
  let tmdbId = params.tmdb || params.tmdb_id || null;
  let imdbId = params.imdb || params.imdb_id || null;
  let mediaType = (params.type || params.media_type || 'movie').toLowerCase();
  let season = parseInt(params.season || params.s || '1');
  let episode = parseInt(params.episode || params.e || '1');

  console.log(`[Search V1] Params: query="${query}", tmdb="${tmdbId}", imdb="${imdbId}", type="${mediaType}", S${season}E${episode}`);

  let title = query || 'Media Stream';
  let year = '2024';

  // 1. Resolve IMDb ID if TMDB ID provided
  if (tmdbId && !imdbId) {
    const extUrl = mediaType === 'tv'
      ? `https://api.themoviedb.org/3/tv/${tmdbId}/external_ids?api_key=${TMDB_API_KEY}`
      : `https://api.themoviedb.org/3/movie/${tmdbId}?api_key=${TMDB_API_KEY}`;
    const extData = await fetchJsonUrl(extUrl);
    imdbId = extData ? extData.imdb_id : null;
    if (extData && extData.title) title = extData.title;
    if (extData && extData.name) title = extData.name;
    console.log(`Resolved TMDB ID ${tmdbId} -> IMDb ID: ${imdbId}`);
  }

  // 2. Resolve TMDB Search if query text provided and no IDs
  if (!imdbId && !tmdbId && query) {
    // Detect S01E01 pattern in query text (e.g. "Game of Thrones S02E05")
    const seMatch = query.match(/s(\d+)e(\d+)/i) || query.match(/(\d+)x(\d+)/i);
    if (seMatch) {
      season = parseInt(seMatch[1]);
      episode = parseInt(seMatch[2]);
      mediaType = 'tv';
      query = query.replace(/s\d+e\d+/i, '').replace(/\d+x\d+/i, '').trim();
    }

    const searchUrl = mediaType === 'tv'
      ? `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      : `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
    
    const searchData = await fetchJsonUrl(searchUrl);

    if (searchData && searchData.results && searchData.results.length > 0) {
      const item = searchData.results[0];
      tmdbId = item.id;
      title = item.title || item.name || query;
      year = item.release_date || item.first_air_date ? (item.release_date || item.first_air_date).substring(0, 4) : '2024';

      const extUrl = mediaType === 'tv'
        ? `https://api.themoviedb.org/3/tv/${item.id}/external_ids?api_key=${TMDB_API_KEY}`
        : `https://api.themoviedb.org/3/movie/${item.id}?api_key=${TMDB_API_KEY}`;
      const extData = await fetchJsonUrl(extUrl);
      imdbId = extData ? extData.imdb_id : null;
      console.log(`Text Search "${query}" -> Found: ${title} (IMDb: ${imdbId})`);
    }
  }

  // 3. Query Torrentio Provider for Streams (Movies or TV Series Episodes)
  let streams = [];
  if (imdbId) {
    const streamPath = mediaType === 'tv' ? `${imdbId}:${season}:${episode}` : imdbId;
    const torUrl = `https://torrentio.strem.fun/stream/${mediaType}/${streamPath}.json`;
    console.log(`Querying Torrentio: ${torUrl}`);
    const torData = await fetchJsonUrl(torUrl);

    if (torData && torData.streams && torData.streams.length > 0) {
      streams = torData.streams.map(s => {
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
          name: s.name || 'P2P Stream',
          title: rawTitle,
          resolution: qualityMatch ? qualityMatch[1] : '1080p',
          quality: qualityMatch ? qualityMatch[1] : '1080p HD',
          size: sizeMatch ? sizeMatch[1] : '1 GB',
          seeders: seedMatch ? parseInt(seedMatch[1]) : 50,
          infoHash: infoHash || '',
          magnet: magnet || '',
          play_url: `http://localhost:3000/?magnet=${encodeURIComponent(magnet || '')}`
        };
      }).filter(s => s.magnet);
    }
  }

  return {
    success: true,
    query: query,
    tmdb_id: tmdbId,
    imdb_id: imdbId,
    media_type: mediaType,
    season: mediaType === 'tv' ? season : null,
    episode: mediaType === 'tv' ? episode : null,
    title: title,
    year: year,
    total_streams: streams.length,
    streams: streams
  };
}

async function runTests() {
  console.log('--- TEST 1: TMDB Movie ID (Avatar 19995) ---');
  const res1 = await handleSearchV1({ tmdb: 19995, type: 'movie' });
  console.log(`Found ${res1.total_streams} streams for ${res1.title}! Top magnet: ${res1.streams[0]?.magnet.substring(0, 60)}...`);

  console.log('\n--- TEST 2: TV Series Search by Name & Episode (Breaking Bad S01E01) ---');
  const res2 = await handleSearchV1({ q: 'Breaking Bad S01E01', type: 'tv' });
  console.log(`Found ${res2.total_streams} streams for ${res2.title} S${res2.season}E${res2.episode}! Top stream: ${res2.streams[0]?.title}`);

  console.log('\n--- TEST 3: TV Series Search by IMDb ID (Game of Thrones tt0944947 S1 E1) ---');
  const res3 = await handleSearchV1({ imdb: 'tt0944947', type: 'tv', season: 1, episode: 1 });
  console.log(`Found ${res3.total_streams} streams for IMDb ${res3.imdb_id}! Top stream: ${res3.streams[0]?.title}`);
}

runTests();
