const fs = require('fs');

const code = fs.readFileSync('consumet.html', 'utf8');

const fnIdx = code.indexOf('function renderTop10Shelf');
if (fnIdx !== -1) {
  console.log(code.substring(fnIdx, fnIdx + 1200));
}
