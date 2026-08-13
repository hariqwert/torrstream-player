const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const zlib = require('zlib');
const https = require('https');

async function test() {
    const urlsStr = "https://raw.githubusercontent.com/mitthu786/tvepg/main/tataplay/epg.xml.gz";
    const urls = urlsStr.split(',').map(u => u.trim()).filter(Boolean);
    
    let allChannels = [];
    let allProgrammes = [];
    
    for (const url of urls) {
        console.log('Processing', url);
        const response = await axios.get(url, {
            timeout: 60000,
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' },
            httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        
        let buf = response.data;
        if (url.endsWith('.gz')) {
            buf = zlib.gunzipSync(buf);
        }
        const xmlText = buf.toString('utf8');
        
        console.log('XML Size', xmlText.length);
        
        const chanRegex = /<channel\s+id="([^"]+)"[^>]*>([\s\S]*?)<\/channel>/g;
        let cm;
        while((cm = chanRegex.exec(xmlText)) !== null) {
            const inner = cm[2];
            const nameM = inner.match(/<display-name[^>]*>([^<]+)<\/display-name>/);
            const iconM = inner.match(/<icon\s+src="([^"]+)"/);
            allChannels.push({
                id: cm[1],
                name: nameM ? nameM[1] : cm[1],
                logo: iconM ? iconM[1] : ``
            });
        }
        
        const progRegex = /<programme\s+start="([^"]+)"\s+stop="([^"]+)"\s+channel="([^"]+)"[^>]*>([\s\S]*?)<\/programme>/g;
        let pm;
        while((pm = progRegex.exec(xmlText)) !== null) {
            const inner = pm[4];
            const titleM = inner.match(/<title[^>]*>([^<]+)<\/title>/);
            
            allProgrammes.push({
                channel: pm[3],
                start: pm[1],
                end: pm[2],
                title: titleM ? titleM[1] : "No Title"
            });
        }
    }
    console.log('Channels:', allChannels.length, 'Progs:', allProgrammes.length);
}
test().catch(console.error);
