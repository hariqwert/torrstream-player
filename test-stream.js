const http = require('http');

const magnet = "magnet:?xt=urn:btih:08da422c34d1edd7b9943842838947672808c104&dn=Sintel&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337";

console.log('Sending test magnet to TorrServer...');

const postData = JSON.stringify({
  action: 'add',
  link: magnet,
  save_to_db: true
});

const req = http.request({
  hostname: 'localhost',
  port: 8090,
  path: '/torrents',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Response HTTP Status:', res.statusCode);
    const torr = JSON.parse(body);
    console.log('Torrent Hash:', torr.hash);
    console.log('Initial file_stats length:', torr.file_stats ? torr.file_stats.length : 0);

    // Poll for files
    let pollCount = 0;
    const interval = setInterval(() => {
      pollCount++;
      const pollReq = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/torrents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, (pollRes) => {
        let pBody = '';
        pollRes.on('data', c => pBody += c);
        pollRes.on('end', () => {
          const data = JSON.parse(pBody);
          const files = data.file_stats || data.FileStats || [];
          console.log(`Poll #${pollCount}: status=${data.stat_string || 'N/A'}, filesCount=${files.length}, peers=${data.active_peers || 0}`);
          
          if (files.length > 0) {
            console.log('SUCCESS! Metadata resolved files:');
            files.forEach(f => console.log(`  - File [ID ${f.id}]: ${f.path} (${f.length} bytes)`));
            clearInterval(interval);
            process.exit(0);
          }

          if (pollCount >= 15) {
            console.log('Polling finished.');
            clearInterval(interval);
            process.exit(0);
          }
        });
      });
      pollReq.write(JSON.stringify({ action: 'get', hash: torr.hash }));
      pollReq.end();
    }, 1000);
  });
});

req.write(postData);
req.end();
