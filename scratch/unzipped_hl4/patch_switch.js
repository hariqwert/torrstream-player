const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /renderShelfGrid\(data\.results\.slice\(0, 15\), 'homeLowerShelf'\);/;

html = html.replace(regex, `renderShelfGrid(data.results.slice(0, 15), 'homeLowerShelf', 'movie', category === 'oscar');`);
fs.writeFileSync('consumet.html', html);
