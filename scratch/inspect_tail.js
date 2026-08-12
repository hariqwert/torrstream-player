const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const code = fs.readFileSync(filePath, 'utf8');

console.log('Total length of file:', code.length);
console.log('Last 2000 characters of consumet.html:\n');
console.log(code.slice(-2000));
