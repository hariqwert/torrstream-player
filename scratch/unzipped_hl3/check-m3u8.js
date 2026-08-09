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
    console.log(JSON.stringify(r2.data));
}
run();
