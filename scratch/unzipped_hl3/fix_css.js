const fs = require('fs');

function fixCSS(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/\.plyr--is-touch \.plyr__controls\s*\{\s*opacity: 1 !important;\s*visibility: visible !important;\s*\}/g, `.plyr--is-touch .plyr__controls {
            opacity: 1 !important;
            visibility: visible !important;
            transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }`);
        
    code = code.replace(/\.plyr--is-touch\.plyr--hide-controls \.plyr__controls\s*\{\s*opacity: 0 !important;\s*visibility: hidden !important;\s*\}/g, `.plyr--is-touch.plyr--hide-controls .plyr__controls {
            opacity: 0 !important;
            visibility: hidden !important;
            transition: opacity 0.3s ease, visibility 0.3s ease !important;
        }`);

    fs.writeFileSync(file, code);
}

fixCSS('play.php');
fixCSS('play_consumet.php');
