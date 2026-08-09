const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    const target = `                        if (isDragging) {
                            if (window.plyrPlayer) {
                                window.plyrPlayer.toggleControls(true);
                            }`;
                    
    const rep = `                        if (isDragging) {`;
                    
    code = code.replace(target, rep);
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
