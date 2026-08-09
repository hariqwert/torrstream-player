const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 8090,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, body: b }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function test() {
  console.log('Testing GET /settings...');
  http.get('http://localhost:8090/settings', res => {
    let b = '';
    res.on('data', c => b += c);
    res.on('end', () => console.log('GET /settings:', res.statusCode, b));
  });

  console.log('Testing POST /settings get...');
  const res1 = await post('/settings', { action: 'get' });
  console.log('POST /settings get:', res1.status, res1.body);
}

test();
