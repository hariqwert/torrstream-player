"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XtreamAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const xtreamAgent_1 = require("./xtreamAgent");
const DARK_SIDE = path_1.default.join(process.cwd(), 'doctor_strange');
const LIGHT_SIDE = path_1.default.join(process.cwd(), 'cache_stalker');
class XtreamAPI {
    account;
    timeout = 120000;
    constructor(account) {
        const portalUrl = account.portalUrl || account.URL || '';
        this.account = {
            ...account,
            portalUrl: portalUrl.replace(/\/+$/, '')
        };
    }
    getAccount() {
        return this.account;
    }
    getAxiosConfig() {
        const isHttps = this.account.portalUrl.startsWith('https');
        return {
            httpAgent: isHttps ? undefined : xtreamAgent_1.httpAgent,
            httpsAgent: isHttps ? xtreamAgent_1.httpsAgent : undefined,
            headers: {
                'User-Agent': 'OTT Navigator/1.6.9.4 (Linux;Android 11)',
                'Accept': '*/*',
                'Referer': this.account.portalUrl + '/'
            },
            timeout: this.timeout
        };
    }
    async authenticate() {
        const url = `${this.account.portalUrl}/player_api.php?username=${encodeURIComponent(this.account.username)}&password=${encodeURIComponent(this.account.password)}`;
        try {
            const response = await axios_1.default.get(url, this.getAxiosConfig());
            const data = response.data;
            if (data && data.user_info && data.user_info.auth !== 0) {
                return data;
            }
            throw new Error('Authentication failed');
        }
        catch (e) {
            console.error(`[XtreamAPI] Auth Error: ${e.message}`);
            throw e;
        }
    }
    async getLiveCategories() {
        return this.fetchAction('get_live_categories');
    }
    async getLiveStreams(categoryId) {
        const extra = categoryId ? `&category_id=${categoryId}` : '';
        return this.fetchAction('get_live_streams', extra);
    }
    async getVodCategories() {
        return this.fetchAction('get_vod_categories');
    }
    async getVodStreams(categoryId) {
        const extra = categoryId ? `&category_id=${categoryId}` : '';
        return this.fetchAction('get_vod_streams', extra);
    }
    async getSeriesCategories() {
        return this.fetchAction('get_series_categories');
    }
    async getSeries() {
        return this.fetchAction('get_series');
    }
    async getSeriesInfo(seriesId) {
        return this.fetchAction('get_series_info', `&series_id=${seriesId}`);
    }
    async getShortEPG(streamId) {
        return this.fetchAction('get_short_epg', `&stream_id=${streamId}`);
    }
    async fetchAction(action, extra = '') {
        const url = `${this.account.portalUrl}/player_api.php?username=${encodeURIComponent(this.account.username)}&password=${encodeURIComponent(this.account.password)}&action=${action}${extra}`;
        try {
            const response = await axios_1.default.get(url, this.getAxiosConfig());
            return response.data;
        }
        catch (e) {
            console.error(`[XtreamAPI] Action ${action} failed: ${e.message}`);
            return { error: e.message };
        }
    }
    resolveStreamUrl(contentId) {
        const { portalUrl, username, password } = this.account;
        const user = encodeURIComponent(username);
        const pass = encodeURIComponent(password);
        let extension = contentId.endsWith('.m3u8') ? 'm3u8' : 'ts';
        const cleanId = contentId.replace(/\.ts$/, '').replace(/\.m3u8$/, '');
        if (cleanId.startsWith('xtream_live_')) {
            const id = cleanId.replace('xtream_live_', '');
            // Force m3u8 for live streams to use hls.js natively instead of mpegts.js (fixes frame stuttering and audio loss)
            return `${portalUrl}/live/${user}/${pass}/${id}.m3u8`;
        }
        if (cleanId.startsWith('xtream_movie_')) {
            const parts = cleanId.replace('xtream_movie_', '').split('_');
            const id = parts[0];
            const ext = parts[1] || 'mp4';
            return `${portalUrl}/movie/${user}/${pass}/${id}.${ext}`;
        }
        if (cleanId.startsWith('xtream_series_')) {
            const parts = cleanId.replace('xtream_series_', '').split('_');
            // Format: xtream_series_{series_id}_{episode_id}_{ext}
            if (parts.length >= 2) {
                const episodeId = parts[1];
                const ext = parts[2] || 'mp4';
                return `${portalUrl}/series/${user}/${pass}/${episodeId}.${ext}`;
            }
        }
        // Legacy/Direct format support
        if (cleanId.startsWith('xtream_') && !cleanId.includes('_live_') && !cleanId.includes('_movie_') && !cleanId.includes('_series_')) {
            const id = cleanId.replace('xtream_', '');
            return `${portalUrl}/live/${user}/${pass}/${id}.${extension}`;
        }
        return '';
    }
    static getAccountByHost(host) {
        const filePath = path_1.default.join(DARK_SIDE, `xtream_${host}.json`);
        if (fs_1.default.existsSync(filePath)) {
            try {
                const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
                return {
                    portalUrl: (data.portalUrl || data.URL || '').replace(/\/+$/, ''),
                    username: data.username || '',
                    password: data.password || '',
                    maxConnections: data.maxConnections,
                    activeConnections: data.activeConnections,
                    allowedFormats: data.allowedFormats,
                    expDate: data.expDate
                };
            }
            catch (e) {
                return null;
            }
        }
        return null;
    }
    static getActiveAccount() {
        const loginFile = path_1.default.join(DARK_SIDE, 'login.stalker');
        if (fs_1.default.existsSync(loginFile)) {
            try {
                const portal = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
                if (portal.type === 'xtream') {
                    return {
                        portalUrl: portal.URL.replace(/\/+$/, ''),
                        username: portal.username,
                        password: portal.password
                    };
                }
            }
            catch (e) { }
        }
        // Robust Fallback: Scan DARK_SIDE directory for any saved Xtream portal config
        try {
            const files = fs_1.default.readdirSync(DARK_SIDE);
            for (const f of files) {
                if (f.endsWith('.json')) {
                    const temp = JSON.parse(fs_1.default.readFileSync(path_1.default.join(DARK_SIDE, f), 'utf8'));
                    if (temp && temp.type === 'xtream' && temp.username && temp.password) {
                        return {
                            portalUrl: (temp.portalUrl || temp.URL || '').replace(/\/+$/, ''),
                            username: temp.username,
                            password: temp.password
                        };
                    }
                }
            }
        }
        catch (e) { }
        return null;
    }
}
exports.XtreamAPI = XtreamAPI;
