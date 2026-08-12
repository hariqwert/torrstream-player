const axios = require('axios');
async function run() {
    // 1. Get playlist through proxy
    const r = await axios.get('http://localhost:3000/live.php?token=STALKER_PRO&id=https://logic.icelanders.st/embed/abc-usa&m3u=1');
    const lines = r.data.split('\n');
    let proxiedTsUrl = '';
    for(const line of lines) {
        if (line && !line.startsWith('#')) {
            proxiedTsUrl = 'http://localhost:3000/' + line;
            break;
        }
    }
    console.log('Fetching:', proxiedTsUrl);
    
    // 2. Fetch segment through proxy
    try {
        const r2 = await axios.get(proxiedTsUrl, { responseType: 'stream' });
        console.log('Status:', r2.status);
    } catch(e) {
        console.log('Error:', e.response?.status || e.message);
    }
}
run();
