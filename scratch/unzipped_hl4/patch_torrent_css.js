const fs = require('fs');
let css = fs.readFileSync('public/torrent.css', 'utf8');

css += `
/* UI Hidden Mode (press q) */
body.ui-hidden .header, 
body.ui-hidden .side-panel,
body.ui-hidden .magnet-hero-card,
body.ui-hidden .torrent-meta-header {
  display: none !important;
}

body.ui-hidden .app-container {
  display: block;
  max-width: 100vw;
  padding: 0;
  height: 100vh;
}

body.ui-hidden .main-content {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

body.ui-hidden .player-card {
  height: 100vh !important;
  border-radius: 0;
  border: none;
  background: #000;
}

body.ui-hidden .player-placeholder {
  height: 100vh;
}
`;
fs.writeFileSync('public/torrent.css', css);
