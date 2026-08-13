const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add import
if (!code.includes("setupTorrentProxies")) {
    code = code.replace("import { GoogleGenAI, Type } from '@google/genai';", "import { GoogleGenAI, Type } from '@google/genai';\nimport { setupTorrentProxies } from './src/routes/torrent';");
}

// Add function call after app setup
if (!code.includes("setupTorrentProxies(app);")) {
    code = code.replace("app.use('/api/subtitles', subtitlesRouter);", "app.use('/api/subtitles', subtitlesRouter);\nsetupTorrentProxies(app);");
}

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts");
