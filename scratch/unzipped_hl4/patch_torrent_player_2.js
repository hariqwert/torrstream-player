const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

code = code.replace(
  /window.location.href = `\/torrent.html\?play=\$\{encodeURIComponent\(queryStr\)\}`\;/g,
  "let url = `/torrent.html?play=${encodeURIComponent(queryStr)}&type=${type}`;\n    if (selectedMedia.id) url += `&tmdb=${selectedMedia.id}`;\n    window.location.href = url;"
);

fs.writeFileSync('consumet.html', code);
console.log("Patched openTorrentPlayer!");
