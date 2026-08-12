const axios = require('axios');
async function test() {
    try {
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
        const m3u8Match = decoded.match(/https?:\/\/[^\s\'\"\\]+\.m3u8[^\s\'\"\\]*/);
        const url = m3u8Match[0];
        console.log('Decoded URL:', url);
        
        try {
            const r2 = await axios.get(url, { headers: { 'Referer': 'https://logic.icelanders.st/', 'Origin': 'https://logic.icelanders.st/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
            console.log('Status with logic icelanders referer:', r2.status);
        } catch(e) { console.log('Err1:', e.response?.status); }
        
        try {
            const r3 = await axios.get(url, { headers: { 'Referer': 'https://timstreams.st/', 'Origin': 'https://timstreams.st/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
            console.log('Status with timstreams referer:', r3.status);
        } catch(e) { console.log('Err2:', e.response?.status); }

        try {
            const r4 = await axios.get(url, { headers: { 'Referer': 'https://hiveatick.casadenoval.uk/', 'Origin': 'https://hiveatick.casadenoval.uk/', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
            console.log('Status with hiveatick referer:', r4.status);
        } catch(e) { console.log('Err3:', e.response?.status); }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
