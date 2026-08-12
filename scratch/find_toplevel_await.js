const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptIdx++;
    const src = match[0].match(/src=["']([^"']+)["']/);
    if (!src && match[1].trim().length > 0) {
        const code = match[1];
        const lines = code.split('\n');

        let fnDepth = 0;
        lines.forEach((line, i) => {
            // Track function entry / exit approx
            const opens = (line.match(/\{/g) || []).length;
            const closes = (line.match(/\}/g) || []).length;
            
            if (line.includes('await') && fnDepth === 0) {
                console.log(`[Script ${scriptIdx} Line ${i+1}] Top-level await found:`, line.trim());
            }

            fnDepth += opens - closes;
            if (fnDepth < 0) fnDepth = 0;
        });
    }
}
