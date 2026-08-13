"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrUpdatePlaylist = getOrUpdatePlaylist;
const express_1 = require("express");
const https_1 = __importDefault(require("https"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const stalkerAPI_1 = require("../stalkerAPI");
const router = (0, express_1.Router)();
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours for the channel list itself
let cachedPlaylist = null;
let lastFetchTime = 0;
function fetchUrl(url, referer = 'https://dlhd.st/') {
    return new Promise((resolve) => {
        try {
            const u = new URL(url);
            const options = {
                hostname: u.hostname,
                path: u.pathname + u.search,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': referer
                }
            };
            https_1.default.get(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', () => resolve(''));
        }
        catch (e) {
            resolve('');
        }
    });
}
function decodeStreamUrl(html) {
    if (!html)
        return null;
    const atobMatch = html.match(/atob\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (atobMatch) {
        try {
            const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
            if (decoded.includes('.m3u8'))
                return decoded;
        }
        catch (e) { }
    }
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
        const m3u8Match = decoded.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
        if (m3u8Match)
            return m3u8Match[0];
    }
    const directMatch = html.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
    return directMatch ? directMatch[0] : null;
}
async function resolveChannelStream(rawId) {
    const isDlhd = rawId.startsWith('dlhd-') || rawId.startsWith('dlhd_') || rawId.toLowerCase().startsWith('dlhd');
    let channelId = rawId;
    if (isDlhd) {
        channelId = channelId.replace(/^dlhd[_-]?/i, '');
    }
    if (channelId.startsWith('http://') || channelId.startsWith('https://')) {
        return channelId;
    }
    let streamUrl = null;
    let html = '';
    if (isDlhd) {
        // 1. Try DaddyLive daddy3.php player
        html = await fetchUrl(`https://hamis.romponalis.st/premiumtv/daddy3.php?id=${encodeURIComponent(channelId)}`, 'https://dlhd.st/');
        let tempUrl = decodeStreamUrl(html);
        if (tempUrl && !tempUrl.includes('premium0')) {
            streamUrl = tempUrl;
        }
        // 2. Try stream-ID.php on dlhd.st
        if (!streamUrl) {
            html = await fetchUrl(`https://dlhd.st/stream/stream-${encodeURIComponent(channelId)}.php`, 'https://dlhd.st/');
            tempUrl = decodeStreamUrl(html);
            if (tempUrl && !tempUrl.includes('premium0')) {
                streamUrl = tempUrl;
            }
        }
    }
    // 3. Fall back to timstreams embed ONLY if not a DLHD channel
    if (!streamUrl && !isDlhd) {
        html = await fetchUrl(`https://cdx-08192.website/embed/${encodeURIComponent(channelId)}`, 'https://timstreams.st/');
        streamUrl = decodeStreamUrl(html);
    }
    return streamUrl;
}
async function getOrUpdatePlaylist(force = false) {
    const now = Date.now();
    if (!force && cachedPlaylist && (now - lastFetchTime < CACHE_DURATION_MS)) {
        return cachedPlaylist;
    }
    console.log(`[*] Generating dynamic M3U playlist with internal resolvers...`);
    let m3uLines = ['#EXTM3U\n'];
    let totalStreamsCount = 0;
    let data = null;
    const channelsPath = path_1.default.join(process.cwd(), 'assets', 'channels.json');
    try {
        if (fs_1.default.existsSync(channelsPath)) {
            data = JSON.parse(fs_1.default.readFileSync(channelsPath, 'utf-8'));
            if (Array.isArray(data) && data.length > 0) {
                console.log(`[+] Loaded ${data.length} channels from local channels catalog.`);
            }
        }
    }
    catch (err) {
        console.error('[!] Failed to load local channels.json', err.message);
    }
    if (!data || !Array.isArray(data) || data.length === 0) {
        try {
            console.log('[*] Fetching TimStreams and DLHD channels to generate local catalog...');
            let timChannels = [];
            try {
                const timRes = await fetchUrl('https://timstreams.st/api/channels', 'https://timstreams.st/');
                if (timRes) {
                    const parsed = JSON.parse(timRes);
                    const rawTim = parsed.channels || parsed;
                    if (Array.isArray(rawTim)) {
                        timChannels = rawTim.map((c) => {
                            let embedId = c.url;
                            if (c.streams && c.streams.length > 0 && c.streams[0].url) {
                                const match = c.streams[0].url.match(/\/embed\/([^\/]+)/);
                                if (match)
                                    embedId = match[1];
                            }
                            return {
                                channel_id: embedId,
                                name: (c.name || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
                                genre: c.genre === 1 ? 'General Entertainment' : c.genre === 2 ? 'Sports' : c.genre === 3 ? 'Movies & Cinema' : 'News & Other',
                                logo: c.logo || '',
                                source: 'timstreams'
                            };
                        });
                    }
                }
            }
            catch (e) {
                console.error('[!] Failed to fetch TimStreams channels:', e.message);
            }
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
                const dlhdRes = await fetchUrl('https://raw.githubusercontent.com/hariqwert/dlhd-m3u/main/channels.json', 'https://github.com/');
                if (dlhdRes) {
                    const rawDlhd = JSON.parse(dlhdRes);
                    if (Array.isArray(rawDlhd)) {
                        dlhdChannels = rawDlhd.map((c) => {
                            const id = String(c.id || c.channel_id || c.channel_number || '');
                            return {
                                raw_id: id,
                                channel_id: id ? 'dlhd-' + id : '',
                                name: (c.name || c.title || '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'"),
                                genre: c.category || c.genre || 'General Entertainment',
                                logo: dlhdLogoMap[id] || c.logo || (id ? `https://dlhd.so/logo/${id}.png` : ''),
                                source: 'dlhd'
                            };
                        }).filter((c) => Boolean(c.channel_id) && !c.channel_id.includes('undefined') && allowedDlhdIds.has(c.raw_id))
                            .map(({ raw_id, ...c }) => c);
                    }
                }
            }
            catch (e) {
                console.error('[!] Failed to fetch DLHD channels:', e.message);
            }
            data = [...timChannels, ...dlhdChannels];
            if (data.length > 0) {
                fs_1.default.writeFileSync(channelsPath, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`[✓] Successfully generated and saved ${data.length} channels to ${channelsPath}`);
            }
        }
        catch (e) {
            console.error('[!] Error building channel catalog:', e.message);
        }
    }
    try {
        if (Array.isArray(data) && data.length > 0) {
            for (const ch of data) {
                if (!ch.channel_id && !ch.stream_url)
                    continue;
                totalStreamsCount++;
                const genre = ch.genre || 'Sports Channels';
                const name = ch.name || 'Unknown Channel';
                const logo = ch.logo || '';
                let streamUrl = ch.stream_url;
                if (ch.channel_id && (ch.channel_id.startsWith('http://') || ch.channel_id.startsWith('https://') || ch.source === 'custom')) {
                    streamUrl = ch.channel_id;
                }
                else if (ch.stream_url && (ch.stream_url.startsWith('http://') || ch.stream_url.startsWith('https://') || ch.source === 'custom')) {
                    streamUrl = ch.stream_url;
                }
                else if (ch.channel_id) {
                    // Always prefer dynamic resolving to prevent expired static tokens
                    streamUrl = `__HOSTURL__/live.php?token=STALKER_PRO&id=${encodeURIComponent(ch.channel_id)}&m3u=1`;
                }
                else if (ch.stream_url && ch.stream_url.includes('.m3u8')) {
                    streamUrl = `__HOSTURL__/live.php?token=STALKER_PRO&id=${encodeURIComponent(ch.stream_url)}&m3u=1`;
                }
                m3uLines.push(`#EXTINF:-1 tvg-name="${name}" tvg-logo="${logo}" group-title="${genre}",${name}\n`);
                m3uLines.push(`${streamUrl}\n`);
            }
        }
    }
    catch (e) {
        console.error("[!] Error generating playlist from channels catalog:", e.message);
    }
    cachedPlaylist = m3uLines.join('');
    lastFetchTime = Date.now();
    try {
        fs_1.default.writeFileSync(path_1.default.join(process.cwd(), 'assets', 'sports.m3u'), cachedPlaylist, 'utf-8');
    }
    catch (e) { }
    console.log(`[✓] Successfully updated sports.m3u playlist with ${totalStreamsCount} total stream items.`);
    return cachedPlaylist;
}
router.get(['/sports.m3u', '/playlist.m3u', '/dlhd.m3u'], async (req, res) => {
    // Generate base URL (e.g., http://localhost:3000 or https://your-domain.com)
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.headers['x-forwarded-host'] || req.get('host');
    const hostUrl = `${protocol}://${host}`;
    const forceRefresh = req.query.refresh === '1' || req.query.force === 'true';
    const playlist = await getOrUpdatePlaylist(forceRefresh);
    const finalPlaylist = playlist.replace(/__HOSTURL__/g, hostUrl);
    res.setHeader('Content-Type', 'application/x-mpegurl; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=2700');
    res.send(finalPlaylist);
});
// Direct playback redirect endpoint
router.get('/api/play_stream/:id', async (req, res) => {
    const rawParam = req.params.id;
    const channelId = Array.isArray(rawParam) ? rawParam[0] : (rawParam || '');
    try {
        const streamUrl = await resolveChannelStream(channelId);
        if (streamUrl) {
            if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
                res.redirect(302, streamUrl);
                return;
            }
            const stalkerEnc = stalkerAPI_1.StalkerAPI.scarletWitch('encrypt', streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1));
            const wandaEnc = stalkerAPI_1.StalkerAPI.scarletWitch('encrypt', streamUrl);
            const proxiedUrl = `/live.php?token=STALKER_PRO&stalker=${stalkerEnc}&wanda=${wandaEnc}&m3u=1`;
            res.redirect(302, proxiedUrl);
        }
        else {
            console.error(`[!] Failed to resolve stream for channel: ${channelId}`);
            res.status(404).send('Stream not found or token expired.');
        }
    }
    catch (err) {
        res.status(500).send('Error resolving stream.');
    }
});
// Dynamic stream resolver endpoint
router.get('/api/resolve_stream/:id', async (req, res) => {
    const rawParam = req.params.id;
    const channelId = Array.isArray(rawParam) ? rawParam[0] : (rawParam || '');
    try {
        const streamUrl = await resolveChannelStream(channelId);
        if (streamUrl) {
            let proxiedUrl = streamUrl;
            if (!streamUrl.startsWith('http://') && !streamUrl.startsWith('https://')) {
                const stalkerEnc = stalkerAPI_1.StalkerAPI.scarletWitch('encrypt', streamUrl.substring(0, streamUrl.lastIndexOf('/') + 1));
                const wandaEnc = stalkerAPI_1.StalkerAPI.scarletWitch('encrypt', streamUrl);
                proxiedUrl = `/live.php?token=STALKER_PRO&stalker=${stalkerEnc}&wanda=${wandaEnc}&m3u=1`;
            }
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.json({ status: 'success', url: proxiedUrl, raw_url: streamUrl });
        }
        else {
            console.error(`[!] Failed to resolve stream for channel: ${channelId}`);
            res.status(404).json({ status: 'error', message: 'Stream not found or token expired.' });
        }
    }
    catch (err) {
        res.status(500).json({ status: 'error', message: 'Error resolving stream.' });
    }
});
// JSON channels list endpoint for fast rendering
router.get('/api/sports/channels', (req, res) => {
    try {
        const channelsPath = path_1.default.join(process.cwd(), 'assets', 'channels.json');
        if (fs_1.default.existsSync(channelsPath)) {
            const data = JSON.parse(fs_1.default.readFileSync(channelsPath, 'utf8'));
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.json(data);
        }
        else {
            res.json([]);
        }
    }
    catch (e) {
        res.status(500).json({ error: 'Failed to load channels' });
    }
});
exports.default = router;
