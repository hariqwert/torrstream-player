const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    const targetMove = `                    if (deltaX < 30) { // vertical swipe
                        e.preventDefault(); // prevent scroll`;

    const repMove = `                    if (deltaX < 30) { // vertical swipe
                        e.preventDefault(); // prevent scroll
                        // Keep controls visible during swipe
                        if (window.plyrPlayer) {
                            window.plyrPlayer.toggleControls(true);
                        }`;

    code = code.replace(targetMove, repMove);
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
