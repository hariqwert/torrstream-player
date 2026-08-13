const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const target = `  const handleSeekRequest = (targetSecs) => {
    if (!currentStreamInfo || !currentStreamInfo.hash) return;
    if (isPerformSeeking) return;`;

const replacement = `  const handleSeekRequest = (targetSecs) => {
    if (!currentStreamInfo || !currentStreamInfo.hash) return;
    if (isPerformSeeking) return;
    if (ffmpegEngineMode === 'direct') {
        // Native browser player handles byte-range seeking natively for direct mp4/mkv.
        return;
    }`;

code = code.replace(target, replacement);
fs.writeFileSync('public/torrent.js', code);
