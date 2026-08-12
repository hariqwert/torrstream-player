const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    // Remove any remaining plyr--is-touch CSS blocks that might interfere
    code = code.replace(/\/\* Mobile touch fixes \*\/[\s\S]*?(?=\/\* Disable TV spatial navigation borders \*\/)/, '');
    
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
