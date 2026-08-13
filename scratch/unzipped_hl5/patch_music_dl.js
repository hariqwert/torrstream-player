const fs = require('fs');
let content = fs.readFileSync('music.html', 'utf8');

// Patch downloadActiveTrack
let regex = /\/\/ Try searching YouTube video for the active song[\s\S]*?\/\/ Direct file fallback/;
let replacement = `// Direct file fallback for high-quality audio sources (JioSaavn)
                let dlUrl = tr.url;
                if (dlUrl && dlUrl.startsWith('/api/music/proxy')) {
                    const urlObj = new URL(dlUrl, window.location.origin);
                    dlUrl = urlObj.searchParams.get('url') || dlUrl;
                }
                if (dlUrl) {
                    showStatusNotification("Downloading high-quality track directly...");
                    const res = await fetch(dlUrl);`;

content = content.replace(regex, replacement);

// Patch triggerCardDownload
let regex2 = /try \{\s*const searchRes = await fetch\(\`\/api\/music\/yt-search\?q=\$\{encodeURIComponent\(tr\.title \+ ' ' \+ tr\.artist\)\}\`\);[\s\S]*?\} catch \(e\) \{\}/;
let replacement2 = `// Direct file fallback for high-quality audio sources (JioSaavn)
            if (tr.url) {
                showStatusNotification("Downloading track directly...");
                let dlUrl = tr.url;
                if (dlUrl.startsWith('/api/music/proxy')) {
                    const urlObj = new URL(dlUrl, window.location.origin);
                    dlUrl = urlObj.searchParams.get('url') || dlUrl;
                }
                const a = document.createElement('a');
                a.href = dlUrl;
                a.download = \`\${tr.artist} - \${tr.title}.mp3\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }`;

content = content.replace(regex2, replacement2);

fs.writeFileSync('music.html', content);
