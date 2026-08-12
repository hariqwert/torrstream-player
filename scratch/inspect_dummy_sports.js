const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const jsStart = html.indexOf('// SPORTS & IPTV CHANNELS ENGINE');
console.log('jsStart:', jsStart);
if (jsStart !== -1) {
    console.log(html.substring(jsStart, jsStart + 1500));
}
