const fs = require('fs');

function fixFile(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/hideControls:\s*\{\s*enabled:\s*true,\s*delay:\s*3000\s*\}/g, "hideControls: { enabled: true, delay: 4000 }");

    fs.writeFileSync(file, code);
}

fixFile('play.php');
fixFile('play_consumet.php');
