const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const regex1 = /videoPlayer\.src = `\/play_torrent\.php\?url=\$\{encodeURIComponent\(streamUrl\)\}&name=\$\{encodeURIComponent\(title \|\| filePath \|\| 'Torrent Video Stream'\)\}`;/g;
code = code.replace(regex1, `videoPlayer.src = \`/play_torrent.php?url=\${encodeURIComponent(streamUrl)}&name=\${encodeURIComponent(title || filePath || 'Torrent Video Stream')}\`;\nhideLoading();`);

const regex2 = /videoPlayer\.src = `\/play_torrent\.php\?url=\$\{encodeURIComponent\(url\)\}&name=\$\{encodeURIComponent\(title \|\| 'Torrent Video Stream'\)\}`;/g;
code = code.replace(regex2, `videoPlayer.src = \`/play_torrent.php?url=\${encodeURIComponent(url)}&name=\${encodeURIComponent(title || 'Torrent Video Stream')}\`;\nhideLoading();`);

fs.writeFileSync('public/torrent.js', code);
console.log("Fixed loading visibility.");
