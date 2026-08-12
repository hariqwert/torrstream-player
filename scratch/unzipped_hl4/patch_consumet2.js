const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

code = code.replace(
    /const url = `\/torrent.html\?tmdb=\$\{tmdbId\}&type=\$\{mediaType\}&s=\$\{season\}&e=\$\{episode\}`;/g,
    "const url = `/torrent.html?q=${encodeURIComponent(title)}&tmdb=${tmdbId}&type=${mediaType}&s=${season}&e=${episode}`;"
);

fs.writeFileSync('consumet.html', code);
console.log("Patched consumet.html url params");
