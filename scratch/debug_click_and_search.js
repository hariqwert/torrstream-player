const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const functions = [
    'openDetails',
    'openAnimeInfo',
    'openSearchPalette',
    'closeSearchPalette',
    'executeSearch',
    'debounceSearch',
    'launchTabSearch'
];

functions.forEach(fn => {
    const idx = html.indexOf(`function ${fn}`);
    const idxAsync = html.indexOf(`async function ${fn}`);
    console.log(`${fn}: ${idx !== -1 ? 'SYNC FOUND at ' + idx : (idxAsync !== -1 ? 'ASYNC FOUND at ' + idxAsync : 'MISSING!')}`);
});
