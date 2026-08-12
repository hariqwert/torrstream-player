const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const idx = html.indexOf('openDetails');
console.log('first openDetails at:', idx);

let pos = 0;
while ((pos = html.indexOf('function openDetails', pos)) !== -1) {
    console.log('function openDetails at:', pos);
    console.log(html.substring(pos - 40, pos + 100));
    pos += 20;
}
