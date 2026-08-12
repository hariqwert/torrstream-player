const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

function printFnSnippet(name, len = 1000) {
    const idx = html.indexOf(name);
    console.log(`\n--- ${name} ---`);
    if (idx !== -1) {
        console.log(html.substring(idx, idx + len));
    } else {
        console.log('NOT FOUND');
    }
}

printFnSnippet('function appendFilterGrid');
printFnSnippet('function renderTop10Shelf');
printFnSnippet('async function loadHollywoodPremieres');
