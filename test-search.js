const http = require('http');
const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testSearch(query) {
  console.log(`Searching YTS for: "${query}" ...`);
  try {
    const url = `https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(query)}`;
    const data = await fetchJson(url);
    if (data.status === 'ok' && data.data.movies) {
      console.log(`Found ${data.data.movies.length} movies!`);
      data.data.movies.slice(0, 3).forEach(m => {
        console.log(`- ${m.title_long} (${m.rating}/10)`);
        m.torrents.forEach(t => {
          const magnet = `magnet:?xt=urn:btih:${t.hash}&dn=${encodeURIComponent(m.title)}&tr=udp://tracker.opentrackr.org:1337/announce`;
          console.log(`   [${t.quality} ${t.type}] Size: ${t.size}, Seeds: ${t.seeds}, Hash: ${t.hash}`);
        });
      });
    } else {
      console.log('No movies found or empty response.');
    }
  } catch (err) {
    console.error('Search error:', err.message);
  }
}

testSearch('Batman');
