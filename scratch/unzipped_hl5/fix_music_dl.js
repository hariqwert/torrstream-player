const fs = require('fs');
let content = fs.readFileSync('music.html', 'utf8');

const regex = /\} else if \(typeof isVideoBgEnabled \!== 'undefined' && isVideoBgEnabled && typeof currentVideoId \!== 'undefined' && currentVideoId\) \{\s*ytVid = currentVideoId;\s*\}/;
content = content.replace(regex, "}");

fs.writeFileSync('music.html', content);
