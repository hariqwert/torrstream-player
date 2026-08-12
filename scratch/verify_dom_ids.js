const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const idMatches = code.match(/id=["']([^"']+)["']/gi);
const allIds = new Set();
if (idMatches) {
  idMatches.forEach(m => {
    const id = m.match(/id=["']([^"']+)["']/)[1];
    allIds.add(id);
  });
}

console.log('Total unique HTML element IDs in consumet.html:', allIds.size);
console.log('\nHTML Element IDs:\n' + [...allIds].sort().join('\n'));
