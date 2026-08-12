const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

code = code.replace(
    /                }, 1200\);\n            }\);/g,
    `                }, 1200);
            }, true);`
);

fs.writeFileSync('play.php', code);
console.log("Patched 2!");
