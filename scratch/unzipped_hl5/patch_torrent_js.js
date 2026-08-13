const fs = require('fs');
let js = fs.readFileSync('public/torrent.js', 'utf8');

js += `
// Keyboard shortcut 'q' to toggle UI
document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    // Only if not typing in input
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      document.body.classList.toggle('ui-hidden');
    }
  }
});

// Set default UI hidden mode on load so normal user only sees the video player
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('ui-hidden');
});
`;
fs.writeFileSync('public/torrent.js', js);
