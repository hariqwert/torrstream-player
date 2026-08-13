const fs = require('fs');
let content = fs.readFileSync('music.html', 'utf8');

// Patch downloadActiveTrack
let regex = /try \{\s*\/\/ Direct file fallback for high-quality audio sources \(JioSaavn\)[\s\S]*?URL\.revokeObjectURL\(url\);\s*showStatusNotification\("Download completed successfully\."\);\s*\}/;
let replacement = `try {
                // Direct proxy fallback for high-quality audio sources (JioSaavn)
                let dlUrl = tr.url;
                if (dlUrl && dlUrl.startsWith('/api/music/proxy')) {
                    const urlObj = new URL(dlUrl, window.location.origin);
                    dlUrl = urlObj.searchParams.get('url') || dlUrl;
                }
                if (dlUrl) {
                    showStatusNotification("Downloading high-quality track directly...");
                    const proxyDl = \`/api/music/proxy?url=\${encodeURIComponent(dlUrl)}&download=1&title=\${encodeURIComponent(tr.artist + ' - ' + tr.title)}\`;
                    
                    const a = document.createElement('a');
                    a.href = proxyDl;
                    a.download = \`\${tr.artist} - \${tr.title}.mp3\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    showStatusNotification("Download started in browser.");
                }`;
content = content.replace(regex, replacement);

// Patch triggerCardDownload
let regex2 = /\/\/ Direct file fallback for high-quality audio sources \(JioSaavn\)[\s\S]*?a\.click\(\);\s*document\.body\.removeChild\(a\);\s*return;\s*\}/;
let replacement2 = `// Direct proxy fallback for high-quality audio sources (JioSaavn)
            if (tr.url) {
                showStatusNotification("Downloading track directly...");
                let dlUrl = tr.url;
                if (dlUrl.startsWith('/api/music/proxy')) {
                    const urlObj = new URL(dlUrl, window.location.origin);
                    dlUrl = urlObj.searchParams.get('url') || dlUrl;
                }
                const proxyDl = \`/api/music/proxy?url=\${encodeURIComponent(dlUrl)}&download=1&title=\${encodeURIComponent(tr.artist + ' - ' + tr.title)}\`;
                
                const a = document.createElement('a');
                a.href = proxyDl;
                a.download = \`\${tr.artist} - \${tr.title}.mp3\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }`;
content = content.replace(regex2, replacement2);

fs.writeFileSync('music.html', content);
