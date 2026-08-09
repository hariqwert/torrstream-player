const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');
code = code.split('let brightness = 100;')[0];
fs.writeFileSync('public/torrent.js', code);
console.log("Removed dead gestures code.");
