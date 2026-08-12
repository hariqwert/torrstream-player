const fs = require('fs');
const path = require('path');
const esprima = require('esprima');

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
        try {
            esprima.parseScript(code, { loc: true });
            console.log(`Script ${scriptIdx}: ESPRIMA PARSED CLEANLY!`);
        } catch (e) {
            console.error(`Script ${scriptIdx} Esprima error:`, e.message, 'at line', e.lineNumber, 'column', e.column);
            const lines = code.split('\n');
            if (e.lineNumber) {
                for (let j = Math.max(0, e.lineNumber - 5); j < Math.min(lines.length, e.lineNumber + 5); j++) {
                    console.log(`${j + 1}: ${lines[j]}`);
                }
            }
        }
    }
}
