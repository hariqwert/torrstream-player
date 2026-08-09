"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleXtreamStream = handleXtreamStream;
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const child_process_1 = require("child_process");
const XtreamAPI_1 = require("./XtreamAPI");
const stalkerAPI_1 = require("../stalkerAPI");
const proxy_1 = require("../proxy");
function setXtreamCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, X-Requested-With');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
}
function xtreamEncode(url) {
    return Buffer.from(url).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function xtreamDecode(encoded) {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4)
        base64 += '=';
    return Buffer.from(base64, 'base64').toString('utf8');
}
function guessContentType(url, upstreamType) {
    if (upstreamType && upstreamType !== 'application/octet-stream')
        return upstreamType;
    try {
        const ext = path_1.default.extname(new URL(url).pathname).toLowerCase();
        switch (ext) {
            case '.mp4': return 'video/mp4';
            case '.mkv': return 'video/x-matroska';
            case '.ts': return 'video/mp2t';
            case '.m3u8': return 'application/vnd.apple.mpegurl';
            default: return 'video/mp2t';
        }
    }
    catch (e) {
        return 'video/mp2t';
    }
}
async function pipeDirectBinary(url, req, res, api) {
    setXtreamCorsHeaders(res);
    res.setHeader('X-Accel-Buffering', 'no');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Content-Transfer-Encoding', 'binary');
    const isHttps = url.startsWith('https');
    const isLive = url.includes('/live/') || url.includes('xtream_live_');
    const portalUrl = api.getAccount().portalUrl;
    const headers = {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Encoding': 'identity',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'keep-alive'
    };
    if (req.headers.range) {
        headers['Range'] = req.headers.range;
    }
    const isM3u8 = url.includes('.m3u8');
    let hasFinished = false;
    if (isM3u8) {
        req.on('close', () => {
            hasFinished = true;
        });
        try {
            const upstream = await (0, axios_1.default)({
                method: 'get',
                url,
                headers,
                responseType: 'text',
                timeout: 0,
                maxRedirects: 5,
                validateStatus: () => true
            });
            if (upstream.status >= 400) {
                console.error(`[XtreamProxy] Upstream Error: ${upstream.status} (${upstream.statusText}) for ${url}`);
                hasFinished = true;
                return res.status(upstream.status).end();
            }
            const playlistText = upstream.data;
            const finalUrl = upstream.request?.res?.responseUrl || url;
            const u = new URL(finalUrl);
            const providerBase = `${u.protocol}//${u.host}`;
            const dirBase = finalUrl.substring(0, finalUrl.lastIndexOf('/') + 1);
            const searchParams = u.search;
            const lines = playlistText.split('\n');
            const rewrittenLines = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed && !trimmed.startsWith('#')) {
                    let remoteUrl = '';
                    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                        remoteUrl = trimmed;
                    }
                    else if (trimmed.startsWith('/')) {
                        remoteUrl = providerBase + trimmed + searchParams;
                    }
                    else {
                        remoteUrl = dirBase + trimmed + searchParams;
                    }
                    return `/xtream.php?xurl=${xtreamEncode(remoteUrl)}`;
                }
                return line;
            });
            const resultText = rewrittenLines.join('\n');
            setXtreamCorsHeaders(res);
            res.setHeader('Content-Type', 'application/x-mpegurl');
            res.setHeader('Content-Length', Buffer.byteLength(resultText));
            hasFinished = true;
            return res.send(resultText);
        }
        catch (e) {
            hasFinished = true;
            console.error(`[XtreamProxy] Playlist Error: ${e.message}`);
            if (!res.headersSent)
                res.status(502).end();
            return;
        }
    }
    // Binary Streaming Proxy using native Node.js http/https directly for maximum socket-to-socket throughput
    let redirectCount = 0;
    const maxRedirects = 5;
    function executeRequest(requestUrl) {
        const isUrlHttps = requestUrl.startsWith('https');
        const options = {
            method: 'GET',
            headers: headers,
            rejectUnauthorized: false
        };
        const clientReq = (isUrlHttps ? https_1.default : http_1.default).request(requestUrl, options, (upstreamRes) => {
            if (upstreamRes.statusCode && [301, 302, 303, 307, 308].includes(upstreamRes.statusCode)) {
                let redirectUrl = upstreamRes.headers['location'];
                if (redirectUrl) {
                    if (!redirectUrl.startsWith('http')) {
                        const u = new URL(requestUrl);
                        redirectUrl = new URL(redirectUrl, u.origin).href;
                    }
                    redirectCount++;
                    if (redirectCount > maxRedirects) {
                        console.error(`[XtreamProxy] Too many redirects for ${url}`);
                        hasFinished = true;
                        return res.status(508).send('Too many redirects').end();
                    }
                    console.log(`[XtreamProxy] Following redirect to: ${redirectUrl}`);
                    return executeRequest(redirectUrl);
                }
            }
            if (upstreamRes.statusCode && upstreamRes.statusCode >= 400) {
                console.error(`[XtreamProxy] Upstream Error: ${upstreamRes.statusCode} (${upstreamRes.statusMessage}) for ${requestUrl}`);
                hasFinished = true;
                return res.status(upstreamRes.statusCode).end();
            }
            const userAgent = (req.headers['user-agent'] || '').toLowerCase();
            const isBrowser = userAgent.includes('mozilla') || userAgent.includes('chrome') || userAgent.includes('safari') || userAgent.includes('firefox') || userAgent.includes('edge');
            const isMkv = url.toLowerCase().includes('.mkv');
            // Only auto-transcode MKV for web browsers (since they lack native MKV decoding support)
            const transcodeParam = req.query.transcode === '1' || (isMkv && isBrowser);
            if (!isLive && transcodeParam) {
                console.log(`[XtreamProxy] VOD transcode mode active (isMkv: ${isMkv}, isBrowser: ${isBrowser}, seek: ${req.query.seek || '0'}). Spawning FFmpeg transcode pipeline...`);
                // Close the node proxy upstream connection since FFmpeg connects directly
                upstreamRes.destroy();
                const seekVal = req.query.seek ? String(req.query.seek) : '';
                const ffmpegArgs = [];
                if (seekVal) {
                    ffmpegArgs.push('-ss', seekVal);
                }
                ffmpegArgs.push('-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '-i', requestUrl, '-c:v', 'copy', '-c:a', 'aac', '-ac', '2', '-ab', '128k');
                ffmpegArgs.push('-f', 'mp4', '-movflags', 'frag_keyframe+empty_moov', 'pipe:1');
                res.status(200);
                res.setHeader('Content-Type', 'video/mp4');
                const ffmpeg = (0, child_process_1.spawn)('ffmpeg', ffmpegArgs);
                ffmpeg.stdin.on('error', (err) => {
                    // Suppress pipe errors
                });
                ffmpeg.stdout.on('error', (err) => {
                    console.error('[XtreamProxy] FFmpeg stdout Error:', err.message);
                });
                res.on('error', (err) => {
                    console.error('[XtreamProxy] Client Response Error:', err.message);
                });
                ffmpeg.stdout.pipe(res);
                req.on('close', () => {
                    hasFinished = true;
                    try {
                        ffmpeg.kill('SIGKILL');
                    }
                    catch (e) { }
                });
                ffmpeg.on('error', (err) => {
                    console.error('[XtreamProxy] FFmpeg Spawn Error:', err.message);
                });
            }
            else {
                const contentType = guessContentType(requestUrl, upstreamRes.headers['content-type']);
                if (requestUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('apple.mpegurl')) {
                    let m3u8Data = '';
                    upstreamRes.on('data', (chunk) => { m3u8Data += chunk.toString(); });
                    upstreamRes.on('end', () => {
                        hasFinished = true;
                        const baseUrl = requestUrl.substring(0, requestUrl.lastIndexOf('/') + 1);
                        let rewritten = '';
                        const lines = m3u8Data.split('\n');
                        for (let line of lines) {
                            line = line.trim();
                            if (!line)
                                continue;
                            if (line.startsWith('#')) {
                                if (line.includes('URI="')) {
                                    const uriMatch = line.match(/URI="([^"]+)"/);
                                    if (uriMatch) {
                                        const uri = uriMatch[1];
                                        const absUrl = uri.startsWith('http') ? uri : baseUrl + uri;
                                        const proxyUrl = `/xtream.php?xurl=${xtreamEncode(absUrl)}`;
                                        line = line.replace(uri, proxyUrl);
                                    }
                                }
                                rewritten += line + '\n';
                            }
                            else {
                                const absUrl = line.startsWith('http') ? line : baseUrl + line;
                                const proxyUrl = `/xtream.php?xurl=${xtreamEncode(absUrl)}`;
                                rewritten += proxyUrl + '\n';
                            }
                        }
                        res.status(upstreamRes.statusCode || 200);
                        res.setHeader('Content-Type', contentType);
                        res.send(rewritten);
                    });
                    upstreamRes.on('error', (err) => {
                        console.error('[XtreamProxy] Upstream M3U8 Error:', err.message);
                        if (!res.headersSent)
                            res.status(502).end();
                    });
                }
                else {
                    res.status(upstreamRes.statusCode || 200);
                    res.setHeader('Content-Type', contentType);
                    if (upstreamRes.headers['content-length'])
                        res.setHeader('Content-Length', upstreamRes.headers['content-length']);
                    if (upstreamRes.headers['content-range'])
                        res.setHeader('Content-Range', upstreamRes.headers['content-range']);
                    if (upstreamRes.headers['accept-ranges'])
                        res.setHeader('Accept-Ranges', upstreamRes.headers['accept-ranges']);
                    upstreamRes.pipe(res);
                    upstreamRes.on('error', (err) => {
                        console.error('[XtreamProxy] Upstream Response Direct Error:', err.message);
                    });
                    res.on('error', (err) => {
                        console.error('[XtreamProxy] Client Response Direct Error:', err.message);
                    });
                    req.on('close', () => {
                        hasFinished = true;
                        upstreamRes.destroy();
                    });
                }
            }
        });
        clientReq.on('error', (e) => {
            hasFinished = true;
            console.error(`[XtreamProxy] Binary Pipe Error: ${e.message}`);
            if (!res.headersSent)
                res.status(502).end();
        });
        req.on('close', () => {
            if (!hasFinished) {
                hasFinished = true;
                clientReq.destroy();
            }
        });
        clientReq.end();
    }
    executeRequest(url);
}
async function handleXtreamStream(req, res) {
    if (req.method === 'OPTIONS') {
        setXtreamCorsHeaders(res);
        return res.sendStatus(204);
    }
    const portal = stalkerAPI_1.StalkerAPI.getActivePortal(req);
    const account = (portal && portal.type === 'xtream') ? {
        portalUrl: portal.URL,
        username: portal.username,
        password: portal.password
    } : XtreamAPI_1.XtreamAPI.getActiveAccount();
    if (!account) {
        return res.status(401).send('No active Xtream account');
    }
    const api = new XtreamAPI_1.XtreamAPI(account);
    const contentId = req.query.id;
    const xurl = req.query.xurl;
    if (xurl) {
        const decodedUrl = xtreamDecode(xurl);
        if (!await (0, proxy_1.isSafeUrl)(decodedUrl)) {
            return res.status(403).send('Access Denied: Unsafe URL detected.');
        }
        return pipeDirectBinary(decodedUrl, req, res, api);
    }
    if (!contentId) {
        return res.status(400).send('Missing ID');
    }
    const streamUrl = api.resolveStreamUrl(contentId);
    if (!streamUrl) {
        return res.status(404).send('Invalid Stream ID');
    }
    if (!await (0, proxy_1.isSafeUrl)(streamUrl)) {
        return res.status(403).send('Access Denied: Unsafe URL detected.');
    }
    console.log(`[XtreamProxy] Resolved: ${streamUrl}`);
    return pipeDirectBinary(streamUrl, req, res, api);
}
