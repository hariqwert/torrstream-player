const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

code = code.replace(/setInterval\(\(\) => \{\n  if \(window.exactProbedDuration[\s\S]+?\n\}, 500\);\n/, '');

const script = `
// Force Plyr duration display continuously
setInterval(() => {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && typeof ffmpegEngineMode !== 'undefined' && ffmpegEngineMode !== 'direct') {
    const totalSecs = Math.floor(window.exactProbedDuration);
    
    const timeDisplays = document.querySelectorAll('.plyr__time--duration');
    timeDisplays.forEach(el => {
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = (totalSecs % 60).toString().padStart(2, '0');
      const formattedTotal = hours > 0 
        ? \`\${hours}:\${mins.toString().padStart(2, '0')}:\${secs}\` 
        : \`\${mins.toString().padStart(2, '0')}:\${secs}\`;
      el.textContent = formattedTotal;
    });
    
    // Fix current time
    const currentTimeDisplays = document.querySelectorAll('.plyr__time--current');
    currentTimeDisplays.forEach(el => {
      const seekOffset = window.currentSeekOffset || 0;
      const currentActualSecs = Math.min(totalSecs, Math.floor(seekOffset + (window.videoPlayer ? window.videoPlayer.currentTime : 0)));
      const chours = Math.floor(currentActualSecs / 3600);
      const cmins = Math.floor((currentActualSecs % 3600) / 60);
      const csecs = (currentActualSecs % 60).toString().padStart(2, '0');
      const formattedCurrent = chours > 0 
        ? \`\${chours}:\${cmins.toString().padStart(2, '0')}:\${csecs}\` 
        : \`\${cmins.toString().padStart(2, '0')}:\${csecs}\`;
      el.textContent = formattedCurrent;
    });

    const inputs = document.querySelectorAll('.plyr__progress input[type="range"]');
    inputs.forEach(input => {
       input.max = window.exactProbedDuration;
       input.setAttribute('aria-valuemax', window.exactProbedDuration);
       const seekOffset = window.currentSeekOffset || 0;
       const currentActualSecs = Math.min(totalSecs, Math.floor(seekOffset + (window.videoPlayer ? window.videoPlayer.currentTime : 0)));
       // don't overwrite value if user is seeking
       if (!document.activeElement || document.activeElement !== input) {
           input.value = currentActualSecs;
           input.style.setProperty('--value', (currentActualSecs / window.exactProbedDuration * 100) + '%');
       }
    });
  }
}, 500);
`;
code += script;
fs.writeFileSync('public/torrent.js', code);
