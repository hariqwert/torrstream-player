const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

console.log('--- Lines 3290 to 3315 ---');

for (let i = 3289; i < 3315; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
