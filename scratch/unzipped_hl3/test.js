const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');
code = code.replace(/if \(text\.startsWith\('<'\)\) throw new Error\('Received HTML instead of JSON on add'\);/, 
`if (text.startsWith('<')) { console.error("HTML RETURNED:", text.substring(0, 200)); throw new Error('Received HTML instead of JSON on add'); }`);
fs.writeFileSync('public/torrent.js', code);
