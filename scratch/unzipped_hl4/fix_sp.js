const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');
html = html.replace(/<!-- Apple TV Style User Avatar Circle -->[\s\S]*?<\/div>/, '');
fs.writeFileSync('consumet.html', html, 'utf8');
