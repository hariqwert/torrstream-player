const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

function getSubstring(marker, len = 400) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
        console.log(`\n=== MARKER: ${marker} ===`);
        console.log(html.substring(idx, idx + len));
    } else {
        console.log(`\n=== MARKER: ${marker} NOT FOUND ===`);
    }
}

getSubstring('function appendFilterGrid');
getSubstring('function renderTop10Shelf');
getSubstring('async function loadHollywoodPremieres');
