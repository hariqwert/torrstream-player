const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');
const lines = code.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('handleInfoClick')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
