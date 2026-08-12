const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const code = fs.readFileSync(filePath, 'utf8');

const regex = /<script[\s\S]*?>/gi;
let match;
while ((match = regex.exec(code)) !== null) {
  console.log('Found script tag at index:', match.index, 'tag:', match[0]);
}

const endScriptRegex = /<\/script>/gi;
let endMatch;
while ((endMatch = endScriptRegex.exec(code)) !== null) {
  console.log('Found </script> at index:', endMatch.index);
}
