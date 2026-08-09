const fs = require('fs');

let code = fs.readFileSync('src/proxy.ts', 'utf8');

code = code.replace(/maxSockets: 100,/g, 'maxSockets: Infinity,');

fs.writeFileSync('src/proxy.ts', code);
