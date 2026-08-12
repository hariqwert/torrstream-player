const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

function printFullFn(marker) {
    const idx = html.indexOf(marker);
    if (idx !== -1) {
        console.log(`\n=== FULL FN: ${marker} ===`);
        console.log(html.substring(idx, idx + 1800));
    }
}

printFullFn('function appendFilterGrid');
printFullFn('function renderTop10Shelf');
printFullFn('async function loadHollywoodPremieres');
