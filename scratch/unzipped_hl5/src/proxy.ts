import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import https from 'https';
import { Request, Response } from 'express';
import { StalkerAPI } from './stalkerAPI';
import { activeSessions, features, systemState, addStreamingIp, removeStreamingIp, shouldSendUserIp } from '../server';

import dns from 'dns';
import { promisify } from 'util';
const lookup = promisify(dns.lookup);

const agent = new https.Agent({
    rejectUnauthorized: false,
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: 10,
    timeout: 120000
});
const httpAgent = new (require('http').Agent)({
    keepAlive: true,
    maxSockets: Infinity,
    maxFreeSockets: 10,
    timeout: 120000
});

export async function isSafeUrl(urlStr: string): Promise<boolean> {
    try {
        const url = new URL(urlStr);
        const host = url.hostname;
        const { address } = await lookup(host);

        const ipParts = address.split('.').map(Number);
        if (ipParts.length !== 4) { if (address.includes(':')) { return address !== '::1' && !address.startsWith('fe80:') && !address.startsWith('fc00:') && !address.startsWith('fd00:'); } return false; }

        // Private IP Ranges
        // 127.0.0.0/8
        if (ipParts[0] === 127) return false;
        // 10.0.0.0/8
        if (ipParts[0] === 10) return false;
        // 172.16.0.0/12
        if (ipParts[0] === 172 && ipParts[1] >= 16 && ipParts[1] <= 31) return false;
        // 192.168.0.0/16
        if (ipParts[0] === 192 && ipParts[1] === 168) return false;
        // 169.254.0.0/16
        if (ipParts[0] === 169 && ipParts[1] === 254) return false;
        // 0.0.0.0/8
        if (ipParts[0] === 0) return false;

        return true;
    } catch (e) {
        return false;
    }
}

function resolveM3u8Url(base: string, pathStr: string): string {
    if (pathStr.startsWith('http')) return pathStr;
    if (pathStr.startsWith('//')) return 'http:' + pathStr;
    if (pathStr.startsWith('/')) {
        try {
            const parsed = new URL(base);
            return parsed.protocol + '//' + parsed.host + pathStr;
        } catch (e) {
            return base + pathStr;
        }
    }
    return base + pathStr;
}

