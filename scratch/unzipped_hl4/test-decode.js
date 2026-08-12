const axios = require('axios');
async function test() {
    try {
        const req = await axios.get('https://logic.icelanders.st/embed/sky-sports-main-event', {
            headers: {
                'Referer': 'https://timstreams.st/'
            }
        });
        const html = req.data;
        let match = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\]\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)\s*,\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+)/);
        if (!match) {
            match = html.match(/var\s+([a-zA-Z0-9_$]+)\s*=\s*\[([\d,]+)\];\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);\s*([a-zA-Z0-9_$]+)\s*=\s*(\d+);/);
        }
        if (match) {
            const arr = match[2].split(',').map(Number);
            const arg1 = parseInt(match[4]);
            const arg2 = parseInt(match[6]);
            let decoded = "";
            for (let i = 0; i < arr.length; i++) {
                decoded += String.fromCharCode(((arr[i] ^ arg1) - arg2 + 256) % 256);
            }
            const m3u8Match = decoded.match(/https?:\/\/[^\s\'\"\\]+\.m3u8[^\s\'\"\\]*/);
            if (!m3u8Match) return console.log('No m3u8 match in:', decoded);
            console.log('Decoded URL:', m3u8Match[0]);
            
            try {
                const streamReq = await axios.get(m3u8Match[0], {
                    headers: {
                        'Referer': 'https://timstreams.st/',
                        'Origin': 'https://timstreams.st/',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                    }
                });
                console.log('M3U8 Status:', streamReq.status);
                console.log('M3U8 Data:', streamReq.data.substring(0, 200));
            } catch (err) {
                console.error('Stream Fetch Error:', err.message, err.response?.status);
            }
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
