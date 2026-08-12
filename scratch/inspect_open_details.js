const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const jsStart = html.indexOf('// SPORTS & IPTV CHANNELS ENGINE');
const jsEnd = html.indexOf('async function openDetails(', jsStart);
console.log('jsStart:', jsStart, 'jsEnd:', jsEnd);
if (jsStart !== -1 && jsEnd !== -1) {
    console.log('Dummy block length:', jsEnd - jsStart);
}
