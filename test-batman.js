const http = require('http');

const magnet = "magnet:?xt=urn:btih:69219d2092740720c37898793b0a40a6c0d879db&dn=The%20Batman&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce";

async function test() {
  console.log('1. Setting Instant Stream settings on TorrServer...');
  
  const setBody = JSON.stringify({
    action: 'set',
    sets: {
      CacheSize: 209715200,          // 200 MB Cache
      PreloadCache: 10,             // Fast 10% Prebuffer for instant start
      ReaderReadAHead: 30,          // Responsive read-ahead
      ConnectionsLimit: 120,        // High peer limit
      ResponsiveMode: true,         // Priority playhead piece download
      RetrackersMode: 1
    }
  });

  await post('/settings', setBody);
  console.log('Settings applied! Adding Batman magnet...');

  const addBody = JSON.stringify({
    action: 'add',
    link: magnet,
    save_to_db: true
  });

  const torr = await post('/torrents', addBody);
  console.log('Added Torrent Hash:', torr.hash);

  // Poll status
  let count = 0;
  const interval = setInterval(async () => {
    count++;
    const data = await post('/torrents', JSON.stringify({ action: 'get', hash: torr.hash }));
    const files = data.file_stats || data.FileStats || [];
    console.log(`[${count}s] Status: ${data.stat_string || 'N/A'}, Peers: ${data.active_peers || 0}, Speed: ${(data.download_speed/1024/1024).toFixed(2)} MB/s, Files: ${files.length}`);

    if (files.length > 0) {
      console.log('✓ METADATA READY!');
      files.forEach(f => console.log(`   - File: ${f.path} (${(f.length/1024/1024).toFixed(1)} MB)`));
      clearInterval(interval);
      process.exit(0);
    }

    if (count >= 15) {
      console.log('Polling finished.');
      clearInterval(interval);
      process.exit(0);
    }
  }, 1000);
}

function post(path, bodyStr) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8090,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr)
      }
    }, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => {
        try { resolve(JSON.parse(b)); } catch(e) { resolve(b); }
      });
    });
    req.write(bodyStr);
    req.end();
  });
}

test();
