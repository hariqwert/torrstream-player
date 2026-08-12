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

        lines.forEach((line, i) => {
            if (line.includes('await')) {
                // Find enclosing function header above line i
                let foundFn = false;
                for (let j = i; j >= 0; j--) {
                    const fnHeader = lines[j].match(/(async\s+)?function\s+(\w+)/);
                    if (fnHeader) {
                        foundFn = true;
                        if (!fnHeader[1]) {
                            console.log(`Line ${i + 1} uses await inside non-async '${fnHeader[2]}' at line ${j + 1}:`);
                            console.log(`   Fn:   ${lines[j].trim()}`);
                            console.log(`   Line: ${line.trim()}`);
                        }
                        break;
                    }
                }
            }
        });
    }
}
