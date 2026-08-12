const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');
const lines = html.split('\n');

console.log('--- Lines 3270 to 3290 ---');

for (let i = 3269; i < 3290; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
}
