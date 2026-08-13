const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            const options = {
                hostname: u.hostname,
                path: u.pathname + u.search,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': 'https://timstreams.st/'
                }
            };
            https.get(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ status: res.statusCode, data }));
            }).on('error', (e) => resolve({ status: 500, error: e.message }));
        } catch(e) {
            resolve({ status: 500, error: e.message });
        }
    });
}

fetchUrl('https://api.vixnuvew.uk/api/channels').then(console.log);
