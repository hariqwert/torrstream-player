const fs = require('fs');
let code = fs.readFileSync('public/torrent.html', 'utf8');

code = code.replace(/TorrStream — Instant Magnet Video Player/g, "Stalker Pro - Torrent Player");
code = code.replace(/<h1>TorrStream<\/h1>/g, "<h1>Stalker Pro Torrent<\/h1>");
code = code.replace(/<p>TorrStream • Integrated/g, "<p>Stalker Pro • Integrated");

fs.writeFileSync('public/torrent.html', code);
console.log("Patched torrent.html");
