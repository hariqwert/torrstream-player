const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/\}\);\s*app\.get\('\/play_torrent\.php'/g, "});\n});\napp.get('/play_torrent.php'");
code = code.replace(/\}\);\s*\}\);\s*app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");

fs.writeFileSync('server.ts', code);
console.log("Applied regex replacement");
