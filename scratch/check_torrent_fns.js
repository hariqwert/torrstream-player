const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const functionsToCheck = [
    'renderShelfGrid',
    'appendFilterGrid',
    'renderTop10Shelf',
    'loadHollywoodPremieres',
    'openAnimeInfo',
    'openDetails',
    'renderSpotlightSlider',
    'renderAnimeSpotlightSlider',
    'openTorrentPlayerForItem'
];

functionsToCheck.forEach(fn => {
    const ok = html.includes(fn);
    console.log(fn, ':', ok ? 'FOUND' : 'MISSING!');
});
