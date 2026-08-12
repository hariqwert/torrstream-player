const fs = require('fs');
let code = fs.readFileSync('public/torrent.html', 'utf8');

code = code.replace(
  '<p id="loadingSubtitle">Connecting to BitTorrent peers via TorrServer...</p>',
  '<p id="loadingSubtitle">Connecting to BitTorrent peers via TorrServer...</p>\n                <p id="loadingStats" style="font-size: 0.85rem; color: #a1a1aa; margin-top: 6px; font-weight: bold;"></p>'
);
fs.writeFileSync('public/torrent.html', code);

code = fs.readFileSync('public/torrent.js', 'utf8');

code = code.replace(
  /if \(typeof buffer === 'number' && bufferProgressFill\) \{/g,
  "const loadingStats = document.getElementById('loadingStats');\n        if (loadingStats && loadingOverlay && !loadingOverlay.classList.contains('hidden')) {\n          loadingStats.textContent = `Speed: ${speed} | Peers: ${peers} | Status: ${typeof buffer === 'number' ? `Buffer ${buffer}%` : buffer}`;\n        }\n        if (typeof buffer === 'number' && bufferProgressFill) {"
);

fs.writeFileSync('public/torrent.js', code);
console.log("Patched loader!");
