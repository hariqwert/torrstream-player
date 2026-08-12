const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

code = code.replace(
  /e\.preventDefault\(\);\s*console\.warn\('Caught unhandled DOM element error:', e\);/,
  "e.preventDefault();\n        e.stopImmediatePropagation();\n        console.warn('Caught unhandled DOM element error:', e);"
);

fs.writeFileSync('public/torrent.js', code);
