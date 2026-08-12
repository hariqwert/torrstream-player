const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const idx = html.indexOf('function renderAnimeShelf');
if (idx !== -1) {
    console.log(html.substring(idx + 500, idx + 2000));
}
