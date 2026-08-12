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
        try {
            new vm.Script(code);
            console.log(`Script ${scriptIdx}: VM PARSED CLEANLY!`);
        } catch (e) {
            console.error(`Script ${scriptIdx} VM error:`, e.message);
            const stack = e.stack || '';
            console.log('Stack:', stack.substring(0, 300));
            // Find line number from stack
            const lineMatch = stack.match(/evalmachine\.<anonymous>:(\d+)/);
            if (lineMatch) {
                const lineNo = parseInt(lineMatch[1]);
                console.log(`Error on line ${lineNo}:`);
                const lines = code.split('\n');
                for (let j = Math.max(0, lineNo - 10); j < Math.min(lines.length, lineNo + 5); j++) {
                    console.log(`${j + 1}: ${lines[j]}`);
                }
            }
        }
    }
}
