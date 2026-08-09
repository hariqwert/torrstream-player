const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const regex = /\n\s*\/\/ Live TorrServer Statistics Poller/g;
code = code.replace(regex, "\n}\n// Live TorrServer Statistics Poller");

fs.writeFileSync('public/torrent.js', code);
console.log("Fixed setupEventListeners closing bracket.");
