const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

code = code.replace(
    "let torrProcess: any = null;\n    function startTorrServer() {\n        console.log(\"Starting TorrServer on port 8090...\");\n        if (torrProcess) {",
    "let torrProcess: any = null;\n    function startTorrServer() {\n        console.log(\"Starting TorrServer on port 8090...\");\n        if (typeof torrProcess !== 'undefined' && torrProcess !== null) {"
);

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched torrProcess");
