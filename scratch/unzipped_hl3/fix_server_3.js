const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/    \}\);app\.get\('\/play_torrent\.php'/g, "    });\n});\napp.get('/play_torrent.php'");
code = code.replace(/    \}\);\n\}\);\n\}\);\napp\.get\('\/play_media\.html'/g, "    });\n});\napp.get('/play_media.html'");
code = code.replace(/\}\);\n\}\);\n\}\);app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");
code = code.replace(/\}\);\n\}\);\}\);app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");
code = code.replace(/\}\);\n\}\);\}\);app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");
code = code.replace(/\}\);\}\);\}\);app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");
code = code.replace(/\}\);\}\);app\.get\('\/play_media\.html'/g, "});\napp.get('/play_media.html'");

fs.writeFileSync('server.ts', code);
console.log("Fixed server routing syntax perfectly.");
