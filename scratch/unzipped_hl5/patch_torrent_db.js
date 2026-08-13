const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

code = code.replace(
    "torrProcess = spawn(torrServerPath, ['-p', '8090']);",
    "const dbPath = path.join(binPath, 'db');\n        if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });\n        torrProcess = spawn(torrServerPath, ['-p', '8090', '-d', dbPath]);"
);

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched torrProcess db path");
