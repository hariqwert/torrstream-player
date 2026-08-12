const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

if (!code.includes('bufferTimeoutTimer')) {
    code = code.replace(
      'function showLoading(title, subtitle) {',
      "let bufferTimeoutTimer = null;\nfunction showLoading(title, subtitle) {\n  if (bufferTimeoutTimer) clearTimeout(bufferTimeoutTimer);\n  bufferTimeoutTimer = setTimeout(() => {\n    if (!loadingOverlay.classList.contains('hidden') && title.includes('Buffering')) {\n      hideLoading();\n      alert('Stream buffering timed out. The torrent may be dead or have no active seeders. Try a different torrent.');\n    }\n  }, 25000);\n"
    );
    code = code.replace(
      'function hideLoading() {',
      "function hideLoading() {\n  if (bufferTimeoutTimer) clearTimeout(bufferTimeoutTimer);\n"
    );
    fs.writeFileSync('public/torrent.js', code);
    console.log("Patched timeout!");
}
