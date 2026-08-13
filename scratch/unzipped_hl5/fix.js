const fs = require('fs');
const path = 'public/torrent.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(`    ffmpegEngineBtn.addEventListener('click', () => {
        gstEngineMode = 'transcode';
      } else {
        gstEngineMode = 'direct';
      }`, `    ffmpegEngineBtn.addEventListener('click', () => {
      if (gstEngineMode === 'direct') {
        gstEngineMode = 'remux';
      } else if (gstEngineMode === 'remux') {
        gstEngineMode = 'transcode';
      } else {
        gstEngineMode = 'direct';
      }`);
fs.writeFileSync(path, content);
