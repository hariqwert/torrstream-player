const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const target = `function enforceExactDuration() {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && videoPlayer) {
    if (window.plyrInstance && window.plyrInstance.duration) {
      // plyr doesn't let you easily override duration text directly unless we hack the DOM
      const timeDisplay = document.querySelector('.plyr__time--duration');
      if (timeDisplay) {
        timeDisplay.textContent = formatTime(window.exactProbedDuration);
      }
    }
  }
}`;

const replacement = `function enforceExactDuration() {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && videoPlayer) {
    if (window.plyrInstance) {
      const timeDisplay = document.querySelector('.plyr__time--duration');
      if (timeDisplay) {
        timeDisplay.textContent = formatTime(window.exactProbedDuration);
        timeDisplay.style.display = 'block';
      }
      
      // Also override the progress bar max
      const inputs = document.querySelectorAll('.plyr__progress input[type="range"]');
      inputs.forEach(input => {
         input.max = window.exactProbedDuration;
         input.setAttribute('aria-valuemax', window.exactProbedDuration);
      });
    }
  }
}

// Ensure it overrides constantly if Plyr tries to reset it
setInterval(() => {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && ffmpegEngineMode !== 'direct') {
    enforceExactDuration();
  }
}, 1000);`;

code = code.replace(target, replacement);
fs.writeFileSync('public/torrent.js', code);
