const axios = require('axios');
const fs = require('fs');

async function checkId(id) {
    try {
        const req = await axios.get('https://logic.icelanders.st/embed/' + id, {
            headers: { 'Referer': 'https://timstreams.st/' }
        });
        const html = req.data;
        let match = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/) || html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\];\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);/);
        if (!match) return console.log(id, 'No embed array match');
        const arr = match[2].split(',').map(Number);
        const arg1 = parseInt(match[4]);
        const arg2 = parseInt(match[6]);
        let decoded = '';
        for (let i = 0; i < arr.length; i++) decoded += String.fromCharCode(((arr[i] ^ arg1) - arg2 + 256) % 256);
        const m3u8Match = decoded.match(/https?:\/\/[^\s\'\"\\]+\.m3u8[^\s\'\"\\]*/);
        if (!m3u8Match) return console.log(id, 'No m3u8');
        const url = m3u8Match[0];
        const r2 = await axios.get(url, { headers: { 'Referer': 'https://logic.icelanders.st/', 'Origin': 'https://logic.icelanders.st/', 'User-Agent': 'Mozilla/5.0' }});
        console.log(id, '->', r2.status);
    } catch (e) {
        console.log(id, '->', e.response?.status || e.message);
    }
}

async function run() {
    await checkId('abc');
    await checkId('abc-usa');
    await checkId('accn-usa');
    await checkId('acc-network');
    await checkId('ae-usa');
}
run();
