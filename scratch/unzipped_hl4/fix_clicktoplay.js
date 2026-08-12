const fs = require('fs');
function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/hideControls: \{ enabled: true, delay: 4000 \}/g, "hideControls: { enabled: true, delay: 4000 },\n                clickToPlay: false");
    fs.writeFileSync(file, code);
}
fix('play.php');
fix('play_consumet.php');
