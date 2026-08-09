const http = require('http');
const https = require('https');
const urlModule = require('url');

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

async function testSeriesSearch(query, season = 1, episode = 1) {
  console.log(`Testing TV Series Search: "${query}" S${season}E${episode} ...`);

  // 1. Search TMDB TV Series
  const searchUrl = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`;
  const searchData = await fetchJsonUrl(searchUrl);

  if (!searchData || !searchData.results || searchData.results.length === 0) {
    console.log('No TV series found on TMDB.');
    return;
  }

  const show = searchData.results[0];
  console.log(`Found TMDB Show: ${show.name} (TMDB ID: ${show.id}, First Aired: ${show.first_air_date})`);

  // 2. Fetch IMDb ID from external_ids
  const extUrl = `https://api.themoviedb.org/3/tv/${show.id}/external_ids?api_key=${TMDB_API_KEY}`;
  const extData = await fetchJsonUrl(extUrl);
  const imdbId = extData ? extData.imdb_id : null;
  console.log(`IMDb ID: ${imdbId}`);

  if (imdbId) {
    // 3. Query Torrentio Episode Endpoint: /stream/series/{imdb_id}:{season}:{episode}.json
    const streamUrl = `https://torrentio.strem.fun/stream/series/${imdbId}:${season}:${episode}.json`;
    console.log(`Fetching streams from Torrentio: ${streamUrl}`);
    const torData = await fetchJsonUrl(streamUrl);

    if (torData && torData.streams) {
      console.log(`Found ${torData.streams.length} episode magnet streams!`);
      torData.streams.slice(0, 3).forEach(s => {
        const mag = s.magnet || (s.infoHash ? `magnet:?xt=urn:btih:${s.infoHash}&dn=${encodeURIComponent(show.name + ' S' + season + 'E' + episode)}` : null);
        console.log(`  - [Episode Stream]: ${s.title || s.name}`);
        console.log(`    Magnet: ${mag ? mag.substring(0, 75) + '...' : 'N/A'}`);
      });
    }
  }
}

testSeriesSearch('Breaking Bad', 1, 1);
