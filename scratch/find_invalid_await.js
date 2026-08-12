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
        
        let currentFn = null;
        let isAsync = false;

        lines.forEach((line, lineIdx) => {
            const fnMatch = line.match(/(async\s+)?function\s+(\w+)/);
            if (fnMatch) {
                isAsync = !!fnMatch[1];
                currentFn = fnMatch[2];
            }

            if (line.includes('await') && !isAsync) {
                console.log(`[Script ${scriptIdx} Line ${lineIdx + 1}] Non-async function '${currentFn}' contains await:`);
                console.log('   ', line.trim());
            }
        });
    }
}
