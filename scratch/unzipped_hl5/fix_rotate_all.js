const fs = require('fs');

function fixRotateAll(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(
        /const playerContainer = document\.querySelector\('\.plyr'\) \|\| document\.getElementById\('player-container'\);/g,
        "const playerContainer = document.getElementById('player-container');"
    );

    // Make sure player-container has fixed position correctly to rotate everything inside
    code = code.replace(
        /playerContainer\.style\.zIndex = '9997'; \/\/ Below controls, above background/g,
        "playerContainer.style.zIndex = '9999'; // Bring to front"
    );

    fs.writeFileSync(file, code);
}

fixRotateAll('play.php');
fixRotateAll('play_consumet.php');
