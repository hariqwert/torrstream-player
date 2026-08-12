const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

code = code.replace(
  /\/\/ if \(msg\) console\.log\(`\[FFmpeg Live Log\] \$\{msg\}`\);/,
  "if (msg) console.log(`[FFmpeg Live Log] ${msg}`);"
);

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched FFmpeg logs!");
