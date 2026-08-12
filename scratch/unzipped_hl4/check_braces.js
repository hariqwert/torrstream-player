const fs = require('fs');
const html = fs.readFileSync('consumet.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
const code = scripts[4][1];

let depth = 0;
let lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
        if (char === '{') depth++;
        if (char === '}') depth--;
    }
}
console.log('Final depth:', depth);

