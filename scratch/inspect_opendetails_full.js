const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const idx = html.indexOf('function openDetails');
if (idx !== -1) {
    console.log(html.substring(idx, idx + 2500));
} else {
    console.log('openDetails NOT FOUND');
}
