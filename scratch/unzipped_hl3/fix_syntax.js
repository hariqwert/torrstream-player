const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const regex = /videoPlayer\.play\(\)\.catch\(e => \{\n\s*console\.log\('Autoplay deferred, waiting for user click:', e\);\n\s*\}\);\);\n\s*\}/g;

const replacement = `videoPlayer.play().catch(e => {
    console.log('Autoplay deferred, waiting for user click:', e);
  });`;

code = code.replace(regex, replacement);

fs.writeFileSync('public/torrent.js', code);
console.log("Fixed syntax error");
