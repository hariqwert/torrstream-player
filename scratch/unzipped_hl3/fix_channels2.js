const fs = require('fs');
const file = 'src/routes/sportsM3u.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /let streamUrl = ch\.stream_url;[\s\S]*?streamUrl = ch\.stream_url;\n\s*\}/;

const replacement = `let streamUrl = ch.stream_url;
                if (ch.channel_id) {
                    // Always prefer dynamic resolving to prevent expired static tokens
                    streamUrl = \`__HOSTURL__/live.php?token=STALKER_PRO&id=https://logic.icelanders.st/embed/\${encodeURIComponent(ch.channel_id)}&m3u=1\`;
                } else if (ch.stream_url && ch.stream_url.includes('.m3u8')) {
                    streamUrl = \`__HOSTURL__/live.php?token=STALKER_PRO&id=\${encodeURIComponent(ch.stream_url)}&m3u=1\`;
                }`;

code = code.replace(regex, replacement);
fs.writeFileSync(file, code);
