const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');
html = html.replace(/title\.replace\(\/'\/g, "\\'"\)/g, "title.replace(/'/g, \"\\\\'\")");
fs.writeFileSync('consumet.html', html);
