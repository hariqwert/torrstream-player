const fs = require('fs');

function fixFile(file) {
    let code = fs.readFileSync(file, 'utf8');

    // In play.php
    code = code.replace(/settings: \['quality', 'speed'\]\n\s*\};/, "settings: ['quality', 'speed'],\n                hideControls: { enabled: true, delay: 3000 }\n            };");
    
    // In play_consumet.php
    code = code.replace(/muted: false\n\s*\}\);/g, "muted: false,\n                                hideControls: { enabled: true, delay: 3000 }\n                            });");

    fs.writeFileSync(file, code);
}

fixFile('play.php');
fixFile('play_consumet.php');