function decodeStreamUrl(html: string): string | null {
    if (!html || typeof html !== 'string') return null;
    const atobMatch = html.match(/atob\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (atobMatch) {
        try {
            const decoded = Buffer.from(atobMatch[1], 'base64').toString('utf-8');
            if (decoded.includes('.m3u8')) return decoded;
        } catch(e) {}
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
        if (m3u8Match) return m3u8Match[0];
    }
    const directMatch = html.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
    return directMatch ? directMatch[0] : null;
}

export const activeStreamingResponses = new Set<Response>();
export function killAllActiveStreams() {
    console.log(`[PROXY] Terminating ${activeStreamingResponses.size} active streams immediately.`);
    for (const res of activeStreamingResponses) {
        try {
            res.destroy();
        } catch(e) {}
    }
    activeStreamingResponses.clear();
}

export async function streamUrl(url: string, headersArray: string[], req: Request, res: Response) {
    console.log("STREAM_URL_FETCH:", url);
    // Check System Power State (Proxy Kill)
    if (systemState.status === 'offline' || systemState.status === 'killed') {
        res.status(403).send('System Offline: Access Terminated by Administrator.');
        return;
    }
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const cleanIp = Array.isArray(clientIp) ? clientIp[0] : (clientIp as string).replace('::ffff:', '');

    const headers: Record<string, string> = {
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': url.substring(0, url.lastIndexOf('/') + 1)
    };
    if (shouldSendUserIp(cleanIp)) {
        headers['X-Forwarded-For'] = cleanIp;
        headers['X-Real-IP'] = cleanIp;
    }
    addStreamingIp(cleanIp);
    activeStreamingResponses.add(res);
    res.on('close', () => {
        removeStreamingIp(cleanIp);
        activeStreamingResponses.delete(res);
    });
    if (url.includes('hiveatick') || url.includes('casadenoval') || url.includes('timstreams') || url.includes('cdx-08192')) {
        headers['Referer'] = 'https://cdx-08192.website/';
        headers['Origin'] = 'https://cdx-08192.website/';
    }
    if (url.includes('phantemlis') || url.includes('xameleon') || url.includes('romponalis') || url.includes('daddy') || url.includes('dlhd') || url.includes('cloudflarestorage.com')) {
        headers['Referer'] = 'https://hamis.romponalis.st/';
        headers['Origin'] = 'https://hamis.romponalis.st/';
    }


    if (req.headers.range) {
        headers['Range'] = req.headers.range as string;
    }

    for (const h of headersArray) {
        const colonIndex = h.indexOf(':');
        if (colonIndex !== -1) {
            const key = h.substring(0, colonIndex).trim();
            const val = h.substring(colonIndex + 1).trim();
            const lowKey = key.toLowerCase();
            if (lowKey !== 'host' && lowKey !== 'connection') {
                headers[key] = val;
            }
        }
    }

    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    res.setHeader('Access-Control-Allow-Origin', '*');

    try {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const client = isHttps ? require('https') : require('http');

        const requestOptions = {
            method: 'GET',
            headers: headers,
            agent: isHttps ? agent : httpAgent,
            timeout: 14400000 // 4 hours for long TS streams
        };

        const proxyReq = client.request(url, requestOptions, (proxyRes: any) => {
            if ([301, 302, 303, 307, 308].includes(proxyRes.statusCode) && proxyRes.headers.location) {
                let redirectUrl = proxyRes.headers.location;
                if (!redirectUrl.startsWith('http')) {
                    try {
                        redirectUrl = new URL(redirectUrl, url).toString();
                    } catch (e) {}
                }
                console.log(`[PROXY] Stream redirect (${proxyRes.statusCode}) from ${url} -> ${redirectUrl}`);
                return streamUrl(redirectUrl, headersArray, req, res);
            }

            let contentType = proxyRes.headers['content-type'];
            if (!contentType || contentType === 'application/octet-stream' || contentType.includes('text/plain') || contentType.includes('text/html')) {
                const lowerUrl = url.toLowerCase();
                if (lowerUrl.includes('.mp4')) contentType = 'video/mp4';
                else if (lowerUrl.includes('.mkv')) contentType = 'video/x-matroska';
                else if (lowerUrl.includes('.avi')) contentType = 'video/x-msvideo';
                else if (lowerUrl.includes('.ts') || lowerUrl.includes('/play/') || lowerUrl.includes('/live/')) contentType = 'video/mp2t';
                else if (lowerUrl.includes('.mp3')) contentType = 'audio/mpeg';
                else if (lowerUrl.includes('.m4a')) contentType = 'audio/mp4';
                else contentType = 'video/mp2t';
            }
            if (contentType) res.setHeader('content-type', contentType);

            const contentLength = proxyRes.headers['content-length'];
            if (contentLength) res.setHeader('content-length', contentLength);

            const contentRange = proxyRes.headers['content-range'];
            if (contentRange) res.setHeader('content-range', contentRange);

            const acceptRanges = proxyRes.headers['accept-ranges'] || 'bytes';
            res.setHeader('accept-ranges', acceptRanges);

            if (proxyRes.statusCode === 206) {
                res.status(206);
            } else if (proxyRes.statusCode >= 400) {
                console.warn(`[PROXY] Upstream ${url} returned ${proxyRes.statusCode}`);
                res.status(proxyRes.statusCode);
            } else {
                res.status(proxyRes.statusCode || 200);
            }

            proxyRes.setTimeout(4 * 60 * 60 * 1000, () => {
                console.error('[PROXY] Stream socket timeout (4 hours) for:', url);
                proxyReq.destroy();
            });

            req.on('close', () => {
                proxyReq.destroy();
            });

            proxyRes.on('error', (err: any) => {
                console.error('Error streaming chunk:', err?.message || 'No error message');
                if (!res.headersSent) {
                    res.status(502).send('Streaming chunk failed');
                }
            });

            res.on('error', (err: any) => {
                console.error('Client response error:', err?.message || 'Unknown');
                proxyReq.destroy();
            });

            proxyRes.pipe(res);
        });

        proxyReq.on('timeout', () => {
            console.error('[PROXY] Request connection timeout:', url);
            proxyReq.destroy();
            if (!res.headersSent) res.status(504).send('Gateway Timeout');
        });

        proxyReq.on('error', (err: any) => {
            console.error('Proxy request to chunk failed:', err.message);
            if (!res.headersSent) {
                res.status(502).send('Proxy stream failed: ' + err.message);
            }
        });

        proxyReq.end();
    } catch (e: any) {
        console.error('Proxy setup failed:', e.message);
        if (!res.headersSent) {
            res.status(502).send('Proxy stream setup failed: ' + e.message);
        }
    }
}

const embedCache = new Map<string, { url: string, time: number }>();
const manifestCache = new Map<string, { content: string, contentType: string, time: number }>();

export function clearManifestCache() {
    manifestCache.clear();
}

export async function handleLiveStream(req: Request, res: Response) {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = Array.isArray(clientIp) ? clientIp[0] : (clientIp as string);
    const cleanIp = ip ? ip.replace('::ffff:', '') : '0.0.0.0';

    let req_id = req.query.id as string;
    
    if (req_id) {
        req_id = req_id.replace(/^ffmpeg\s+/i, '').replace(/^ffrt\s+/i, '').trim();
    }
    
    if (req_id && req_id.includes('cdx-08192.website/embed/')) {
        if (!await isSafeUrl(req_id)) {
            return res.status(403).send('Access Denied: Unsafe URL detected.');
        }
        const cached = embedCache.get(req_id);
        if (cached && Date.now() - cached.time < 5 * 1000) {
            req_id = cached.url;
        } else {
            try {
                const original_req_id = req_id;
                const embedResponse = await axios.get(req_id, {
                    headers: { 'Referer': 'https://cdx-08192.website/' }
                });
                const html = embedResponse.data;
                
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
                    if (m3u8Match) {
                        req_id = m3u8Match[0];
                        embedCache.set(original_req_id, { url: req_id, time: Date.now() });
                    }
                } else {
                    const directMatch = html.match(/https?:\/\/[^\s'"\\]+\.m3u8[^\s'"\\]*/);
                    if (directMatch) {
                        req_id = directMatch[0];
                        embedCache.set(original_req_id, { url: req_id, time: Date.now() });
                    }
                }
            } catch (err) {
                console.error("Failed to decode hux-giants embed in proxy:", err);
            }
        }
    }
    
    if (req_id && req_id.startsWith('xtream_')) {
        return res.status(400).send('Xtream Codes streams must be routed via xtream.php');
    }

    const wanda = req.query.wanda as string;
    const cassie = req.query.cassie as string;
    const m3u_mode = req.query.m3u === '1' || (req_id && (req_id.startsWith('http://') || req_id.startsWith('https://')));

    if (m3u_mode && !features.m3uEnabled) {
        return res.status(403).send('M3U streaming is currently disabled by administrator.');
    }
    if (!m3u_mode && !features.stalkerEnabled) {
        return res.status(403).send('Stalker portal streaming is currently disabled by administrator.');
    }

    let headersArray = [
        'User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3',
        'Connection: Keep-Alive'
    ];

    const portal = StalkerAPI.getActivePortal(req);
    if (m3u_mode) {
        headersArray = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Connection: Keep-Alive'
        ];
        let urlToCheck = req_id || '';
        if (!urlToCheck && wanda) urlToCheck = StalkerAPI.scarletWitch('decrypt', wanda);
        if (!urlToCheck && cassie) urlToCheck = StalkerAPI.scarletWitch('decrypt', cassie);
        if (urlToCheck && (urlToCheck.includes('phantemlis') || urlToCheck.includes('romponalis') || urlToCheck.includes('dlhd') || urlToCheck.includes('daddylive') || urlToCheck.includes('premiumtv') || urlToCheck.includes('xameleon'))) {
            headersArray.push('Referer: https://hamis.romponalis.st/');
            headersArray.push('Origin: https://hamis.romponalis.st/');
        } else if (urlToCheck && (urlToCheck.includes('timstreams.st') || urlToCheck.includes('casadenoval.uk') || urlToCheck.includes('cdx-08192.website') || urlToCheck.includes('hiveatick'))) {
            headersArray.push('Referer: https://cdx-08192.website/');
            headersArray.push('Origin: https://cdx-08192.website/');
        }
    } else if (portal) {
        if (portal.Model) headersArray.push(`X-User-Agent: Model: ${portal.Model}; Link: WiFi`);
        if (portal.URL) headersArray.push(`Referer: ${portal.URL}/c/`);
        if (portal.MAC) headersArray.push(`Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`);
        
        // Retrieve active Stalker bearer token if it exists
        const host_id = StalkerAPI.getHostId(portal);
        const tokenFile = path.join(process.cwd(), 'doctor_strange', `token_${host_id}.stalker`);
        const legacyTokenFile = path.join(process.cwd(), 'doctor_strange', 'token.stalker');
        
        let tokenToUse = '';
        if (fs.existsSync(tokenFile)) {
            try {
                const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
                tokenToUse = tokenData?.STALKER?.Token;
            } catch (e) {}
        }
        
        if (!tokenToUse && fs.existsSync(legacyTokenFile)) {
            try {
                const tokenData = JSON.parse(fs.readFileSync(legacyTokenFile, 'utf8'));
                tokenToUse = tokenData?.STALKER?.Token;
            } catch (e) {}
        }

        if (tokenToUse) {
            headersArray.push(`Authorization: Bearer ${tokenToUse}`);
        }
    }

    let custom_ua = req.query['http-user-agent'] as string || '';
    if (custom_ua) {
        headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('user-agent:'));
        headersArray.push(`User-Agent: ${custom_ua}`);
    }

    if (shouldSendUserIp(cleanIp)) {
        headersArray.push(`X-Forwarded-For: ${cleanIp}`);
        headersArray.push(`X-Real-IP: ${cleanIp}`);
    }

    let stream = '';

    if (req_id) {
        // Record Activity for Live Monitor
        activeSessions.set(cleanIp, {
            ip: cleanIp,
            channelId: req_id,
            startTime: Date.now(),
            userAgent: req.headers['user-agent'] || 'Unknown',
            type: m3u_mode ? 'M3U' : 'Portal'
        });

        let apiRes: any = null;
        if (req_id.startsWith('http://') || req_id.startsWith('https://')) {
            if (!await isSafeUrl(req_id)) {
                return res.status(403).send('Access Denied: Unsafe URL detected.');
            }
            stream = req_id;
        } else if (req_id.startsWith('dlhd-') || req_id.startsWith('dlhd_') || req_id.toLowerCase().startsWith('dlhd')) {
            const dlhdId = req_id.replace(/^dlhd[_-]?/i, '');
            if (dlhdId && dlhdId !== 'undefined') {
                try {
                    const daddyUrl = `https://hamis.romponalis.st/premiumtv/daddy3.php?id=${encodeURIComponent(dlhdId)}`;
                    const daddyRes = await axios.get(daddyUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Referer': 'https://dlhd.st/'
                        },
                        timeout: 8000
                    });
                    let resolved = decodeStreamUrl(daddyRes.data);
                    if (resolved && resolved.includes('premium0')) resolved = null;
                    if (!resolved) {
                        const fallbackDlhdUrl = `https://dlhd.st/stream/stream-${encodeURIComponent(dlhdId)}.php`;
                        const fallbackRes = await axios.get(fallbackDlhdUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Referer': 'https://dlhd.st/'
                            },
                            timeout: 8000
                        });
                        resolved = decodeStreamUrl(fallbackRes.data);
                        if (resolved && resolved.includes('premium0')) resolved = null;
                    }
                    if (resolved) {
                        stream = resolved;
                        headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('referer:') && !h.toLowerCase().startsWith('origin:'));
                        headersArray.push('Referer: https://hamis.romponalis.st/');
                        headersArray.push('Origin: https://hamis.romponalis.st/');
                    }
                } catch (e: any) {
                    console.error('[DLHD Proxy] Failed to resolve DLHD channel:', dlhdId, e?.message);
                }
            } else {
                console.warn('[DLHD Proxy] Invalid DLHD channel ID requested:', req_id);
            }
        } else {
            if (req.query.nocache) {
                const cacheFile = path.join(process.cwd(), 'cache_stalker', `${req_id}.json`);
                if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);
            }
            const apiResStr = await StalkerAPI.doctor_strange(req_id, portal);
            try {
                apiRes = JSON.parse(apiResStr);
            } catch (e) {}

            if (apiRes?.STALKER?.data && typeof apiRes.STALKER.data === 'string' && apiRes.STALKER.data.includes('Authorization failed')) {
                const tokenStalkerPath = path.join(process.cwd(), 'doctor_strange', 'token.stalker');
                if (fs.existsSync(tokenStalkerPath)) fs.unlinkSync(tokenStalkerPath);
                return res.redirect(req.originalUrl);
            }
            stream = apiRes?.STALKER?.cmd || '';
            stream = StalkerAPI.id_generator(stream);
        }

        if (!stream) {
            try {
                const embedRes = await axios.get(`https://cdx-08192.website/embed/${encodeURIComponent(req_id)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://cdx-08192.website/'
                    },
                    timeout: 8000
                });
                const decoded = decodeStreamUrl(embedRes.data);
                if (decoded) {
                    stream = decoded;
                    headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('referer:') && !h.toLowerCase().startsWith('origin:'));
                    headersArray.push('Referer: https://cdx-08192.website/');
                    headersArray.push('Origin: https://cdx-08192.website/');
                }
            } catch (e: any) {}
        }

        if (!stream) {
            try {
                const daddyRes = await axios.get(`https://hamis.romponalis.st/premiumtv/daddy3.php?id=${encodeURIComponent(req_id)}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://dlhd.st/'
                    },
                    timeout: 8000
                });
                const decoded = decodeStreamUrl(daddyRes.data);
                if (decoded && !decoded.includes('premium0')) {
                    stream = decoded;
                    headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('referer:') && !h.toLowerCase().startsWith('origin:'));
                    headersArray.push('Referer: https://hamis.romponalis.st/');
                    headersArray.push('Origin: https://hamis.romponalis.st/');
                }
            } catch (e: any) {}
        }

        if (!stream) {
            return res.status(404).send('Stream not found');
        }

        if (stream.includes('cdx-08192.website/embed/')) {
            if (!await isSafeUrl(stream)) {
                return res.status(403).send('Access Denied: Unsafe URL detected.');
            }
            try {
                const embedRes = await axios.get(stream, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': 'https://cdx-08192.website/'
                    }
                });
                const decoded = decodeStreamUrl(embedRes.data);
                if (decoded) {
                    stream = decoded;
                }
            } catch (e: any) {
                console.error('[Proxy] Failed to decode embed stream:', e?.message || e);
            }
        }

        const uaMatch = stream.match(/[?&]http-user-agent=([^&]+)/);
        if (uaMatch) {
            custom_ua = decodeURIComponent(uaMatch[1]);
            stream = stream.replace(/([?&])http-user-agent=[^&]+(&?)/, '$1');
            stream = stream.replace(/[?&]$/, '');

            headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('user-agent:'));
            headersArray.push(`User-Agent: ${custom_ua}`);
        }

        if (stream.startsWith('http')) {
            const lowerStream = stream.toLowerCase();
            const isM3u8 = lowerStream.includes('.m3u8') || lowerStream.includes('.m3u');
            const isDirect = (
                !isM3u8 ||
                lowerStream.includes('.ts') ||
                lowerStream.includes('.mp4') ||
                lowerStream.includes('.mkv') ||
                lowerStream.includes('.avi') ||
                lowerStream.includes('.mp3') ||
                lowerStream.includes('.m4a') ||
                lowerStream.includes('/play/') ||
                lowerStream.includes('/live/') ||
                lowerStream.includes('type=ts') ||
                lowerStream.includes('format=ts') ||
                req.query.type === 'mpegts'
            );
            if (isDirect && !isM3u8) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                return await streamUrl(stream, headersArray, req, res);
            }

            let stalkerRes = await StalkerAPI.stalkerRequest(stream, headersArray, 'GET', null, true);
            let content = stalkerRes.STALKER.data;
            let status_code = stalkerRes.STALKER.info.http_code;
            
            const final_url = stalkerRes.STALKER.info.final_url || stream;
            stream = final_url;
            let vision = stream.substring(0, stream.lastIndexOf('/') + 1);
            console.log("STREAM:", stream, "STATUS:", status_code, "CONTENT_LEN:", content.length);

            const is_cached = apiRes?.STALKER?.message === "Playback URL fetched from cache";
            if (status_code !== 200 && is_cached) {
                const cacheFile = path.join(process.cwd(), 'cache_stalker', `${req_id}.json`);
                if (fs.existsSync(cacheFile)) fs.unlinkSync(cacheFile);

                const freshResStr = await StalkerAPI.doctor_strange(req_id, portal);
                let freshRes: any = null;
                try {
                    freshRes = JSON.parse(freshResStr);
                } catch (e) {}
                stream = freshRes?.STALKER?.cmd || '';
                if (stream.startsWith('http')) {
                    stalkerRes = await StalkerAPI.stalkerRequest(stream, headersArray, 'GET', null, true);
                    content = stalkerRes.STALKER.data;
                    status_code = stalkerRes.STALKER.info.http_code;
                    const final_url = stalkerRes.STALKER.info.final_url || stream;
                    stream = final_url;
                    vision = stream.substring(0, stream.lastIndexOf('/') + 1);
                }
            }

            if ((status_code === 401 || status_code === 403 || (typeof content === 'string' && content.includes('Authorization failed'))) && portal) {
                console.log("[PROXY] Token expired or 401/403 returned. Triggering Stalker auto-healing handshake...");
                const host_id = StalkerAPI.getHostId(portal);
                const tokenFile = path.join(process.cwd(), 'doctor_strange', `token_${host_id}.stalker`);
                if (fs.existsSync(tokenFile)) { try { fs.unlinkSync(tokenFile); } catch (e) {} }
                const freshProfileStr = await StalkerAPI.doctor_strange('', portal);
                let freshToken = '';
                try {
                    const freshObj = JSON.parse(freshProfileStr);
                    freshToken = freshObj?.STALKER?.Token || '';
                } catch (e) {}

                if (freshToken) {
                    headersArray = headersArray.filter(h => !h.toLowerCase().startsWith('authorization:'));
                    headersArray.push(`Authorization: Bearer ${freshToken}`);
                    
                    const freshResStr = await StalkerAPI.doctor_strange(req_id, portal);
                    let freshResObj: any = null;
                    try { freshResObj = JSON.parse(freshResStr); } catch (e) {}
                    const newCmd = freshResObj?.STALKER?.cmd || stream;
                    if (newCmd && newCmd.startsWith('http')) {
                        stream = StalkerAPI.id_generator(newCmd);
                        stalkerRes = await StalkerAPI.stalkerRequest(stream, headersArray, 'GET', null, true);
                        content = stalkerRes.STALKER.data;
                        status_code = stalkerRes.STALKER.info.http_code;
                        const final_url = stalkerRes.STALKER.info.final_url || stream;
                        stream = final_url;
                        vision = stream.substring(0, stream.lastIndexOf('/') + 1);
                    }
                }
            }

            let redirectCount = 0;
            while ([301, 302, 303, 307, 308].includes(status_code) && redirectCount < 10) {
                let redirectUrl = stalkerRes.STALKER.info.redirect_url;
                if (!redirectUrl) {
                    const locMatch = content.match(/Location:\s*([^\r\n]+)/i);
                    if (locMatch) redirectUrl = locMatch[1].trim();
                }

                if (redirectUrl) {
                    if (!redirectUrl.startsWith('http')) {
                        redirectUrl = resolveM3u8Url(stream, redirectUrl);
                    }
                    stream = redirectUrl;
                    stalkerRes = await StalkerAPI.stalkerRequest(stream, headersArray, 'GET', null, true);
                    content = stalkerRes.STALKER.data;
                    status_code = stalkerRes.STALKER.info.http_code;
                    const final_url = stalkerRes.STALKER.info.final_url || stream;
                    stream = final_url;
                    vision = stream.substring(0, stream.lastIndexOf('/') + 1);
                    redirectCount++;
                } else {
                    break;
                }
            }

            if (stream.startsWith('http') && status_code === 200) {
                const is_playlist_content = content.includes('#EXTM3U');
                if (is_playlist_content) {
                    vision = stream.substring(0, stream.lastIndexOf('/') + 1);
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');

                    let m3u_suffix = m3u_mode ? '&m3u=1' : '';
                    if (custom_ua) {
                        m3u_suffix += '&http-user-agent=' + encodeURIComponent(custom_ua);
                    }

                    const lines = content.split('\n');
                    let cassie = '';

                    for (let line of lines) {
                        line = line.trim();
                        if (!line) continue;

                        if (line.includes('URI="')) {
                            const uriMatch = line.match(/URI="([^"]+)"/);
                            if (uriMatch) {
                                const uri = uriMatch[1];
                                const is_uri_playlist = uri.includes('.m3u8');
                                const uri_param = is_uri_playlist ? 'wanda' : 'cassie';

                                let finalUri = uri.startsWith('http') ? uri : resolveM3u8Url(vision, uri);
                                let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUri.substring(0, finalUri.lastIndexOf('/') + 1));
                                let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUri);

                                const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${uri_param}=${paramEnc}`;
                                cassie += line.replace(uri, proxied) + '\n';
                            } else {
                                cassie += line + '\n';
                            }
                        } else if (line.startsWith('#EXTINF') && line.includes(',')) {
                            const parts = line.split(',');
                            const extinf = parts[0];
                            const url = parts.slice(1).join(',').trim();

                            if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                                const is_playlist = url.includes('.m3u8');
                                const param_name = is_playlist ? 'wanda' : 'cassie';

                                let finalUrl = url;
                                let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1));
                                let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUrl);

                                const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${param_name}=${paramEnc}`;
                                cassie += extinf + ',\n' + proxied + '\n';
                            } else {
                                cassie += line + '\n';
                            }
                        } else if (line.startsWith('#')) {
                            cassie += line + '\n';
                        } else {
                            const is_playlist = line.includes('.m3u8');
                            const param_name = is_playlist ? 'wanda' : 'cassie';

                            let finalUrl = line.startsWith('http') ? line : resolveM3u8Url(vision, line);
                            let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1));
                            let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUrl);

                            const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${param_name}=${paramEnc}`;
                            cassie += proxied + '\n';
                        }
                    }
                    return res.send(cassie.trim());
                } else {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    const contentType = stalkerRes.STALKER.info.content_type || 'video/mp2t';
                    res.setHeader('Content-Type', contentType);
                    return await streamUrl(stream, headersArray, req, res);
                }
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
                return res.status(status_code || 502).send('Proxy failed: Upstream returned HTTP ' + status_code);
            }
        } else {
            return res.status(404).send('Stream not found');
        }
    }


    const token = req.query.token as string;

    if (wanda && token === 'STALKER_PRO') {
        let wanda_url = StalkerAPI.scarletWitch('decrypt', wanda);
        let stalkerRes = await StalkerAPI.stalkerRequest(wanda_url, headersArray, 'GET', null, true);
        let content = stalkerRes.STALKER.data;
        let status_code = stalkerRes.STALKER.info.http_code;
        
        const final_wanda_url = stalkerRes.STALKER.info.final_url || wanda_url;
        wanda_url = final_wanda_url;
        console.log("WANDA STREAM:", wanda_url, "STATUS:", status_code, "CONTENT_LEN:", content.length);

        let redirectCount = 0;
        while ([301, 302, 303, 307, 308].includes(status_code) && redirectCount < 10) {
            let redirectUrl = stalkerRes.STALKER.info.redirect_url;
            if (!redirectUrl) {
                const locMatch = content.match(/Location:\s*([^\r\n]+)/i);
                if (locMatch) redirectUrl = locMatch[1].trim();
            }

            if (redirectUrl) {
                if (!redirectUrl.startsWith('http')) {
                    redirectUrl = resolveM3u8Url(wanda_url, redirectUrl);
                }
                wanda_url = redirectUrl;
                stalkerRes = await StalkerAPI.stalkerRequest(wanda_url, headersArray, 'GET', null, true);
                content = stalkerRes.STALKER.data;
                status_code = stalkerRes.STALKER.info.http_code;
                const final_wanda_url = stalkerRes.STALKER.info.final_url || wanda_url;
                wanda_url = final_wanda_url;
                redirectCount++;
            } else {
                break;
            }
        }

        const wanda_vision = wanda_url.substring(0, wanda_url.lastIndexOf('/') + 1);
        if (wanda_url.startsWith('http') && status_code === 200) {
            const is_playlist_content = content.includes('#EXTM3U');
            if (is_playlist_content) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');

                let m3u_suffix = m3u_mode ? '&m3u=1' : '';
                if (custom_ua) {
                    m3u_suffix += '&http-user-agent=' + encodeURIComponent(custom_ua);
                }

                const lines = content.split('\n');
                let cassie = '';

                for (let line of lines) {
                    line = line.trim();
                    if (!line) continue;

                    if (line.includes('URI="')) {
                        const uriMatch = line.match(/URI="([^"]+)"/);
                        if (uriMatch) {
                            const uri = uriMatch[1];
                            const is_uri_playlist = uri.includes('.m3u8');
                            const uri_param = is_uri_playlist ? 'wanda' : 'cassie';

                            let finalUri = uri.startsWith('http') ? uri : resolveM3u8Url(wanda_vision, uri);
                            let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUri.substring(0, finalUri.lastIndexOf('/') + 1));
                            let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUri);

                            const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${uri_param}=${paramEnc}`;
                            cassie += line.replace(uri, proxied) + '\n';
                        } else {
                            cassie += line + '\n';
                        }
                    } else if (line.startsWith('#EXTINF') && line.includes(',')) {
                        const parts = line.split(',');
                        const extinf = parts[0];
                        const url = parts.slice(1).join(',').trim();

                        if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
                            const is_playlist = url.includes('.m3u8');
                            const param_name = is_playlist ? 'wanda' : 'cassie';

                            let finalUrl = url;
                            let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1));
                            let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUrl);

                            const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${param_name}=${paramEnc}`;
                            cassie += extinf + ',\n' + proxied + '\n';
                        } else {
                            cassie += line + '\n';
                        }
                    } else if (line.startsWith('#')) {
                        cassie += line + '\n';
                    } else {
                        const is_playlist = line.includes('.m3u8');
                        const param_name = is_playlist ? 'wanda' : 'cassie';

                        let finalUrl = line.startsWith('http') ? line : resolveM3u8Url(wanda_vision, line);
                        let stalkerEnc = StalkerAPI.scarletWitch('encrypt', finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1));
                        let paramEnc = StalkerAPI.scarletWitch('encrypt', finalUrl);

                        const proxied = `live.php?token=STALKER_PRO${m3u_suffix}&stalker=${stalkerEnc}&${param_name}=${paramEnc}`;
                        cassie += proxied + '\n';
                    }
                }
                return res.send(cassie.trim());
            } else {
                res.setHeader('Access-Control-Allow-Origin', '*');
                const contentType = stalkerRes.STALKER.info.content_type || 'video/mp2t';
                res.setHeader('Content-Type', contentType);
                return await streamUrl(wanda_url, headersArray, req, res);
            }
        }
    }


    if (cassie && token === 'STALKER_PRO') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        const decrypted_cassie = StalkerAPI.scarletWitch('decrypt', cassie);
        try {
            const u = new URL(decrypted_cassie);
            const ext = path.extname(u.pathname).toLowerCase();

            if (ext === '.m4s' || ext === '.mp4') {
                res.setHeader('Content-Type', 'video/mp4');
            } else if (ext === '.aac') {
                res.setHeader('Content-Type', 'audio/aac');
            } else if (ext === '.vtt') {
                res.setHeader('Content-Type', 'text/vtt');
            } else {
                res.setHeader('Content-Type', 'video/mp2t');
            }
        } catch (e) {
            res.setHeader('Content-Type', 'video/mp2t');
        }

        return await streamUrl(decrypted_cassie, headersArray, req, res);
    }

    if (!req_id && !wanda && !cassie) {
        return res.status(400).send('Missing ID or query parameters');
    }
    return res.status(404).send('Stream not found');
}
