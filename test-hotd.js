const http = require('http');

const magnet = 'magnet:?xt=urn:btih:c77c255fba2cb5dc499613fd29c173067ae15660&dn=House%20of%20the%20Dragon&tr=http%3A%2F%2Fnyaa.tracker.wf%3A7777%2Fannounce&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Fopen.stealth.si%3A80%2Fannounce&tr=udp%3A%2F%2Ftracker.torrent.eu.org%3A451%2Fannounce&tr=udp%3A%2F%2Fexodus.desync.com%3A6969%2Fannounce&tr=udp%3A%2F%2Ftracker.dler.org%3A6969%2Fannounce&tr=udp%3A%2F%2Fopen.demonii.com%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969%2Fannounce&tr=udp%3A%2F%2Fopentracker.i2p.rocks%3A6969%2Fannounce';

function postJson(urlStr, data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);
    const req = http.request(urlStr, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch(e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

async function testHotd() {
  console.log('Adding House of the Dragon magnet to TorrServer...');
  const addRes = await postJson('http://localhost:8090/torrents', { action: 'add', link: magnet, save_to_db: true });
  console.log('Add Result:', addRes ? (addRes.hash || addRes.title) : 'Failed');

  const hash = addRes ? addRes.hash : 'c77c255fba2cb5dc499613fd29c173067ae15660';

  for (let i = 1; i <= 15; i++) {
    await new Promise(r => setTimeout(r, 1000));
    const info = await postJson('http://localhost:8090/torrents', { action: 'get', hash: hash });
    if (info && info.file_stats && info.file_stats.length > 0) {
      console.log(`✓ Metadata Resolved in ${i}s!`);
      console.log('Title:', info.title);
      console.log('Files count:', info.file_stats.length);
      info.file_stats.forEach(f => {
        console.log(`  - File [id=${f.id}]: ${f.path} (${(f.length / 1024 / 1024).toFixed(1)} MB)`);
      });
      break;
    } else {
      console.log(`[${i}s] Waiting for metadata... Peers: ${info ? (info.active_peers || info.connected_seeders) : 0}`);
    }
  }
}

testHotd();
