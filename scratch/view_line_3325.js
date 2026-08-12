const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

console.log(`Total lines in consumet.html: ${lines.length}`);
console.log('--- Lines 3315 to 3335 ---');

for (let i = 3314; i < Math.min(lines.length, 3335); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
