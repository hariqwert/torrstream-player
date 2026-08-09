const fs = require('fs');
let code = fs.readFileSync('play_consumet.php', 'utf8');

const replacement = `                const isM3U8 = lowerSrc.includes('.m3u8') || lowerSrc.includes('m3u=1') || lowerSrc.includes('m3u8=1') || lowerSrc.includes('type=m3u8');
                const isTs = !isDirectMedia && !isM3U8 && (
                    lowerSrc.includes('/play/') ||
                    lowerSrc.includes('.ts') ||
                    lowerSrc.includes('transcode=1') ||
                    lowerSrc.includes('ffmpeg=1') ||
                    lowerSrc.includes('custom_ts=1') ||
                    lowerSrc.includes('/api/stream-proxy') ||
                    true // If it's not direct media and not HLS, assume TS
                );`;

code = code.replace(/const isTs = !isDirectMedia[\s\S]*?!lowerSrc\.includes\('\.m3u8'\)\n\s*\);/, replacement);
fs.writeFileSync('play_consumet.php', code);
