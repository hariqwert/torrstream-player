const fs = require('fs');

function restoreLazy(file) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/autoCleanupMinBackwardDuration: 10,?\s*\}/g, "autoCleanupMinBackwardDuration: 10,\n                        lazyLoad: false\n                    }");
    fs.writeFileSync(file, code);
}

restoreLazy('play.php');
restoreLazy('play_consumet.php');
