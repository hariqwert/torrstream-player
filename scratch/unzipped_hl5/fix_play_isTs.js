const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

const regex = /let isM3U8 =[\s\S]*?!isM3U8;/;
const replacement = `let isM3U8 = (lowerSrc.includes('.m3u8') || lowerId.includes('m3u8') || lowerSrc.includes('xtream_live_') || lowerSrc.includes('m3u=1') || lowerSrc.includes('m3u8=1') || lowerSrc.includes('type=m3u8')) && !lowerSrc.includes('/play/');
                let isTs = !isM3U8 && (lowerSrc.includes('/api/stream-proxy') || lowerSrc.includes('/play/') || lowerSrc.includes('.ts') || lowerSrc.includes('transcode=1') || lowerSrc.includes('ffmpeg=1') || lowerSrc.includes('custom_ts=1'));`;

code = code.replace(regex, replacement);
fs.writeFileSync('play.php', code);
