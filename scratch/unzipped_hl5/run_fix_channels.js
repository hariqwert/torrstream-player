const fs = require('fs');
const file = 'src/routes/sportsM3u.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /export async function getOrUpdatePlaylist[\s\S]*?return cachedPlaylist;\n}/;

const replacement = `export async function getOrUpdatePlaylist(force: boolean = false): Promise<string> {
    const now = Date.now();
    if (!force && cachedPlaylist && (now - lastFetchTime < CACHE_DURATION_MS)) {
        return cachedPlaylist;
    }
    
    console.log(\`[*] Generating dynamic M3U playlist with internal resolvers...\`);
    let m3uLines = ['#EXTM3U\\n'];
    let totalStreamsCount = 0;

    let data = null;
    try {
        console.log('[*] Fetching latest channels from https://api.vixnuvew.uk/api/channels');
        const apiResponse = await fetchUrl('https://api.vixnuvew.uk/api/channels');
        if (apiResponse) {
            data = JSON.parse(apiResponse);
            console.log(\`[+] Fetched \${data.length} channels from API.\`);
            
            // Save as backup
            fs.writeFileSync(path.join(process.cwd(), 'assets', 'channels.json'), JSON.stringify(data, null, 2), 'utf-8');
        }
    } catch (err: any) {
        console.error('[!] Failed to fetch from API, falling back to local channels.json', err.message);
    }

    try {
        if (!data) {
            const channelsPath = path.join(process.cwd(), 'assets', 'channels.json');
            if (fs.existsSync(channelsPath)) {
                data = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));
                if (Array.isArray(data) && data.length > 0) {
                    console.log(\`[+] Loaded \${data.length} channels from fallback catalog.\`);
                }
            }
        }

        if (Array.isArray(data) && data.length > 0) {
            for (const ch of data) {
                if (!ch.channel_id && !ch.stream_url) continue;
                totalStreamsCount++;
                const genre = ch.genre || 'Sports Channels';
                const name = ch.name || 'Unknown Channel';
                const logo = ch.logo || '';
                
                let streamUrl = ch.stream_url;
                if (ch.stream_url && ch.stream_url.includes('.m3u8')) {
                    streamUrl = \`__HOSTURL__/live.php?token=STALKER_PRO&id=\${encodeURIComponent(ch.stream_url)}&m3u=1\`;
                } else if (ch.channel_id) {
                    streamUrl = \`__HOSTURL__/live.php?token=STALKER_PRO&id=https://logic.icelanders.st/embed/\${encodeURIComponent(ch.channel_id)}&m3u=1\`;
                } else if (ch.stream_url) {
                    streamUrl = ch.stream_url;
                }
                
                m3uLines.push(\`#EXTINF:-1 tvg-name="\${name}" tvg-logo="\${logo}" group-title="\${genre}",\${name}\\n\`);
                m3uLines.push(\`\${streamUrl}\\n\`);
            }
        }
    } catch(e: any) {
        console.error("[!] Error generating playlist from channels catalog:", e.message);
    }

    cachedPlaylist = m3uLines.join('');
    lastFetchTime = Date.now();
    try { fs.writeFileSync(path.join(process.cwd(), 'assets', 'sports.m3u'), cachedPlaylist, 'utf-8'); } catch(e) {}
    console.log(\`[✓] Successfully updated sports.m3u playlist with \${totalStreamsCount} total stream items.\`);
    return cachedPlaylist;
}`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
