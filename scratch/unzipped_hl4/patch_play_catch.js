const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

code = code.replace(
  /window\.plyrInstance\.play\(\)\.catch\(e => \{\s*console\.log\('Autoplay deferred, waiting for user click:', e\);\s*\}\);/g,
  "window.plyrInstance.play().catch(e => {\n        console.log('Autoplay deferred, waiting for user click:', e);\n        hideLoading();\n      });"
);

code = code.replace(
  /videoPlayer\.play\(\)\.catch\(e => \{\s*console\.log\('Autoplay deferred, waiting for user click:', e\);\s*\}\);/g,
  "videoPlayer.play().catch(e => {\n        console.log('Autoplay deferred, waiting for user click:', e);\n        hideLoading();\n      });"
);

code = code.replace(
  /videoPlayer\.play\(\)\.catch\(\(\) => \{\}\);/g,
  "videoPlayer.play().catch(() => { hideLoading(); });"
);

fs.writeFileSync('public/torrent.js', code);
console.log("Patched catch blocks!");
