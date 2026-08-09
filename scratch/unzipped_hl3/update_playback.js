const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

const regex = /            frame\.classList\.remove\('hidden'\);\s*nativeContainer\.classList\.add\('hidden'\);\s*frame\.src = '';\s*nativePlayer\.src = '';\s*nativePlayer\.innerHTML = '';\s*\/\/ Handle server switching options\s*let url = '';\s*if \(currentServer === 'vidsrc_to'\) \{([\s\S]*?)            if \(currentServer === 'consumet_direct'\) \{/g;

code = code.replace(regex, (match, p1) => {
    return `            // Navigate directly to embedded player page instead of inline iframe
            let url = '';
            if (currentServer === 'vidsrc_to') {${p1}            if (currentServer === 'consumet_direct') {`;
});

// Replace the end where it sets frame.src
const frameSrcRegex = /            \} else \{\s*frame\.src = url;\s*\}/g;
code = code.replace(frameSrcRegex, `            } else {
                // Navigate to play_media.html
                window.location.href = \`play_media.html?url=\${encodeURIComponent(url)}&title=\${encodeURIComponent(selectedMedia.title || selectedMedia.name || "Media Player")}\`;
            }`);

fs.writeFileSync('consumet.html', code);
