const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

// Find all script tags
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIdx = 0;

while ((match = scriptRegex.exec(html)) !== null) {
    scriptIdx++;
    const src = match[0].match(/src=["']([^"']+)["']/);
    if (!src && match[1].trim().length > 0) {
        const code = match[1];
        try {
            new Function(code);
            console.log(`Script ${scriptIdx}: SYNTAX OK!`);
        } catch (e) {
            console.error(`Script ${scriptIdx}: SYNTAX ERROR! ${e.message}`);
            // Find line of error
            const lines = code.split('\n');
            lines.forEach((line, i) => {
                if (line.includes('await')) {
                    // Check if enclosed in async function
                    // We can check surrounding lines
                    console.log(`Line ${i+1}: ${line.trim().substring(0, 100)}`);
                }
            });
        }
    }
}
