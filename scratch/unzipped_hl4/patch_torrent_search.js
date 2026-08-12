const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const torrentioFallback = `
    let results = data.results || data.streams || [];
    if (results.length === 0 && data.imdbId) {
        try {
            const torrentioType = data.mediaType === 'series' ? 'series' : 'movie';
            const streamPath = torrentioType === 'series' ? \`\${data.imdbId}:\${data.season}:\${data.episode}\` : data.imdbId;
            const torUrl = \`https://torrentio.strem.fun/stream/\${torrentioType}/\${streamPath}.json\`;
            console.log('Fallback fetching from Torrentio API on client:', torUrl);
            const torRes = await fetch(torUrl);
            const torData = await torRes.json();
            if (torData && torData.streams) {
                results = torData.streams.map(s => {
                    const infoHash = s.infoHash;
                    let magnet = s.magnet;
                    if (!magnet && infoHash) {
                        magnet = \`magnet:?xt=urn:btih:\${infoHash}&dn=\${encodeURIComponent(data.title)}\`;
                        const DEFAULT_TRACKERS = [
                            'http://nyaa.tracker.wf:7777/announce',
                            'udp://tracker.opentrackr.org:1337/announce',
                            'udp://open.stealth.si:80/announce',
                            'udp://tracker.torrent.eu.org:451/announce',
                            'udp://exodus.desync.com:6969/announce',
                            'udp://tracker.dler.org:6969/announce',
                            'udp://open.demonii.com:1337/announce',
                            'udp://tracker.openbittorrent.com:6969/announce',
                            'udp://opentracker.i2p.rocks:6969/announce'
                        ];
                        DEFAULT_TRACKERS.forEach(tr => {
                            magnet += \`&tr=\${encodeURIComponent(tr)}\`;
                        });
                    }
                    const rawTitle = s.title || s.name || data.title;
                    const seedMatch = rawTitle.match(/👤\\s*(\\d+)/);
                    const sizeMatch = rawTitle.match(/💾\\s*([\\d\\.]+\\s*[GMK]B)/i);
                    const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);
                    return {
                        name: s.name || 'Torrent Stream',
                        title: \`\${data.title} (\${qualityMatch ? qualityMatch[1] : '1080p'})\`,
                        raw_title: rawTitle,
                        magnet: magnet,
                        infoHash: infoHash,
                        seeders: seedMatch ? parseInt(seedMatch[1]) : 0,
                        size: sizeMatch ? sizeMatch[1] : 'Unknown',
                        quality: qualityMatch ? qualityMatch[1] : 'HD'
                    };
                });
                results.sort((a, b) => b.seeders - a.seeders);
                data.results = results;
            }
        } catch (e) {
            console.error('Fallback torrentio error:', e);
        }
    }
`;

code = code.replace(
    "renderSearchResults(data.results || data.streams || []);",
    torrentioFallback + "\n    renderSearchResults(results);"
);

code = code.replace(
    "if (data.results && data.results.length > 0) {",
    torrentioFallback + "\n          if (data.results && data.results.length > 0) {"
);

fs.writeFileSync('public/torrent.js', code);
console.log("Patched public/torrent.js for client side Torrentio API");
