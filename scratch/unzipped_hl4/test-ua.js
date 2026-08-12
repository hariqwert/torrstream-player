const axios = require('axios');
async function run() {
    const req = await axios.get('https://logic.icelanders.st/embed/abc-usa', {
        headers: { 'Referer': 'https://timstreams.st/' }
    });
    const html = req.data;
    let match = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/) || html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\];\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);/);
    const arr = match[2].split(',').map(Number);
    const arg1 = parseInt(match[4]);
    const arg2 = parseInt(match[6]);
    let decoded = '';
    for (let i = 0; i < arr.length; i++) decoded += String.fromCharCode(((arr[i] ^ arg1) - arg2 + 256) % 256);
    const m3u8Match = decoded.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
    const m3u8Url = m3u8Match[0];
    
    const r2 = await axios.get(m3u8Url, { headers: { 'Referer': 'https://logic.icelanders.st/', 'Origin': 'https://logic.icelanders.st/', 'User-Agent': 'Mozilla/5.0' }});
    const playlist = r2.data;
    
    const lines = playlist.split('\n');
    let tsUrl = '';
    for (const line of lines) {
        if (line && !line.startsWith('#')) {
            tsUrl = line.trim();
            break;
        }
    }
    
    if (!tsUrl.startsWith('http')) {
        const base = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
        tsUrl = base + tsUrl;
    }
    
    try {
        const r3 = await axios.get(tsUrl, { headers: { 'Referer': 'https://timstreams.st/', 'Origin': 'https://timstreams.st/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }});
        console.log('TS fetch status (Chrome UA):', r3.status);
    } catch(e) {
        console.log('TS fetch error (Chrome UA):', e.response?.status || e.message);
    }
    
    try {
        const r4 = await axios.get(tsUrl, { headers: { 'Referer': 'https://timstreams.st/', 'Origin': 'https://timstreams.st/', 'User-Agent': 'StalkerPro' }});
        console.log('TS fetch status (StalkerPro UA):', r4.status);
    } catch(e) {
        console.log('TS fetch error (StalkerPro UA):', e.response?.status || e.message);
    }
}
run();
