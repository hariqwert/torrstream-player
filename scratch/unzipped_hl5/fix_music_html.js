const fs = require('fs');
let content = fs.readFileSync('music.html', 'utf8');

let regex = /try \{\s*\/\/ Direct file fallback for high-quality audio sources \(JioSaavn\)[\s\S]*?const a = document\.createElement\('a'\);/
let replacement = `try {
                // Direct file fallback for high-quality audio sources (JioSaavn)
                let dlUrl = tr.url;
                if (dlUrl && dlUrl.startsWith('/api/music/proxy')) {
                    const urlObj = new URL(dlUrl, window.location.origin);
                    dlUrl = urlObj.searchParams.get('url') || dlUrl;
                }
                if (dlUrl) {
                    showStatusNotification("Downloading high-quality track directly...");
                    const res = await fetch(dlUrl);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');`;
                    
content = content.replace(regex, replacement);
fs.writeFileSync('music.html', content);
