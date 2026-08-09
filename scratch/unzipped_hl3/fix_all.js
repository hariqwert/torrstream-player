const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace("    });app.get('/play_torrent.php', (req, res) => {", "    });\n});\napp.get('/play_torrent.php', (req, res) => {");
code = code.replace("    });});});app.get('/play_media.html', (req, res) => {", "    });\n});\napp.get('/play_media.html', (req, res) => {");
code = code.replace("    });});app.get('/play_media.html', (req, res) => {", "    });\n});\napp.get('/play_media.html', (req, res) => {");

fs.writeFileSync('server.ts', code);
console.log("Fixed server routing syntax perfectly.");
