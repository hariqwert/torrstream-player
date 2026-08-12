const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let code = fs.readFileSync(filePath, 'utf8');

console.log('HTML File size:', code.length);

// Check presence of info buttons
const infoBtnMatches = code.match(/handleInfoClick/g) || [];
console.log('Total handleInfoClick occurrences:', infoBtnMatches.length);
