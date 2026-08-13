const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/\.plyr--is-touch\.plyr--hide-controls \.plyr__controls \{[\s\S]*?\}\s*/, '');
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
