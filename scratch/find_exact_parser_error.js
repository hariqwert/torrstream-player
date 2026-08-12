const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

        // Let's test parsing line ranges
        for (let i = 1; i <= lines.length; i++) {
            const subCode = lines.slice(0, i).join('\n');
            try {
                new vm.Script(subCode);
            } catch (e) {
                // Ignore unexpected end of input because it's incomplete
                if (!e.message.includes('Unexpected end of input') && !e.message.includes('Unexpected token')) {
                    console.log(`Script ${scriptIdx} Error at line ${i}: ${e.message}`);
                    console.log('Line content:', lines[i-1]);
                }
            }
        }
    }
}
