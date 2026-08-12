"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StalkerAPI = void 0;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const XtreamAPI_1 = require("./xtream/XtreamAPI");
const DARK_SIDE = path_1.default.join(process.cwd(), 'doctor_strange');
const LIGHT_SIDE = path_1.default.join(process.cwd(), 'cache_stalker');
const JWT_SECRET = process.env.JWT_SECRET || 'stalker_pro_ultra_secure_secret_token_2026';
// Create folders if they do not exist
if (!fs_1.default.existsSync(DARK_SIDE)) {
    fs_1.default.mkdirSync(DARK_SIDE, { recursive: true });
}
if (!fs_1.default.existsSync(LIGHT_SIDE)) {
    fs_1.default.mkdirSync(LIGHT_SIDE, { recursive: true });
}
const httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: false
});
class StalkerAPI {
    static vision_logs(message, level = 'INFO') {
        const logFile = path_1.default.join(DARK_SIDE, 'multiverse.log');
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const formatted = `[${timestamp}] [${level}] ${message}\n`;
        fs_1.default.appendFileSync(logFile, formatted);
    }
    static getApiUrl(portalUrl) {
        return portalUrl.includes('/server/load.php') ? portalUrl : `${portalUrl}/server/load.php`;
    }
    static keyCache = new Map();
    static scarletWitch(action, data, passphrase = 'STALKER_PRO') {
        const cipherName = 'aes-256-cbc';
        const hashAlgo = 'sha256';
        let key = StalkerAPI.keyCache.get(passphrase);
        if (!key) {
            const saltStr = crypto_1.default.createHash(hashAlgo).update('CHAOS_MAGIC_SALT').digest('hex');
            const salt = Buffer.from(saltStr, 'utf8');
            key = crypto_1.default.pbkdf2Sync(passphrase, salt, 10000, 32, hashAlgo);
            StalkerAPI.keyCache.set(passphrase, key);
        }
        if (action === 'encrypt') {
            const iv = crypto_1.default.randomBytes(16);
            const cipher = crypto_1.default.createCipheriv(cipherName, key, iv);
            let ciphertext = cipher.update(data, 'utf8');
            ciphertext = Buffer.concat([ciphertext, cipher.final()]);
            const hmac = crypto_1.default.createHmac(hashAlgo, key).update(ciphertext).digest();
            const combined = Buffer.concat([iv, hmac, ciphertext]);
            return combined.toString('hex');
        }
        else if (action === 'decrypt') {
            try {
                const combined = Buffer.from(data, 'hex');
                if (combined.length < 48) {
                    return "Integrity check failed: Data is too short.";
                }
                const iv = combined.subarray(0, 16);
                const hmac = combined.subarray(16, 48);
                const ciphertext = combined.subarray(48);
                const calculatedHmac = crypto_1.default.createHmac(hashAlgo, key).update(ciphertext).digest();
                if (!crypto_1.default.timingSafeEqual(hmac, calculatedHmac)) {
                    return "Integrity check failed: Data has been tampered with.";
                }
                const decipher = crypto_1.default.createDecipheriv(cipherName, key, iv);
                let decrypted = decipher.update(ciphertext, undefined, 'utf8');
                decrypted += decipher.final('utf8');
                return decrypted;
            }
            catch (e) {
                return "Decryption failed.";
            }
        }
        return "Invalid action.";
    }
    static Stark_Industries() {
        return {
            api_endpoint: {
                img_cdn_url: "",
                epg: "https://tsepg.cf/epg.xml.gz",
                heartbeat_headers: "",
                zee5: "",
                live_channels: ""
            },
            heartbeat_api: {
                url: "",
                heartbeat: "OFF",
                cdn_type: "google",
                note: "Updated",
                updatedBy: "STALKER TEAM",
                base: "JIOTV",
                domain: "",
                headers: {
                    "x-api-key": "",
                    "User-Agent": "STALKER_PRO"
                }
            },
            STALKER_UNIVERSE: {
                "x-developed-by": "STALKER_PRO_DEV",
                token: "STALKER_PRO",
                "X-POWERED-BY": "STALKER-PRO",
                "X-GITHUB-USERNAME": "stalkerpro",
                DEV_NAME: "STALKER TEAM",
                live_cache: true
            },
            addon_service: {
                fancode: "",
                sonyliv: "",
                icc: ""
            },
            meta_data: {
                fallback_video: "https://video.twimg.com/amplify_video/1797150287292981248/pl/-GLBpWJuiNKBrdvp.m3u8",
                himg: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80",
                hname: "STALKER PRO",
                ppimg: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80",
                jpimg: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&h=250&q=80",
                Rimg: "",
                Limg: "",
                bgpic: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80",
                span: ["S", "T", "A", "L", "K", "E", "R", "P", "R", "O"],
                pstatus: "WORKING \u2705",
                plast: "2 JUNE \u267b\ufe0f",
                error: "",
                key: "STALKER_PRO",
                message1: "",
                message2: "",
                message3: "",
                message4: "",
                message5: "",
                message6: "",
                message7: "",
                message8: "",
                message9: "",
                message10: "",
                message11: "",
                message12: "",
                message13: "",
                message14: "",
                url: "",
                mac: "",
                pro_user: "PRO USER",
                latest_script: "StalkerPro v1.0.0",
                play: ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]
            },
            token_share: "",
            key: "",
            worldwide: "",
            message: [
                {
                    message: "",
                    color: "#FFD700",
                    tag_op: "<h3>",
                    tag_c: "</h3>"
                }
            ]
        };
    }
    static getMessage(christine, statusCode, rawData, portal) {
        if (rawData && typeof rawData === 'string' && rawData.includes("Authorization failed")) {
            const host_id = StalkerAPI.getHostId(portal);
            const tokenStalkerPath = path_1.default.join(DARK_SIDE, `token_${host_id}.stalker`);
            if (fs_1.default.existsSync(tokenStalkerPath))
                fs_1.default.unlinkSync(tokenStalkerPath);
            return "Authorization Expired ⚠️ Please click Re-authenticate.";
        }
        if (christine?.js?.msg)
            return christine.js.msg;
        if (statusCode === 401)
            return "Unauthorized ❌ Login expired or invalid MAC.";
        if (statusCode === 403)
            return "Forbidden 🚫 Portal blocked your request.";
        if (statusCode === 404)
            return "Not Found 🔍 Resource missing.";
        if (statusCode === 429)
            return "Too Many Requests ⚠️ Slow down or try again later.";
        if (statusCode >= 500)
            return "Server Error 💥 Portal is unstable.";
        if (!christine)
            return "Empty response ⚠️ No data received from portal: " + (portal ? portal.URL : "");
        return "Unknown error occurred.";
    }
    static async stalkerRequest(targetUrl, headersArray, method = 'GET', body = null, followRedirect = true) {
        const headers = {};
        for (const h of headersArray) {
            const colonIndex = h.indexOf(':');
            if (colonIndex !== -1) {
                const key = h.substring(0, colonIndex).trim();
                const val = h.substring(colonIndex + 1).trim();
                headers[key] = val;
            }
        }
        try {
            const response = await (0, axios_1.default)({
                url: targetUrl,
                method: method,
                headers: headers,
                data: body,
                httpsAgent,
                timeout: 20000,
                validateStatus: () => true,
                maxRedirects: followRedirect ? 5 : 0,
                responseType: 'text'
            });
            return {
                STALKER: {
                    data: response.data,
                    info: {
                        http_code: response.status,
                        content_type: response.headers['content-type'] || 'text/html',
                        redirect_url: response.headers['location'],
                        final_url: response.request?.res?.responseUrl || response.config?.url || targetUrl
                    },
                    THOR: "JANE_FOSTER",
                    LOKI: "SYLVIE",
                    DOCTOR_STRANGE: "CHRISTINE",
                    Date: new Date().toString()
                }
            };
        }
        catch (e) {
            console.error(`[StalkerAPI] stalkerRequest failed for ${targetUrl}:`, e.message);
            return {
                STALKER: {
                    data: '',
                    info: {
                        http_code: e.response?.status || 500,
                        content_type: 'text/html',
                        redirect_url: undefined,
                        final_url: targetUrl
                    },
                    THOR: "JANE_FOSTER",
                    LOKI: "SYLVIE",
                    DOCTOR_STRANGE: "CHRISTINE",
                    Date: new Date().toString()
                }
            };
        }
    }
    static image(rolex, portalUrl) {
        const fallback = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=1200&q=80";
        if (!rolex || typeof rolex !== 'string')
            return fallback;
        const cleanName = rolex.replace(/\.(png|jpg|jpeg)$/i, '');
        if (/^\d+$/.test(cleanName)) {
            return (portalUrl || '') + '/misc/logos/320/' + rolex;
        }
        else if (rolex.startsWith('http')) {
            return rolex;
        }
        else if (rolex.startsWith('/')) {
            if (!portalUrl)
                return rolex;
            try {
                const u = new URL(portalUrl);
                return u.origin + rolex;
            }
            catch (e) {
                return portalUrl + rolex;
            }
        }
        else if (rolex) {
            if (!portalUrl)
                return rolex;
            return portalUrl + '/' + rolex.replace(/^\/+/, '');
        }
        return fallback;
    }
    static match_iptv_logo(name, xmltv_id, logoMap) {
        let logo = '';
        if (!name)
            return logo;
        let clName = name.toLowerCase();
        clName = clName.replace(/\b(4k|hd|sd|fhd|hevc|h264|h265|ca|usa|uk|us|ca|canada|in|vip|backup|east|west|latino|multiaudio)\b/gi, "");
        clName = clName.replace(/[^a-z0-9]/gi, "");
        clName = clName.trim();
        if (xmltv_id && logoMap?.ids && logoMap.ids[xmltv_id.toLowerCase()]) {
            logo = logoMap.ids[xmltv_id.toLowerCase()];
        }
        else if (logoMap?.names && logoMap.names[clName]) {
            logo = logoMap.names[clName];
        }
        else {
            const synonyms = {
                "hallmark": "hallmarkchannel.us",
                "ae": "ae.us",
                "e": "e.us",
                "usa": "usanetwork.us",
                "travel": "travelchannel.us",
                "history": "historychannel.us",
                "discovery": "discoverychannel.us",
                "hgtv": "hgtv.us",
                "food": "foodnetwork.us",
                "disney": "disneychannel.us",
                "cartoon": "cartoonnetwork.us"
            };
            for (const [syn, id] of Object.entries(synonyms)) {
                if (clName === syn || clName.indexOf(syn) !== -1) {
                    if (logoMap?.ids && logoMap.ids[id]) {
                        logo = logoMap.ids[id];
                        break;
                    }
                }
            }
        }
        return logo;
    }
    static async get_iptv_org_logo_map() {
        const cacheFile = path_1.default.join(DARK_SIDE, 'iptv_logo_map.json');
        if (fs_1.default.existsSync(cacheFile)) {
            try {
                const stat = fs_1.default.statSync(cacheFile);
                // 7 days cache limit (7 * 24 * 60 * 60 * 1000)
                if (Date.now() - stat.mtimeMs < 7 * 86400 * 1000) {
                    const data = JSON.parse(fs_1.default.readFileSync(cacheFile, 'utf8'));
                    if (data && data.ids && data.names) {
                        return data;
                    }
                }
            }
            catch (e) {
                // ignore and rebuild
            }
        }
        this.vision_logs("Fetching latest logos from iptv-org to populate cache...");
        try {
            const contextOptions = {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) IPTV-Player'
                },
                timeout: 8000,
                httpsAgent
            };
            const logosRes = await axios_1.default.get("https://iptv-org.github.io/api/logos.json", contextOptions);
            const channelsRes = await axios_1.default.get("https://iptv-org.github.io/api/channels.json", contextOptions);
            const logos = logosRes.data;
            const channels = channelsRes.data;
            if (Array.isArray(logos) && Array.isArray(channels)) {
                const logo_map = {};
                for (const lg of logos) {
                    if (lg?.url) {
                        logo_map[lg.channel.toLowerCase()] = lg.url;
                    }
                }
                const compiled_map = {
                    ids: logo_map,
                    names: {}
                };
                for (const ch of channels) {
                    const id = ch?.id?.toLowerCase();
                    if (id && logo_map[id]) {
                        const logo_url = logo_map[id];
                        let cl_name = ch.name ? ch.name.toLowerCase() : '';
                        cl_name = cl_name.replace(/\b(4k|hd|sd|fhd|hevc|h264|h265|ca|usa|uk|us|ca|canada|in|vip|backup|east|west|latino|multiaudio)\b/gi, "");
                        cl_name = cl_name.replace(/[^a-z0-9]/gi, "");
                        cl_name = cl_name.trim();
                        if (cl_name) {
                            compiled_map.names[cl_name] = logo_url;
                        }
                        if (ch.alt_names && Array.isArray(ch.alt_names)) {
                            for (const alt of ch.alt_names) {
                                let cl_alt = alt ? alt.toLowerCase() : '';
                                cl_alt = cl_alt.replace(/\b(4k|hd|sd|fhd|hevc|h264|h265|ca|usa|uk|us|ca|canada|in|vip|backup|east|west|latino|multiaudio)\b/gi, "");
                                cl_alt = cl_alt.replace(/[^a-z0-9]/gi, "");
                                cl_alt = cl_alt.trim();
                                if (cl_alt) {
                                    compiled_map.names[cl_alt] = logo_url;
                                }
                            }
                        }
                    }
                }
                fs_1.default.writeFileSync(cacheFile, JSON.stringify(compiled_map, null, 2), 'utf8');
                return compiled_map;
            }
        }
        catch (err) {
            this.vision_logs("Failed to download logo data from iptv-org. Falling back to cache.");
        }
        if (fs_1.default.existsSync(cacheFile)) {
            try {
                return JSON.parse(fs_1.default.readFileSync(cacheFile, 'utf8'));
            }
            catch (e) {
                // ignore
            }
        }
        return { ids: {}, names: {} };
    }
    static id_generator(cmd) {
        let clean = (cmd || '').trim();
        if (clean.includes('http://localhost/ch/')) {
            clean = clean.replace(/ffrt http:\/\/localhost\/ch\//i, '');
            clean = clean.replace(/ffmpeg http:\/\/localhost\/ch\//i, '');
        }
        else if (clean.includes('http:///ch/')) {
            clean = clean.replace(/ffrt http:\/\/\/ch\//i, '');
            clean = clean.replace(/ffmpeg http:\/\/\/ch\//i, '');
        }
        else if (clean.includes('auto ')) {
            clean = Buffer.from(clean.replace('auto ', '')).toString('base64');
        }
        else {
            clean = clean.replace(/^ffrt\s+/i, '').replace(/^ffmpeg\s+/i, '');
        }
        return clean.trim();
    }
    static async handshake(portal, token = '') {
        const time = Math.floor(Date.now() / 1000);
        const url = `${StalkerAPI.getApiUrl(portal.URL)}?type=stb&action=handshake&token=${token}&JsHttpRequest=1-xml`;
        const headers = [
            "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
            "Connection: Keep-Alive",
            `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
            `Referer: ${portal.URL}/c/`,
            `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`
        ];
        const response = await this.stalkerRequest(url, headers, 'GET');
        if (response.STALKER.info.http_code === 404) {
            console.error(`[StalkerAPI] 404 error fetching from ${url}`);
        }
        let parsed = null;
        try {
            parsed = JSON.parse(response.STALKER.data);
        }
        catch (e) {
            // ignore
        }
        const statusCode = response.STALKER.info.http_code;
        if (parsed?.js?.token && statusCode === 200) {
            this.vision_logs(`Handshake Successful. Token generated for: ${portal.URL}`);
            return {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    generated_time: token ? portal.generated_time || time : time,
                    message: "Handshake token generated successfully.",
                    Token: parsed.js.token,
                    Random: parsed.js.random,
                    URL: portal.URL,
                    Statuscode: statusCode,
                    data: parsed
                }
            };
        }
        else {
            this.vision_logs(`Handshake Failed for ${portal.URL} - Code: ${statusCode}`, "ERROR");
            return {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                    block_msg: parsed?.js?.block_msg,
                    Statuscode: statusCode,
                    data: parsed,
                    raw: response.STALKER.data
                }
            };
        }
    }
    static async get_profile(portal, token = '') {
        let handshakeResult = null;
        if (token) {
            handshakeResult = await this.handshake(portal, token);
            if (!handshakeResult?.STALKER?.Token || handshakeResult.STALKER.Statuscode !== 200) {
                this.vision_logs("Handshake with cached token failed. Falling back to fresh handshake.");
                handshakeResult = await this.handshake(portal);
            }
        }
        else {
            handshakeResult = await this.handshake(portal);
        }
        if (!handshakeResult?.STALKER?.Token || handshakeResult.STALKER.Statuscode !== 200) {
            return JSON.stringify(handshakeResult);
        }
        const activeToken = handshakeResult.STALKER.Token;
        const genTime = handshakeResult.STALKER.generated_time;
        if (!token) {
            portal.generated_time = genTime;
        }
        const base = StalkerAPI.getApiUrl(portal.URL);
        const params = new URLSearchParams({
            type: "stb",
            action: "get_profile",
            hd: "1",
            ver: "ImageDescription: 0.2.18-r14-pub-250; ImageDate: Fri Jan 15 15:20:44 EET 2016; PORTAL version: 5.1.0; API Version: JS API version: 328; STB API version: 134; Player Engine version: 0x566",
            num_banks: "2",
            sn: portal.SN,
            stb_type: portal.Model,
            image_version: "218",
            video_out: "hdmi",
            device_id: portal.D1,
            device_id2: portal.D2,
            signature: portal.API,
            auth_second_step: "1",
            hw_version: portal.hw_version || '',
            not_valid_token: "0",
            client_type: "STB",
            hw_version_2: portal.hw_version_2 || '',
            timestamp: Math.floor(Date.now() / 1000).toString(),
            api_signature: "263",
            metrics: JSON.stringify({
                mac: portal.MAC,
                sn: portal.SN,
                model: portal.Model,
                type: "STB",
                uid: "",
                random: handshakeResult.STALKER.Random
            }),
            JsHttpRequest: "1-xml"
        });
        const targetUrl = `${base}?${params.toString()}`;
        const headers = [
            "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
            "Connection: Keep-Alive",
            `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
            `Referer: ${portal.URL}/c/`,
            `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
            `Authorization: Bearer ${activeToken}`
        ];
        const response = await this.stalkerRequest(targetUrl, headers, 'GET');
        let parsed = null;
        try {
            parsed = JSON.parse(response.STALKER.data);
        }
        catch (e) {
            // ignore
        }
        const statusCode = response.STALKER.info.http_code;
        if (parsed?.js?.password && statusCode === 200) {
            const host_id = StalkerAPI.getHostId(portal);
            const tokenPath = path_1.default.join(DARK_SIDE, `token_${host_id}.stalker`);
            const livePath = path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`);
            const genrePath = path_1.default.join(DARK_SIDE, `genre_${host_id}.json`);
            if (fs_1.default.existsSync(tokenPath))
                fs_1.default.unlinkSync(tokenPath);
            if (fs_1.default.existsSync(livePath))
                fs_1.default.unlinkSync(livePath);
            if (fs_1.default.existsSync(genrePath))
                fs_1.default.unlinkSync(genrePath);
            // Clear directory cache_stalker
            const cachedFiles = fs_1.default.readdirSync(LIGHT_SIDE);
            for (const file of cachedFiles) {
                try {
                    // Only delete files that are related to THIS host if possible, 
                    // but for now clearing all is fine or we can prefix them.
                    fs_1.default.unlinkSync(path_1.default.join(LIGHT_SIDE, file));
                }
                catch (e) {
                    // ignore
                }
            }
            const loginPath = path_1.default.join(DARK_SIDE, 'login.stalker');
            if (!portal.type)
                portal.type = 'stalker';
            // Only write to login.stalker if it doesn't exist (initial setup)
            if (!fs_1.default.existsSync(loginPath)) {
                fs_1.default.writeFileSync(loginPath, JSON.stringify(portal), 'utf8');
            }
            const host = new URL(portal.URL).host;
            fs_1.default.writeFileSync(path_1.default.join(DARK_SIDE, `${host}.json`), JSON.stringify(portal), 'utf8');
            const exp = parsed.js.expirydate || parsed.js.expire_billing_date || "Unlimited";
            const name = parsed.js.name || parsed.js.fname || "Guest User";
            const result = {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: "Stalker data Fetched Successfully.",
                    generated_time: genTime,
                    Token: activeToken,
                    device_id: portal.D1,
                    device_id2: portal.D2,
                    sig: portal.SN,
                    settings_password: parsed.js.parent_password || "0000",
                    Random: handshakeResult.STALKER.Random,
                    URL: portal.URL + "/c/",
                    Name: name,
                    login: parsed.js.login || null,
                    Password: parsed.js.password || null,
                    parent_password: parsed.js.parent_password || "0000",
                    mac: parsed.js.mac || null,
                    expirydate: exp,
                    statusCode: statusCode,
                    Date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    handshake: handshakeResult,
                    data: parsed
                }
            };
            fs_1.default.writeFileSync(tokenPath, JSON.stringify(result, null, 2), 'utf8');
            return JSON.stringify(result);
        }
        else {
            return JSON.stringify({
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                    Statuscode: statusCode || handshakeResult.STALKER.Statuscode,
                    raw: response.STALKER.data,
                    data: parsed
                }
            });
        }
    }
    static async getXtreamProfile(config) {
        try {
            const api = new XtreamAPI_1.XtreamAPI(config);
            const data = await api.authenticate();
            const expEpoch = data.user_info.exp_date ? parseInt(data.user_info.exp_date) : null;
            let expiryDate = "Unlimited";
            if (expEpoch) {
                expiryDate = new Date(expEpoch * 1000).toISOString().replace('T', ' ').substring(0, 19);
            }
            const name = data.user_info.username || "Xtream User";
            const result = {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: "Xtream Codes details fetched successfully",
                    type: "xtream",
                    URL: config.URL,
                    username: config.username,
                    Name: name,
                    expirydate: expiryDate,
                    statusCode: 200,
                    Date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    data: data
                }
            };
            const host = new URL(config.URL).host;
            const tokenPath = path_1.default.join(DARK_SIDE, `token_${host}.stalker`);
            fs_1.default.writeFileSync(tokenPath, JSON.stringify(result, null, 2), 'utf8');
            const loginPath = path_1.default.join(DARK_SIDE, 'login.stalker');
            if (!config.type)
                config.type = 'xtream';
            if (!fs_1.default.existsSync(loginPath)) {
                fs_1.default.writeFileSync(loginPath, JSON.stringify(config, null, 2), 'utf8');
            }
            fs_1.default.writeFileSync(path_1.default.join(DARK_SIDE, `xtream_${host}.json`), JSON.stringify(config, null, 2), 'utf8');
            const livePath = path_1.default.join(DARK_SIDE, `live_${host}.stalker`);
            if (fs_1.default.existsSync(livePath))
                fs_1.default.unlinkSync(livePath);
            return JSON.stringify(result);
        }
        catch (e) {
            return JSON.stringify({
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: `Authentication failed: ${e.message}`,
                    statusCode: e.response?.status || 401
                }
            });
        }
    }
    static async getXtreamChannels(config) {
        const host_id = StalkerAPI.getHostId(config);
        const liveCacheFile = path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`);
        if (fs_1.default.existsSync(liveCacheFile)) {
            this.vision_logs("Loading channels from local cache (Xtream).");
            return fs_1.default.readFileSync(liveCacheFile, 'utf8');
        }
        try {
            this.vision_logs("Fetching channels and categories from Xtream Codes Portal...");
            const api = new XtreamAPI_1.XtreamAPI(config);
            const categories = await api.getLiveCategories();
            const streams = await api.getLiveStreams();
            if (!Array.isArray(streams) && streams?.error) {
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: "Xtream API Error: " + streams.error,
                        statusCode: 500,
                        Date: new Date().toISOString()
                    }
                });
            }
            const categoryMap = {};
            if (Array.isArray(categories)) {
                for (const cat of categories) {
                    if (cat.category_id && cat.category_name) {
                        categoryMap[cat.category_id.toString()] = cat.category_name;
                    }
                }
            }
            const logoMap = await this.get_iptv_org_logo_map();
            const globalConfig = this.Stark_Industries();
            const channelsList = [];
            if (Array.isArray(streams)) {
                for (const item of streams) {
                    const catId = item.category_id ? item.category_id.toString() : '0';
                    const genreName = categoryMap[catId] || 'Uncategorized';
                    const name = item.name || '';
                    const streamId = item.stream_id ? item.stream_id.toString() : '';
                    if (!streamId)
                        continue;
                    const portalLogo = item.stream_icon || '';
                    let logo = '';
                    const isPlaceholder = !portalLogo ||
                        portalLogo === globalConfig.meta_data.himg ||
                        portalLogo.includes('unsplash.com');
                    if (isPlaceholder) {
                        logo = this.match_iptv_logo(name, item.epg_channel_id || '', logoMap);
                    }
                    if (!logo) {
                        logo = portalLogo;
                    }
                    channelsList.push({
                        id: `xtream_live_${streamId}`,
                        Name: name,
                        number: item.num ? item.num.toString() : '0',
                        logo: logo,
                        cmd: `xtream_live_${streamId}`,
                        genre: genreName,
                        playback_url: `xtream_live_${streamId}`,
                        tv_genre_id: catId,
                        xmltv_id: item.epg_channel_id || ''
                    });
                }
            }
            if (channelsList.length > 0) {
                const out = JSON.stringify(channelsList);
                fs_1.default.writeFileSync(liveCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify({ error: "No channels found in this Xtream Portal" });
            }
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Xtream Channels: ${e.message}`, "ERROR");
            return JSON.stringify({ error: `Xtream Fetch Error: ${e.message}` });
        }
    }
    static async getXtreamMovies(config) {
        const host_id = StalkerAPI.getHostId(config);
        const moviesCacheFile = path_1.default.join(DARK_SIDE, `movies_${host_id}.stalker`);
        if (fs_1.default.existsSync(moviesCacheFile)) {
            this.vision_logs(`Loading movies from local cache (Xtream): ${host_id}`);
            return fs_1.default.readFileSync(moviesCacheFile, 'utf8');
        }
        try {
            this.vision_logs("Fetching movies and categories from Xtream Codes Portal...");
            const api = new XtreamAPI_1.XtreamAPI(config);
            const categories = await api.getVodCategories();
            const streams = await api.getVodStreams();
            if (!Array.isArray(streams) && streams?.error) {
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: "Xtream API Error: " + streams.error,
                        statusCode: 500,
                        Date: new Date().toISOString()
                    }
                });
            }
            const categoryMap = {};
            if (Array.isArray(categories)) {
                for (const cat of categories) {
                    if (cat.category_id && cat.category_name) {
                        categoryMap[cat.category_id.toString()] = cat.category_name;
                    }
                }
            }
            const moviesList = [];
            if (Array.isArray(streams)) {
                for (const item of streams) {
                    const catId = item.category_id ? item.category_id.toString() : '0';
                    const genreName = categoryMap[catId] || 'Uncategorized';
                    const name = item.name || '';
                    const streamId = item.stream_id ? item.stream_id.toString() : '';
                    const ext = item.container_extension || 'mp4';
                    if (!streamId)
                        continue;
                    const logo = item.stream_icon || '';
                    moviesList.push({
                        id: `xtream_movie_${streamId}_${ext}`,
                        Name: name,
                        number: item.num ? item.num.toString() : '0',
                        logo: logo,
                        cmd: `xtream_movie_${streamId}_${ext}`,
                        genre: genreName,
                        playback_url: `xtream_movie_${streamId}_${ext}`,
                        tv_genre_id: catId,
                        xmltv_id: '',
                        media_type: 'movie',
                        rating: item.rating || '',
                        year: item.year || ''
                    });
                }
            }
            if (moviesList.length > 0) {
                const out = JSON.stringify(moviesList);
                fs_1.default.writeFileSync(moviesCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify([]);
            }
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Xtream Movies: ${e.message}`, "ERROR");
            return JSON.stringify({ error: `Xtream Movie Fetch Error: ${e.message}` });
        }
    }
    static async getXtreamSeries(config) {
        const host_id = StalkerAPI.getHostId(config);
        const seriesCacheFile = path_1.default.join(DARK_SIDE, `series_${host_id}.stalker`);
        if (fs_1.default.existsSync(seriesCacheFile)) {
            this.vision_logs(`Loading series from local cache (Xtream): ${host_id}`);
            return fs_1.default.readFileSync(seriesCacheFile, 'utf8');
        }
        try {
            this.vision_logs("Fetching series and categories from Xtream Codes Portal...");
            const api = new XtreamAPI_1.XtreamAPI(config);
            const categories = await api.getSeriesCategories();
            const series = await api.getSeries();
            if (!Array.isArray(series) && series?.error) {
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: "Xtream API Error: " + series.error,
                        statusCode: 500,
                        Date: new Date().toISOString()
                    }
                });
            }
            const categoryMap = {};
            if (Array.isArray(categories)) {
                for (const cat of categories) {
                    if (cat.category_id && cat.category_name) {
                        categoryMap[cat.category_id.toString()] = cat.category_name;
                    }
                }
            }
            const seriesList = [];
            if (Array.isArray(series)) {
                for (const item of series) {
                    const catId = item.category_id ? item.category_id.toString() : '0';
                    const genreName = categoryMap[catId] || 'Uncategorized';
                    const name = item.name || '';
                    const seriesId = item.series_id ? item.series_id.toString() : '';
                    if (!seriesId)
                        continue;
                    const logo = item.last_modified ? item.cover : (item.cover || '');
                    seriesList.push({
                        id: `xtream_series_${seriesId}`,
                        Name: name,
                        number: item.num ? item.num.toString() : '0',
                        logo: logo,
                        cmd: `xtream_series_${seriesId}`,
                        genre: genreName,
                        playback_url: `xtream_series_${seriesId}`,
                        tv_genre_id: catId,
                        xmltv_id: '',
                        media_type: 'series',
                        rating: item.rating || '',
                        releaseDate: item.releaseDate || ''
                    });
                }
            }
            if (seriesList.length > 0) {
                const out = JSON.stringify(seriesList);
                fs_1.default.writeFileSync(seriesCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify([]);
            }
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Xtream Series: ${e.message}`, "ERROR");
            return JSON.stringify({ error: `Xtream Series Fetch Error: ${e.message}` });
        }
    }
    static async getXtreamSeriesInfo(config, seriesId) {
        try {
            const cleanId = seriesId.replace('xtream_series_', '').replace('stalker_series_', '');
            const api = new XtreamAPI_1.XtreamAPI(config);
            const data = await api.getSeriesInfo(cleanId);
            return JSON.stringify(data);
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Xtream Series Info for ${seriesId}: ${e.message}`, "ERROR");
            return JSON.stringify({ error: e.message });
        }
    }
    static async getStalkerMovies(portal) {
        const host_id = StalkerAPI.getHostId(portal);
        const moviesCacheFile = path_1.default.join(DARK_SIDE, `movies_${host_id}.stalker`);
        if (fs_1.default.existsSync(moviesCacheFile)) {
            this.vision_logs(`Loading movies from local cache (Stalker): ${host_id}`);
            return fs_1.default.readFileSync(moviesCacheFile, 'utf8');
        }
        try {
            this.vision_logs("Fetching movies from Stalker Portal VOD...");
            const auth = await this.validation(portal);
            if (auth.error) {
                return JSON.stringify({ error: auth.error });
            }
            const catUrl = `${StalkerAPI.getApiUrl(portal.URL)}?type=vod&action=get_categories&JsHttpRequest=1-xml`;
            const headers = [
                "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
                `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
                `Referer: ${portal.URL}/c/`,
                `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
                `Authorization: Bearer ${auth.Token || ''}`
            ];
            const catRes = await this.stalkerRequest(catUrl, headers, 'GET');
            let catParsed = null;
            try {
                catParsed = JSON.parse(catRes.STALKER.data);
            }
            catch (e) { }
            const categories = catParsed?.js || [];
            const moviesList = [];
            if (Array.isArray(categories)) {
                const fetchPromises = categories.map(async (cat) => {
                    const catId = cat.id;
                    const catTitle = cat.title || cat.name || 'Uncategorized';
                    if (!catId)
                        return;
                    const listUrl = `${StalkerAPI.getApiUrl(portal.URL)}?type=vod&action=get_ordered_list&category=${catId}&JsHttpRequest=1-xml`;
                    const listRes = await this.stalkerRequest(listUrl, headers, 'GET');
                    let listParsed = null;
                    try {
                        listParsed = JSON.parse(listRes.STALKER.data);
                    }
                    catch (e) { }
                    const items = listParsed?.js?.data || listParsed?.js || [];
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            if (!item.id && !item.movie_id)
                                continue;
                            const id = item.id || item.movie_id;
                            const name = item.name || item.title || '';
                            const cmd = item.cmd || '';
                            const logo = this.image(item.logo || item.image || item.screenshot, portal.URL);
                            moviesList.push({
                                id: `stalker_movie_${id}`,
                                Name: name,
                                number: '0',
                                logo: logo,
                                cmd: cmd,
                                genre: catTitle,
                                playback_url: `stalker_movie_${id}`,
                                tv_genre_id: catId.toString(),
                                xmltv_id: '',
                                media_type: 'movie',
                                rating: item.rating || '',
                                year: item.year || ''
                            });
                        }
                    }
                });
                await Promise.all(fetchPromises);
            }
            if (moviesList.length > 0) {
                const out = JSON.stringify(moviesList);
                fs_1.default.writeFileSync(moviesCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify([]);
            }
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Stalker Movies: ${e.message}`, "ERROR");
            return JSON.stringify({ error: `Stalker Movie Fetch Error: ${e.message}` });
        }
    }
    static async getStalkerSeries(portal) {
        const host_id = StalkerAPI.getHostId(portal);
        const seriesCacheFile = path_1.default.join(DARK_SIDE, `series_${host_id}.stalker`);
        if (fs_1.default.existsSync(seriesCacheFile)) {
            this.vision_logs(`Loading series from local cache (Stalker): ${host_id}`);
            return fs_1.default.readFileSync(seriesCacheFile, 'utf8');
        }
        try {
            this.vision_logs("Fetching series from Stalker Portal...");
            const auth = await this.validation(portal);
            if (auth.error) {
                return JSON.stringify({ error: auth.error });
            }
            const catUrl = `${StalkerAPI.getApiUrl(portal.URL)}?type=series&action=get_categories&JsHttpRequest=1-xml`;
            const headers = [
                "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
                `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
                `Referer: ${portal.URL}/c/`,
                `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
                `Authorization: Bearer ${auth.Token || ''}`
            ];
            const catRes = await this.stalkerRequest(catUrl, headers, 'GET');
            let catParsed = null;
            try {
                catParsed = JSON.parse(catRes.STALKER.data);
            }
            catch (e) { }
            const categories = catParsed?.js || [];
            const seriesList = [];
            if (Array.isArray(categories)) {
                const fetchPromises = categories.map(async (cat) => {
                    const catId = cat.id;
                    const catTitle = cat.title || cat.name || 'Uncategorized';
                    if (!catId)
                        return;
                    const listUrl = `${StalkerAPI.getApiUrl(portal.URL)}?type=series&action=get_ordered_list&category=${catId}&JsHttpRequest=1-xml`;
                    const listRes = await this.stalkerRequest(listUrl, headers, 'GET');
                    let listParsed = null;
                    try {
                        listParsed = JSON.parse(listRes.STALKER.data);
                    }
                    catch (e) { }
                    const items = listParsed?.js?.data || listParsed?.js || [];
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            if (!item.id)
                                continue;
                            const id = item.id;
                            const name = item.name || item.title || '';
                            const logo = this.image(item.logo || item.image || item.screenshot, portal.URL);
                            seriesList.push({
                                id: `stalker_series_${id}`,
                                Name: name,
                                number: '0',
                                logo: logo,
                                cmd: item.cmd || '',
                                genre: catTitle,
                                playback_url: `stalker_series_${id}`,
                                tv_genre_id: catId.toString(),
                                xmltv_id: '',
                                media_type: 'series',
                                rating: item.rating || '',
                                year: item.year || ''
                            });
                        }
                    }
                });
                await Promise.all(fetchPromises);
            }
            if (seriesList.length > 0) {
                const out = JSON.stringify(seriesList);
                fs_1.default.writeFileSync(seriesCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify([]);
            }
        }
        catch (e) {
            this.vision_logs(`Failed to fetch Stalker Series: ${e.message}`, "ERROR");
            return JSON.stringify({ error: `Stalker Series Fetch Error: ${e.message}` });
        }
    }
    static async getStalkerSeriesInfo(portal, seriesId) {
        try {
            const cleanId = seriesId.replace('stalker_series_', '');
            const auth = await this.validation(portal);
            if (auth.error) {
                return JSON.stringify({ error: auth.error });
            }
            const url = `${StalkerAPI.getApiUrl(portal.URL)}?type=series&action=get_ordered_list&series_id=${cleanId}&JsHttpRequest=1-xml`;
            const headers = [
                "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
                `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
                `Referer: ${portal.URL}/c/`,
                `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
                `Authorization: Bearer ${auth.Token || ''}`
            ];
            const response = await this.stalkerRequest(url, headers, 'GET');
            let parsed = null;
            try {
                parsed = JSON.parse(response.STALKER.data);
            }
            catch (e) { }
            const items = parsed?.js?.data || parsed?.js || [];
            const episodes = [];
            let info = {};
            if (Array.isArray(items)) {
                for (const item of items) {
                    const epId = item.id;
                    const name = item.name || item.title || `Episode ${item.episode_num || episodes.length + 1}`;
                    const cmd = item.cmd || '';
                    const plot = item.plot || '';
                    episodes.push({
                        id: epId,
                        episode_num: item.episode_num || (episodes.length + 1).toString(),
                        title: name,
                        container_extension: 'mp4',
                        cmd: cmd,
                        info: {
                            plot: plot
                        }
                    });
                    if (epId && cmd) {
                        try {
                            const epCacheFile = path_1.default.join(DARK_SIDE, `episode_cmd_${epId}.txt`);
                            fs_1.default.writeFileSync(epCacheFile, cmd, 'utf8');
                        }
                        catch (e) { }
                    }
                    if (!info.cover && item.logo) {
                        info.cover = this.image(item.logo || item.image || item.screenshot, portal.URL);
                    }
                }
            }
            const epsGroup = { "1": episodes };
            return JSON.stringify({
                info: info,
                episodes: epsGroup
            });
        }
        catch (e) {
            return JSON.stringify({ error: e.message });
        }
    }
    static async validation(portalConfig) {
        const portal = portalConfig || StalkerAPI.getActivePortal();
        if (!portal) {
            return { error: "Identity not found. Login required." };
        }
        const host_id = StalkerAPI.getHostId(portal);
        const tokenFile = path_1.default.join(DARK_SIDE, `token_${host_id}.stalker`);
        if (portal.type === 'xtream') {
            if (fs_1.default.existsSync(tokenFile)) {
                try {
                    const savedData = JSON.parse(fs_1.default.readFileSync(tokenFile, 'utf8'));
                    if (savedData?.STALKER && savedData.STALKER.type === 'xtream') {
                        const mtime = fs_1.default.statSync(tokenFile).mtimeMs;
                        if (Date.now() - mtime < 7200 * 1000) {
                            return savedData.STALKER;
                        }
                    }
                }
                catch (e) { }
            }
            const profileStr = await this.getXtreamProfile(portal);
            return JSON.parse(profileStr)?.STALKER || { error: "Failed to fetch Xtream profile" };
        }
        if (fs_1.default.existsSync(tokenFile)) {
            try {
                const savedData = JSON.parse(fs_1.default.readFileSync(tokenFile, 'utf8'));
                if (!savedData?.STALKER) {
                    const profileStr = await this.get_profile(portal);
                    return JSON.parse(profileStr)?.STALKER || { error: "Failed to fetch profile" };
                }
                const core = savedData.STALKER;
                const oldUrl = core.URL || '';
                const normalizedOldUrl = oldUrl.replace(/\/c\/?$/, '');
                const normalizedNewUrl = portal.URL.replace(/\/c\/?$/, '');
                if (normalizedOldUrl !== normalizedNewUrl) {
                    const livePath = path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`);
                    if (fs_1.default.existsSync(livePath))
                        fs_1.default.unlinkSync(livePath);
                    this.vision_logs("Portal mismatch. Clean up cache and generate fresh token");
                    const profileStr = await this.get_profile(portal);
                    return JSON.parse(profileStr)?.STALKER || { error: "Failed to fetch profile" };
                }
                const genTime = core.generated_time || 0;
                const minutesElapsed = (Date.now() / 1000 - genTime) / 60;
                if (minutesElapsed < 0.5) {
                    this.vision_logs("Auth Phase 1: Using cached token (Under 30s old)");
                    return core;
                }
                else if (minutesElapsed < 840) {
                    this.vision_logs("Auth Phase 2: Using cached token (Under 14h old)");
                    const profileStr = await this.get_profile(portal, core.Token);
                    let parsedProfile = null;
                    try {
                        parsedProfile = JSON.parse(profileStr);
                    }
                    catch (e) { }
                    if (!parsedProfile?.STALKER?.Token) {
                        this.vision_logs("Auth Phase 2: Cached token validation failed. Falling back to Phase 3 (fresh fetch)");
                        const freshProfileStr = await this.get_profile(portal);
                        return JSON.parse(freshProfileStr)?.STALKER || { error: "Failed to fetch profile" };
                    }
                    return parsedProfile.STALKER;
                }
                else {
                    this.vision_logs("Auth Phase 3: Token expired, performing full fetch");
                    const profileStr = await this.get_profile(portal);
                    return JSON.parse(profileStr)?.STALKER || { error: "Failed to fetch profile" };
                }
            }
            catch (e) {
                // ignore and full profile fetch
            }
        }
        this.vision_logs("Token file not present. Direct profile fetch");
        const profileStr = await this.get_profile(portal);
        return JSON.parse(profileStr)?.STALKER || { error: "Failed to fetch profile" };
    }
    static async genre(portalConfig) {
        const portal = portalConfig || StalkerAPI.getActivePortal();
        if (!portal)
            return { error: "Login required" };
        const host_id = StalkerAPI.getHostId(portal);
        const genrePath = path_1.default.join(DARK_SIDE, `genre_${host_id}.json`);
        const auth = await this.validation(portal);
        if (auth.error) {
            return { error: auth.error };
        }
        const targetUrl = `${StalkerAPI.getApiUrl(portal.URL)}?type=itv&action=get_genres&JsHttpRequest=1-xml`;
        const headers = [
            "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
            `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
            `Referer: ${portal.URL}/c/`,
            `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
            `Authorization: Bearer ${auth.Token || ''}`
        ];
        const response = await this.stalkerRequest(targetUrl, headers, 'GET');
        fs_1.default.writeFileSync(genrePath, response.STALKER.data, 'utf8');
        let parsed = null;
        try {
            parsed = JSON.parse(response.STALKER.data);
        }
        catch (e) {
            // ignore
        }
        const statusCode = response.STALKER.info.http_code;
        if (!parsed?.js) {
            return {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                    Statuscode: statusCode,
                    data: response.STALKER.data
                }
            };
        }
        const genres = {};
        if (Array.isArray(parsed.js)) {
            for (const item of parsed.js) {
                if (item?.id !== undefined && item?.title !== undefined) {
                    genres[item.id] = item.title;
                }
            }
        }
        return genres;
    }
    static async json_fetcher(mediaType = 'live', portalConfig, userId = 'anonymous') {
        const portal = portalConfig || StalkerAPI.getActivePortal();
        this.vision_logs(`[json_fetcher] Using portal: ${portal ? (portal.Name || portal.URL) : 'NONE'}`);
        if (!portal) {
            return JSON.stringify({ error: "Identity not found. Login required." });
        }
        const host_id = StalkerAPI.getHostId(portal);
        const liveCacheFile = path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`);
        const moviesCacheFile = path_1.default.join(DARK_SIDE, `movies_${host_id}.stalker`);
        const seriesCacheFile = path_1.default.join(DARK_SIDE, `series_${host_id}.stalker`);
        // 1. Check active custom M3U playlist
        const activeFile = path_1.default.join(DARK_SIDE, `active_playlist_id_${userId}.txt`);
        if (fs_1.default.existsSync(activeFile)) {
            const activeId = fs_1.default.readFileSync(activeFile, 'utf8').trim();
            if (activeId && activeId !== 'portal') {
                const m3uFile = path_1.default.join(DARK_SIDE, `m3u_channels_${activeId.replace(/[^a-zA-Z0-9_-]/g, '')}.json`);
                if (fs_1.default.existsSync(m3uFile)) {
                    this.vision_logs(`Loading channels from active M3U playlist: ${activeId} for user ${userId}`);
                    return fs_1.default.readFileSync(m3uFile, 'utf8');
                }
            }
        }
        if (mediaType === 'movie') {
            if (fs_1.default.existsSync(moviesCacheFile)) {
                this.vision_logs(`Loading movies from local cache: ${host_id}`);
                return fs_1.default.readFileSync(moviesCacheFile, 'utf8');
            }
        }
        else if (mediaType === 'series') {
            if (fs_1.default.existsSync(seriesCacheFile)) {
                this.vision_logs(`Loading series from local cache: ${host_id}`);
                return fs_1.default.readFileSync(seriesCacheFile, 'utf8');
            }
        }
        else {
            if (fs_1.default.existsSync(liveCacheFile)) {
                this.vision_logs(`Loading channels from local cache: ${host_id}`);
                return fs_1.default.readFileSync(liveCacheFile, 'utf8');
            }
        }
        if (portal.type === 'xtream') {
            if (mediaType === 'movie') {
                return this.getXtreamMovies(portal);
            }
            else if (mediaType === 'series') {
                return this.getXtreamSeries(portal);
            }
            else {
                return this.getXtreamChannels(portal);
            }
        }
        else {
            if (mediaType === 'movie') {
                return this.getStalkerMovies(portal);
            }
            else if (mediaType === 'series') {
                return this.getStalkerSeries(portal);
            }
        }
        const auth = await this.validation(portal);
        if (auth.error) {
            return JSON.stringify({ error: auth.error });
        }
        const url = `${StalkerAPI.getApiUrl(portal.URL)}?type=itv&action=get_all_channels&JsHttpRequest=1-xml`;
        const headers = [
            "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
            `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
            `Referer: ${portal.URL}/c/`,
            `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
            `Authorization: Bearer ${auth.Token || ''}`
        ];
        const response = await this.stalkerRequest(url, headers, 'GET');
        if (response?.STALKER?.info?.http_code === 404) {
            console.error(`[StalkerAPI] 404 error fetching from ${url}`);
        }
        let parsed = null;
        try {
            parsed = JSON.parse(response.STALKER.data);
        }
        catch (e) {
            // ignore
        }
        const statusCode = response.STALKER.info.http_code;
        const genres = await this.genre(portal);
        if (parsed?.js?.data && (parsed.js.total_items || (Array.isArray(parsed.js.data) && parsed.js.data.length > 0))) {
            this.vision_logs("Cache expired or missing. Fetching channels from Portal...");
            const logoMap = await this.get_iptv_org_logo_map();
            const globalConfig = this.Stark_Industries();
            const channelsList = [];
            for (const item of parsed.js.data) {
                const genreId = item.tv_genre_id;
                const genreName = (genres && genres[genreId]) ? genres[genreId] : 'General';
                const xmltv_id = (item.xmltv_id || '').toLowerCase();
                const name = item.name || '';
                const portalLogo = this.image(item.logo, portal.URL);
                let logo = '';
                const isPlaceholder = !portalLogo ||
                    portalLogo === globalConfig.meta_data.himg ||
                    portalLogo.includes('unsplash.com') ||
                    portalLogo.includes('Screenshot-2026-04-13') ||
                    portalLogo.includes('i.ibb.co');
                if (isPlaceholder) {
                    logo = this.match_iptv_logo(name, xmltv_id, logoMap);
                }
                if (!logo) {
                    logo = portalLogo;
                }
                channelsList.push({
                    id: item.id,
                    Name: item.name,
                    number: item.number,
                    logo: logo,
                    cmd: item.cmd,
                    genre: genreName,
                    playback_url: item.id ? item.id.toString() : this.id_generator(item.cmd),
                    tv_genre_id: item.tv_genre_id,
                    xmltv_id: item.xmltv_id
                });
            }
            if (channelsList.length > 0) {
                const out = JSON.stringify(channelsList);
                fs_1.default.writeFileSync(liveCacheFile, out, 'utf8');
                return out;
            }
            else {
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                        Statuscode: statusCode,
                        data: parsed
                    }
                });
            }
        }
        else {
            return JSON.stringify({
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                    Statuscode: statusCode,
                    data: response.STALKER.data
                }
            });
        }
    }
    static getHostId(portal) {
        if (!portal || !portal.URL)
            return 'portal';
        try {
            let host = new URL(portal.URL).host;
            let id = portal.MAC || portal.username || '';
            id = id.replace(/[^a-zA-Z0-9_-]/g, '');
            return id ? `${host}_${id}` : host;
        }
        catch (e) {
            return 'portal';
        }
    }
    static parseCookies(cookieHeader) {
        const list = {};
        if (!cookieHeader)
            return list;
        cookieHeader.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                const key = parts.shift()?.trim();
                if (key)
                    list[key] = decodeURIComponent(parts.join('='));
            }
        });
        return list;
    }
    static getActivePortal(req) {
        if (req) {
            const cookieHeader = (req.headers.cookie || '');
            const cookies = this.parseCookies(cookieHeader);
            const userActivePortalId = cookies.active_portal_id;
            if (userActivePortalId && userActivePortalId !== 'login') {
                const portalFile = path_1.default.join(DARK_SIDE, `${userActivePortalId}.json`);
                if (fs_1.default.existsSync(portalFile)) {
                    try {
                        const data = JSON.parse(fs_1.default.readFileSync(portalFile, 'utf8'));
                        if (data?.URL) {
                            if (!data.type) {
                                const isXtream = !!(data.username && data.password && !data.MAC);
                                data.type = isXtream ? 'xtream' : 'stalker';
                            }
                            return data;
                        }
                    }
                    catch (e) { }
                }
            }
            if (cookies.portal_session) {
                try {
                    const data = jsonwebtoken_1.default.verify(cookies.portal_session, JWT_SECRET);
                    if (data && data.URL) {
                        if (!data.type) {
                            const isXtream = !!(data.username && data.password && !data.MAC);
                            data.type = isXtream ? 'xtream' : 'stalker';
                        }
                        return data;
                    }
                }
                catch (e) {
                    // Ignore and fallback if token is invalid or expired
                }
            }
        }
        const loginFile = path_1.default.join(DARK_SIDE, 'login.stalker');
        if (fs_1.default.existsSync(loginFile)) {
            try {
                const data = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
                if (data?.URL) {
                    if (!data.type) {
                        const isXtream = !!(data.username && data.password && !data.MAC);
                        data.type = isXtream ? 'xtream' : 'stalker';
                    }
                    return data;
                }
            }
            catch (e) { }
        }
        else {
            const dbFile = path_1.default.join(DARK_SIDE, 'admin_db.json');
            if (fs_1.default.existsSync(dbFile)) {
                try {
                    const dbData = JSON.parse(fs_1.default.readFileSync(dbFile, 'utf8'));
                    if (dbData && Array.isArray(dbData.portals)) {
                        const defaultPortal = dbData.portals.find((p) => p.isDefault) || dbData.portals[0];
                        if (defaultPortal) {
                            const portalConfig = {
                                URL: defaultPortal.url,
                                MAC: defaultPortal.mac,
                                username: defaultPortal.username,
                                password: defaultPortal.password,
                                type: defaultPortal.type,
                                model: defaultPortal.model,
                                API: defaultPortal.API,
                                hw_version: defaultPortal.hw_version,
                                hw_version_2: defaultPortal.hw_version_2,
                                D1: defaultPortal.D1,
                                D2: defaultPortal.D2
                            };
                            fs_1.default.writeFileSync(loginFile, JSON.stringify(portalConfig, null, 2), 'utf8');
                            return portalConfig;
                        }
                    }
                }
                catch (e) { }
            }
        }
        return null;
    }
    static async doctor_strange(id, config) {
        if (!id || typeof id !== 'string')
            return JSON.stringify({ error: "Invalid ID" });
        const loginFile = path_1.default.join(DARK_SIDE, 'login.stalker');
        let portal = config || StalkerAPI.getActivePortal();
        if (id.startsWith('stalker_movie_') || id.startsWith('stalker_series_episode_')) {
            if (!portal) {
                return JSON.stringify({ error: "Identity not found. Login required." });
            }
            const cleanId = id.startsWith('stalker_movie_')
                ? id.replace('stalker_movie_', '')
                : id.replace('stalker_series_episode_', '').split('_')[0];
            let cmd = '';
            const host_id = StalkerAPI.getHostId(portal);
            const moviesCacheFile = path_1.default.join(DARK_SIDE, `movies_${host_id}.stalker`);
            const seriesCacheFile = path_1.default.join(DARK_SIDE, `series_${host_id}.stalker`);
            if (fs_1.default.existsSync(moviesCacheFile)) {
                try {
                    const list = JSON.parse(fs_1.default.readFileSync(moviesCacheFile, 'utf8'));
                    const found = list.find((m) => m.id === id || m.id.replace('stalker_movie_', '') === cleanId);
                    if (found && found.cmd) {
                        cmd = found.cmd;
                    }
                }
                catch (e) { }
            }
            if (!cmd && fs_1.default.existsSync(seriesCacheFile)) {
                try {
                    const list = JSON.parse(fs_1.default.readFileSync(seriesCacheFile, 'utf8'));
                    const found = list.find((s) => s.id === id || s.id.replace('stalker_series_', '') === cleanId);
                    if (found && found.cmd) {
                        cmd = found.cmd;
                    }
                }
                catch (e) { }
            }
            if (!cmd) {
                const epCacheFile = path_1.default.join(DARK_SIDE, `episode_cmd_${cleanId}.txt`);
                if (fs_1.default.existsSync(epCacheFile)) {
                    cmd = fs_1.default.readFileSync(epCacheFile, 'utf8').trim();
                }
            }
            if (!cmd) {
                cmd = `ffmpeg http://localhost/vod/${cleanId}`;
            }
            const auth = await this.validation(portal);
            if (auth.error) {
                return JSON.stringify({ error: auth.error });
            }
            const url = `${StalkerAPI.getApiUrl(portal.URL)}?type=vod&action=create_link&cmd=${encodeURIComponent(cmd)}&JsHttpRequest=1-xml`;
            const headers = [
                "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
                `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
                `Referer: ${portal.URL}/c/`,
                `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
                `Authorization: Bearer ${auth.Token || ''}`
            ];
            const response = await this.stalkerRequest(url, headers, 'GET');
            let parsed = null;
            try {
                parsed = JSON.parse(response.STALKER.data);
            }
            catch (e) { }
            const statusCode = response.STALKER.info.http_code;
            if (parsed?.js?.cmd && statusCode === 200) {
                this.vision_logs(`VOD Stream Link Acquired for ID: ${id}`);
                const result = {
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        generated_time: Math.floor(Date.now() / 1000),
                        message: "Playback URL fetched successfully",
                        cmd: parsed.js.cmd,
                        Statuscode: statusCode,
                        data: parsed
                    }
                };
                return JSON.stringify(result);
            }
            else {
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                        Statuscode: statusCode,
                        data: response.STALKER.data
                    }
                });
            }
        }
        if (id.startsWith('xtream_')) {
            let portal = null;
            try {
                if (fs_1.default.existsSync(loginFile)) {
                    const temp = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
                    if (temp && temp.type === 'xtream' && temp.username && temp.password) {
                        portal = temp;
                    }
                }
            }
            catch (e) { }
            // Robust fallback: scan DARK_SIDE for any valid saved Xtream Codes credentials
            if (!portal) {
                try {
                    const files = fs_1.default.readdirSync(DARK_SIDE);
                    for (const f of files) {
                        if (f.endsWith('.json')) {
                            const temp = JSON.parse(fs_1.default.readFileSync(path_1.default.join(DARK_SIDE, f), 'utf8'));
                            if (temp && temp.type === 'xtream' && temp.username && temp.password) {
                                portal = temp;
                                break;
                            }
                        }
                    }
                }
                catch (e) { }
            }
            if (!portal || !portal.URL || !portal.username || !portal.password) {
                return JSON.stringify({ error: "Xtream Codes credentials or profile not found." });
            }
            try {
                let streamUrl = '';
                if (id.startsWith('xtream_movie_')) {
                    const parts = id.replace('xtream_movie_', '').split('_');
                    const streamId = parts[0];
                    const ext = parts[1] || 'mp4';
                    streamUrl = `${portal.URL}/movie/${portal.username}/${portal.password}/${streamId}.${ext}`;
                }
                else if (id.startsWith('xtream_series_episode_')) {
                    const parts = id.replace('xtream_series_episode_', '').split('_');
                    const episodeId = parts[0];
                    const ext = parts[1] || 'mp4';
                    streamUrl = `${portal.URL}/series/${portal.username}/${portal.password}/${episodeId}.${ext}`;
                }
                else {
                    const streamId = id.replace('xtream_live_', '').replace('xtream_', '');
                    let extension = 'm3u8';
                    const host_id = StalkerAPI.getHostId(portal);
                    const tokenFile = path_1.default.join(DARK_SIDE, `token_${host_id}.stalker`);
                    if (fs_1.default.existsSync(tokenFile)) {
                        try {
                            const tokenData = JSON.parse(fs_1.default.readFileSync(tokenFile, 'utf8'));
                            const allowed = tokenData?.STALKER?.data?.user_info?.allowed_output_formats;
                            if (Array.isArray(allowed) && !allowed.includes('m3u8') && allowed.includes('ts')) {
                                extension = 'ts';
                            }
                        }
                        catch (e) { }
                    }
                    streamUrl = `${portal.URL}/live/${portal.username}/${portal.password}/${streamId}.${extension}`;
                }
                return JSON.stringify({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        generated_time: Math.floor(Date.now() / 1000),
                        message: "Playback URL fetched successfully",
                        cmd: streamUrl,
                        Statuscode: 200,
                        data: {}
                    }
                });
            }
            catch (e) {
                return JSON.stringify({ error: `Failed to load identity: ${e.message}` });
            }
        }
        // Check if cached link exists
        const cacheFile = path_1.default.join(LIGHT_SIDE, `${id}.json`);
        if (/^\d+$/.test(id)) {
            if (fs_1.default.existsSync(cacheFile)) {
                try {
                    const stat = fs_1.default.statSync(cacheFile);
                    if (Date.now() - stat.mtimeMs < 180 * 1000) {
                        const cached = JSON.parse(fs_1.default.readFileSync(cacheFile, 'utf8'));
                        if (cached?.js?.cmd) {
                            this.vision_logs(`Reusing cached stream link for channel ID: ${id}`);
                            return JSON.stringify({
                                STALKER: {
                                    Author: "DOCTOR_STRANGE",
                                    generated_time: Math.floor(stat.mtimeMs / 1000),
                                    message: "Playback URL fetched from cache",
                                    cmd: cached.js.cmd,
                                    Statuscode: 200,
                                    data: cached
                                }
                            });
                        }
                    }
                }
                catch (e) {
                    // ignore
                }
            }
        }
        if (!portal) {
            if (fs_1.default.existsSync(loginFile)) {
                portal = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
            }
        }
        if (!portal) {
            return JSON.stringify({ error: "Identity not found. Login required." });
        }
        const auth = await this.validation(portal);
        if (auth.error) {
            return JSON.stringify({ error: auth.error });
        }
        let finalCmd = `ffrt http://localhost/ch/${id}`;
        if (/^\d+$/.test(id)) {
            const host_id = StalkerAPI.getHostId(portal);
            const liveCacheFile = path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`);
            if (fs_1.default.existsSync(liveCacheFile)) {
                try {
                    const list = JSON.parse(fs_1.default.readFileSync(liveCacheFile, 'utf8'));
                    const found = list.find((c) => c.id === id || c.id === parseInt(id, 10) || c.id === id.toString());
                    if (found && found.cmd) {
                        finalCmd = found.cmd;
                    }
                }
                catch (e) { }
            }
        }
        const encodedCmd = encodeURIComponent(finalCmd);
        const url = `${StalkerAPI.getApiUrl(portal.URL)}?type=itv&action=create_link&cmd=${encodedCmd}&JsHttpRequest=1-xml`;
        const headers = [
            "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
            `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
            `Referer: ${portal.URL}/c/`,
            `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
            `Authorization: Bearer ${auth.Token || ''}`
        ];
        const response = await this.stalkerRequest(url, headers, 'GET');
        if (response?.STALKER?.info?.http_code === 404) {
            console.error(`[StalkerAPI] 404 error fetching from ${url}`);
        }
        let parsed = null;
        try {
            parsed = JSON.parse(response.STALKER.data);
        }
        catch (e) {
            // ignore
        }
        const statusCode = response.STALKER.info.http_code;
        if (parsed?.js?.cmd && statusCode === 200) {
            this.vision_logs(`Stream Link Acquired for ID: ${id}`);
            const result = {
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    generated_time: Math.floor(Date.now() / 1000),
                    message: "Playback URL fetched successfully",
                    cmd: parsed.js.cmd,
                    Statuscode: statusCode,
                    data: parsed
                }
            };
            try {
                fs_1.default.writeFileSync(cacheFile, JSON.stringify(parsed, null, 2), 'utf8');
            }
            catch (err) {
                this.vision_logs(`Failed to write cache for ID ${id}: ${err.message}`, "WARN");
            }
            return JSON.stringify(result);
        }
        else {
            return JSON.stringify({
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: this.getMessage(parsed, statusCode, response.STALKER.data, portal),
                    Statuscode: statusCode,
                    data: response.STALKER.data
                }
            });
        }
    }
    static protect_profile(jsonStr) {
        try {
            const data = JSON.parse(jsonStr);
            const mask = (val) => {
                if (!val)
                    return 'N/A';
                if (val.length <= 8)
                    return '••••••••';
                return val.substring(0, 4) + '••••••••' + val.substring(val.length - 4);
            };
            if (data?.STALKER?.data?.js) {
                const js = data.STALKER.data.js;
                if (js.mac)
                    js.mac = 'Protected (Locked)';
                if (js.ip)
                    js.ip = 'Protected (Encrypted)';
                if (js.login)
                    js.login = 'Protected';
                if (js.password)
                    js.password = 'Protected';
                if (js.name)
                    js.name = 'Protected User';
                if (js.fname)
                    js.fname = 'Protected User';
                if (js.parent_password)
                    js.parent_password = '••••';
            }
            if (data?.STALKER) {
                if (data.STALKER.mac)
                    data.STALKER.mac = 'Protected (Locked)';
                if (data.STALKER.MAC)
                    data.STALKER.MAC = 'Protected (Locked)';
                if (data.STALKER.Name)
                    data.STALKER.Name = 'Protected User';
                if (data.STALKER.login)
                    data.STALKER.login = 'Protected';
                if (data.STALKER.Password)
                    data.STALKER.Password = 'Protected';
                if (data.STALKER.password)
                    data.STALKER.password = 'Protected';
                if (data.STALKER.username)
                    data.STALKER.username = 'Protected';
                if (data.STALKER.URL)
                    data.STALKER.URL = mask(data.STALKER.URL);
                if (data.STALKER.device_id)
                    data.STALKER.device_id = 'Protected';
                if (data.STALKER.device_id2)
                    data.STALKER.device_id2 = 'Protected';
                if (data.STALKER.sig)
                    data.STALKER.sig = 'Protected';
                if (data.STALKER.SN)
                    data.STALKER.SN = 'Protected';
                if (data.STALKER.D1)
                    data.STALKER.D1 = 'Protected';
                if (data.STALKER.D2)
                    data.STALKER.D2 = 'Protected';
            }
            return JSON.stringify(data);
        }
        catch (e) {
            return jsonStr;
        }
    }
    static async generatePlaylist(baseUrl, portalConfig, userId = 'anonymous') {
        const channelsJson = await this.json_fetcher('live', portalConfig, userId);
        let channels = [];
        try {
            channels = JSON.parse(channelsJson);
        }
        catch (e) {
            return "#EXTM3U\n#EXTINF:-1,Cache Missing - Please Refresh Dashboard";
        }
        if (!Array.isArray(channels)) {
            return "#EXTM3U\n#EXTINF:-1,Cache Missing - Please Refresh Dashboard";
        }
        let m3u = "#EXTM3U\n";
        for (const ch of channels) {
            const name = ch.Name;
            const id = ch.playback_url;
            const logo = ch.logo || '';
            const genre = ch.genre || '';
            const isXtream = id.startsWith('xtream_');
            const fullStreamUrl = isXtream ? `${baseUrl}/xtream.php?id=${id}` : `${baseUrl}/live.php?id=${id}`;
            m3u += `#EXTINF:-1 tvg-id="${id}" tvg-logo="${logo}" group-title="${genre}",${name}\n`;
            m3u += `${fullStreamUrl}\n`;
        }
        return m3u;
    }
    static is_safe_m3u_url(urlStr) {
        try {
            const parsed = new URL(urlStr);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
                return false;
            }
            const host = parsed.hostname.toLowerCase();
            if (!host || host === 'localhost' || host === 'localhost.localdomain' || host === '::1' || host === '127.0.0.1') {
                return false;
            }
            return true;
        }
        catch (e) {
            return false;
        }
    }
    static parse_m3u_content(content, logoMap) {
        const lines = content.split(/\r?\n/);
        const channels = [];
        let channel_number = 1;
        let current_inf = null;
        let current_vlcopt_ua = '';
        for (let line of lines) {
            line = line.trim();
            if (!line)
                continue;
            if (line.startsWith('#EXTINF:')) {
                current_inf = line;
                current_vlcopt_ua = '';
                continue;
            }
            if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
                current_vlcopt_ua = line.substring('#EXTVLCOPT:http-user-agent='.length);
                continue;
            }
            if (line.startsWith('#')) {
                continue;
            }
            if (current_inf !== null) {
                let stream_url = line;
                let name = '';
                let logo = '';
                let group = 'M3U Channels';
                let xmltv_id = '';
                const comma_pos = current_inf.lastIndexOf(',');
                let meta_part = '';
                if (comma_pos !== -1) {
                    name = current_inf.substring(comma_pos + 1).trim();
                    meta_part = current_inf.substring(0, comma_pos);
                }
                else {
                    name = 'Channel ' + channel_number;
                    meta_part = current_inf;
                }
                let matches = meta_part.match(/tvg-id="([^"]+)"/i);
                if (matches) {
                    xmltv_id = matches[1].trim();
                }
                else {
                    matches = meta_part.match(/tvg-id=([^ ]+)/i);
                    if (matches)
                        xmltv_id = matches[1].trim();
                }
                matches = meta_part.match(/tvg-logo="([^"]+)"/i);
                if (matches) {
                    logo = matches[1].trim();
                }
                else {
                    matches = meta_part.match(/tvg-logo=([^ ]+)/i);
                    if (matches)
                        logo = matches[1].trim();
                }
                let user_agent = '';
                if (current_vlcopt_ua) {
                    user_agent = current_vlcopt_ua;
                }
                else {
                    matches = meta_part.match(/http-user-agent="([^"]+)"/i);
                    if (matches) {
                        user_agent = matches[1].trim();
                    }
                    else {
                        matches = meta_part.match(/user-agent="([^"]+)"/i);
                        if (matches)
                            user_agent = matches[1].trim();
                    }
                }
                if (user_agent) {
                    stream_url += (stream_url.indexOf('?') !== -1 ? '&' : '?') + 'http-user-agent=' + encodeURIComponent(user_agent);
                }
                if (!logo) {
                    logo = StalkerAPI.match_iptv_logo(name, xmltv_id, logoMap);
                }
                matches = meta_part.match(/group-title="([^"]+)"/i);
                if (matches) {
                    group = matches[1].trim();
                }
                else {
                    matches = meta_part.match(/group-title=([^ ]+)/i);
                    if (matches)
                        group = matches[1].trim();
                }
                channels.push({
                    id: "m3u_" + crypto_1.default.createHash('md5').update(stream_url).digest('hex'),
                    Name: name,
                    number: channel_number,
                    logo: logo,
                    cmd: stream_url,
                    genre: group,
                    playback_url: stream_url,
                    tv_genre_id: "m3u_genre",
                    xmltv_id: xmltv_id
                });
                channel_number++;
                current_inf = null;
            }
        }
        return channels;
    }
}
exports.StalkerAPI = StalkerAPI;
