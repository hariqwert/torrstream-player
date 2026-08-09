const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    const target = `                        if (isDragging) {
                            const rect = container.getBoundingClientRect();`;

    const rep = `                        if (isDragging) {
                            if (window.plyrPlayer) {
                                window.plyrPlayer.toggleControls(true);
                            }
                            const rect = container.getBoundingClientRect();`;

    code = code.replace(target, rep);
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
