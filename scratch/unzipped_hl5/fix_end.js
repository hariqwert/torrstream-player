const fs = require('fs');

function fixFile(file) {
    let html = fs.readFileSync(file, 'utf8');
    html = html.replace(/            if\(!plyrContainer\) return;\n\n\n    <\/script>/g, '            if(!plyrContainer) return;\n        });\n    </script>');
    fs.writeFileSync(file, html);
}

fixFile('play.php');
fixFile('play_consumet.php');
