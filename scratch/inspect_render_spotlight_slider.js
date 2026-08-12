const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const idx = html.indexOf('function renderSpotlightSlider');
if (idx !== -1) {
    console.log(html.substring(idx, idx + 1000));
} else {
    console.log('function renderSpotlightSlider NOT FOUND');
}
