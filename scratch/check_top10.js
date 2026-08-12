const fs = require('fs');

const code = fs.readFileSync('consumet.html', 'utf8');

console.log('top10Shelf in HTML:', code.includes('id="top10Shelf"'));
console.log('animeTop10Shelf in HTML:', code.includes('id="animeTop10Shelf"'));
console.log('loadTop10Today in JS:', code.includes('loadTop10Today'));
console.log('renderTop10Shelf in JS:', code.includes('renderTop10Shelf'));
