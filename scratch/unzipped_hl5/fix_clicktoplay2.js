const fs = require('fs');
function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/clickToPlay: false/g, "clickToPlay: true");
    fs.writeFileSync(file, code);
}
fix('play.php');
fix('play_consumet.php');
