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
        
        // Binary search to locate exact line of syntax error
        for (let i = 1; i <= lines.length; i++) {
            const chunk = lines.slice(0, i).join('\n');
            try {
                new Function(chunk);
            } catch (e) {
                if (e.message.includes('await is only valid in async functions')) {
                    console.log(`Syntax Error triggered at or before line ${i}:`);
                    console.log('Line content:', lines[i - 1]);
                    // Print surrounding context
                    for (let j = Math.max(0, i - 15); j < Math.min(lines.length, i + 5); j++) {
                        console.log(`${j + 1}: ${lines[j]}`);
                    }
                    break;
                }
            }
        }
    }
}
