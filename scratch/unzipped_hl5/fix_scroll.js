const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');
code = code.replace(/}ijacking removed[\s\S]*?}\n/, '}\n');
fs.writeFileSync('consumet.html', code);
