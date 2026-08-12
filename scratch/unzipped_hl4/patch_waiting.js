const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

code = code.replace(
  /videoPlayer\.addEventListener\('waiting', \(\) => \{\s*showLoading\('Buffering Stream\.\.\.', 'Fetching data from TorrServer cache\.\.\.'\);\s*\}\);/g,
  `videoPlayer.addEventListener('waiting', () => {
    if (videoPlayer.error || (videoPlayer.paused && typeof isPerformSeeking !== 'undefined' && !isPerformSeeking)) return;
    showLoading('Buffering Stream...', 'Fetching data from TorrServer cache...');
  });`
);

fs.writeFileSync('public/torrent.js', code);
console.log("Patched waiting event!");
