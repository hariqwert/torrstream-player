const fs = require('fs');
const path = require('path');
const https = require('https');

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch(e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function cleanName(str) {
    if (!str) return 'Unknown Channel';
    return str
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

async function run() {
    try {
        console.log('[*] Fetching TimStreams channels...');
        let timChannels = [];
        try {
            const timData = await fetchJson('https://api.timstreams.st/api/channels');
            const rawTim = timData.channels || timData;
            timChannels = rawTim.map(c => {
                let embedId = c.url;
                if (c.streams && c.streams.length > 0 && c.streams[0].url) {
                    const match = c.streams[0].url.match(/\/embed\/([^\/]+)/);
                    if (match) {
                        embedId = match[1];
                    }
                }
                return {
                    channel_id: embedId,
                    name: cleanName(c.name),
                    genre: c.genre === 1 ? 'General Entertainment' : c.genre === 2 ? 'Sports' : c.genre === 3 ? 'Movies & Cinema' : 'News & Other',
                    logo: c.logo || '',
                    source: 'timstreams'
                };
            });
            console.log(`[+] Loaded ${timChannels.length} TimStreams channels with correct embed IDs.`);
        } catch(e) {
            console.error('[!] Failed to fetch TimStreams channels:', e.message);
        }

        console.log('[*] Fetching DLHD channels from GitHub...');
        let dlhdChannels = [];
        const allowedDlhdIds = new Set(['51', '766', '302', '90', '116', '117', '118', '62', '63', '64', '67', '125', '126', '370', '446', '430', '433', '81', '758', '821', '896', '411', '409', '416', '115', '338', '335', '374', '791', '793', '305', '306', '309', '602', '767', '936', '1042', '1052', '311', '314', '646', '777', '745', '293', '145', '146', '147', '705', '272', '775', '524']);
        
        const dlhdLogoMap = {
            '51': '/assets/logos/abc_usa.svg',
            '766': '/assets/logos/abc_ny_usa.svg',
            '302': '/assets/logos/a_and_e_usa.svg',
            '90': '/assets/logos/bein_sports_mena_english_2.svg',
            '116': '/assets/logos/bein_sports_1_france.svg',
            '117': '/assets/logos/bein_sports_2_france.svg',
            '118': '/assets/logos/bein_sports_3_france.svg',
            '62': '/assets/logos/bein_sports_1_turkey.svg',
            '63': '/assets/logos/bein_sports_2_turkey.svg',
            '64': '/assets/logos/bein_sports_3_turkey.svg',
            '67': '/assets/logos/bein_sports_4_turkey.svg',
            '125': '/assets/logos/astro_supersport_3.svg',
            '126': '/assets/logos/astro_supersport_4.svg',
            '370': '/assets/logos/astro_cricket.svg',
            '446': '/assets/logos/dazn_2_spain.svg',
            '430': '/assets/logos/arena_sport_2_serbia.svg',
            '433': '/assets/logos/arena_sport_2_croatia.svg',
            '81': '/assets/logos/espn_brasil.svg',
            '758': '/assets/logos/fox_sports_2_usa.svg',
            '821': '/assets/logos/fox_sports_503_au.svg',
            '896': '/assets/logos/fanduel_sports_network_midwest.svg',
            '411': '/assets/logos/sportsnet_one.svg',
            '409': '/assets/logos/sportsnet_360.svg',
            '416': '/assets/logos/supersport_variety_1.svg',
            '115': '/assets/logos/tsn5.svg',
            '338': '/assets/logos/tnt_usa.svg',
            '335': '/assets/logos/starz.svg',
            '374': '/assets/logos/cinemax_usa.svg',
            '791': '/assets/logos/mgm_plus_usa_epix.svg',
            '793': '/assets/logos/showtime_showcase_usa.svg',
            '305': '/assets/logos/bbc_america_bbca.svg',
            '306': '/assets/logos/bet_usa.svg',
            '309': '/assets/logos/cnbc_usa.svg',
            '602': '/assets/logos/ctv_canada.svg',
            '767': '/assets/logos/cbsny_usa.svg',
            '936': '/assets/logos/canal5_mx.svg',
            '1042': '/assets/logos/sport_1_cz.svg',
            '1052': '/assets/logos/joj_sport_sk.svg',
            '311': '/assets/logos/discovery_life_channel.svg',
            '314': '/assets/logos/disney_xd.svg',
            '646': '/assets/logos/racer_tv_usa.svg',
            '777': '/assets/logos/nbc_sports_philadelphia.svg',
            '745': '/assets/logos/nat_geo_wild_usa.svg',
            '293': '/assets/logos/reelz_channel.svg',
            '145': '/assets/logos/sport_5_plus_israel.svg',
            '146': '/assets/logos/sport_5_live_israel.svg',
            '147': '/assets/logos/sport_5_star_israel.svg',
            '705': '/assets/logos/tv4_sport_live_3.svg',
            '272': '/assets/logos/v_sport_motor_sweden.svg',
            '775': '/assets/logos/fox_weather_channel.svg',
            '524': '/assets/logos/eurosport_1_spain.svg'
        };

        try {
            const dlhdData = await fetchJson('https://raw.githubusercontent.com/hariqwert/dlhd-m3u/main/channels.json');
            dlhdChannels = dlhdData.map(c => {
                const id = String(c.id || c.channel_id || c.channel_number || '');
                return {
                    raw_id: id,
                    channel_id: id ? 'dlhd-' + id : '',
                    name: cleanName(c.name || c.title),
                    genre: c.category || c.genre || 'General Entertainment',
                    logo: dlhdLogoMap[id] || c.logo || (id ? `https://dlhd.so/logo/${id}.png` : ''),
                    source: 'dlhd'
                };
            }).filter(c => Boolean(c.channel_id) && !c.channel_id.includes('undefined') && allowedDlhdIds.has(c.raw_id))
              .map(({ raw_id, ...c }) => c);
            console.log(`[+] Loaded ${dlhdChannels.length} verified active DLHD channels with custom logos.`);
        } catch(e) {
            console.error('[!] Failed to fetch DLHD channels:', e.message);
        }

        let customChannels = [];
        const outPath = path.join(__dirname, 'assets', 'channels.json');
        if (fs.existsSync(outPath)) {
            try {
                const existing = JSON.parse(fs.readFileSync(outPath, 'utf-8'));
                if (Array.isArray(existing)) {
                    customChannels = existing.filter(c => c.source !== 'timstreams' && c.source !== 'dlhd');
                    console.log(`[+] Preserved ${customChannels.length} user-custom channels.`);
                }
            } catch(e) {}
        }

        const combined = [...customChannels, ...timChannels, ...dlhdChannels];
        console.log(`[+] Total combined channels: ${combined.length}`);

        fs.writeFileSync(outPath, JSON.stringify(combined, null, 2), 'utf-8');
        console.log(`[✓] Successfully saved combined channels to ${outPath}`);
    } catch(e) {
        console.error('Error syncing channels:', e);
    }
}

run();
