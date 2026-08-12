const https = require('https');

function testKey(key) {
  return new Promise((resolve) => {
    https.get(`https://api.themoviedb.org/3/trending/movie/day?api_key=${key}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ key, status: res.statusCode, resultsCount: json.results ? json.results.length : 0, error: json.status_message });
        } catch(e) {
          resolve({ key, status: res.statusCode, error: e.message });
        }
      });
    }).on('error', err => resolve({ key, error: err.message }));
  });
}

async function run() {
  console.log('Key 1:', await testKey('15d2ea6d0dc1d476efbca3eba2b9bbfb'));
  console.log('Key 2:', await testKey('9d83476d2e27f56748167514c69cd2b4'));
}
run();
