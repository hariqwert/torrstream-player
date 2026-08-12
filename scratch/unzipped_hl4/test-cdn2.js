const axios = require('axios');
const decodeStreamUrl = (html) => {
    let match = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/);
    if (!match) return null;
    const arr = match[2].split(',').map(Number);
    const arg1 = parseInt(match[4]);
    const arg2 = parseInt(match[6]);
    let decoded = "";
    for (let i = 0; i < arr.length; i++) {
        decoded += String.fromCharCode(((arr[i] ^ arg1) - arg2 + 256) % 256);
    }
    const m3u8Match = decoded.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
    return m3u8Match ? m3u8Match[0] : null;
};
(async () => {
    try {
        const embedRes = await axios.get('https://hux-giants.shop/embed/sonysportsnetwork4-in', {
            headers: { 'Referer': 'https://timstreams.st/' }
        });
        const m3u8Url = decodeStreamUrl(embedRes.data);
        console.log("M3U8 URL:", m3u8Url);
        if (m3u8Url) {
            const streamRes = await axios.get(m3u8Url, {
                headers: { 
                    'Referer': 'https://hux-giants.shop/',
                    'Origin': 'https://hux-giants.shop/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log("Stream status:", streamRes.status);
            console.log("Stream data:", streamRes.data.substring(0, 100));
        }
    } catch(e) {
        console.log("Error:", e.response ? e.response.status : e.message);
    }
})();
