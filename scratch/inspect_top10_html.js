const fs = require('fs');

const code = fs.readFileSync('consumet.html', 'utf8');

const idx1 = code.indexOf('id="top10Shelf"');
if (idx1 !== -1) {
  console.log('\n--- TOP 10 TODAY HTML BLOCK ---');
  console.log(code.substring(idx1 - 300, idx1 + 200));
}

const idx2 = code.indexOf('id="animeTop10Shelf"');
if (idx2 !== -1) {
  console.log('\n--- ANIME TOP 10 HTML BLOCK ---');
  console.log(code.substring(idx2 - 300, idx2 + 200));
}
