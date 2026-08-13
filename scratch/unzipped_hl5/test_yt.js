const axios = require('axios');

const instances = [
    'https://invidious.flokinet.to',
    'https://invidious.privacydev.net',
    'https://iv.melmac.space',
    'https://invidious.no-matter.site',
    'https://vid.puffyan.us',
    'https://pipedapi.palvelintila.site',
    'https://pipedapi.mha.fi',
    'https://pipedapi.projectsegfau.lt',
    'https://pipedapi.adminforge.de'
];

async function testAll(videoId) {
    for (const host of instances) {
        try {
            const isPiped = host.includes('piped');
            const url = isPiped ? `${host}/streams/${videoId}` : `${host}/api/v1/videos/${videoId}`;
            console.log('Trying:', url);
            const res = await axios.get(url, { timeout: 6000 });
            if (res.data && (res.data.title || res.data.formatStreams || res.data.videoStreams)) {
                console.log('SUCCESS FOUND WORKING INSTANCE:', host);
                console.log('TITLE:', res.data.title);
                return res.data;
            }
        } catch (e) {
            console.log('FAIL:', host, e.response ? e.response.status : e.message);
        }
    }
}

testAll('P3Lq_iFeYF0');
