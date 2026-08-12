const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

// Regex for on<event>="handler(...)" or on<event>='handler(...)'
const handlerRegex = /on[a-z]+=["']([^"']+)["']/gi;
let match;
const handlers = new Set();
while ((match = handlerRegex.exec(code)) !== null) {
  handlers.add(match[1]);
}

console.log('Total inline event handlers found in HTML:', handlers.size);
console.log('\nHandlers:\n' + [...handlers].sort().join('\n'));
