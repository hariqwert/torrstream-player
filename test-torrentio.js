const http = require('http');
const https = require('https');
const urlModule = require('url');

function fetchJsonUrl(urlStr) {
  return new Promise((resolve) => {
    const u = urlModule.parse(urlStr);
    const client = u.protocol === 'https:' ? https : http;
    client.get(urlStr, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

const TMDB_API_KEY = '9d83476d2e27f56748167514c69cd2b4';

async function searchExternalProviders(query) {
  console.log(`Searching TMDB + Torrentio for: "${query}" ...`);
  
  // 1. Search TMDB
  const tmdbUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  const tmdbData = await fetchJsonUrl(tmdbUrl);
  
  if (!tmdbData || !tmdbData.results || tmdbData.results.length === 0) {
    console.log('No TMDB movie found.');
    return;
  }

  const movie = tmdbData.results[0];
  console.log(`Found TMDB Movie: ${movie.title} (${movie.release_date || 'N/A'}) - ID: ${movie.id}`);

  // Get IMDb ID
  const detailUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`;
  const detailData = await fetchJsonUrl(detailUrl);
  const imdbId = detailData ? detailData.imdb_id : null;
  console.log(`IMDb ID: ${imdbId}`);

  if (imdbId) {
    // 2. Fetch Streams from Torrentio provider (from valiant-kepler)
    const torUrl = `https://torrentio.strem.fun/stream/movie/${imdbId}.json`;
    const torData = await fetchJsonUrl(torUrl);

    if (torData && torData.streams) {
      console.log(`Found ${torData.streams.length} magnet streams on Torrentio!`);
      torData.streams.slice(0, 5).forEach(s => {
        const mag = s.magnet || (s.infoHash ? `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(movie.title)}` : null);
        console.log(`  - Stream: [${s.title || s.name}] Hash: ${s.infoHash}`);
        console.log(`    Magnet: ${mag ? mag.substring(0, 80) + '...' : 'N/A'}`);
      });
    }
  }
}

searchExternalProviders('Avatar');
