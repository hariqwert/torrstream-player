const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

const exitHandler = `
    process.on('exit', () => { if (torrProcess) torrProcess.kill(); });
    process.on('SIGINT', () => { if (torrProcess) torrProcess.kill(); process.exit(); });
    process.on('SIGTERM', () => { if (torrProcess) torrProcess.kill(); process.exit(); });
`;

if (!code.includes("process.on('exit'")) {
    code = code.replace("app.use('/settings', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));", 
                        "app.use('/settings', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));\n" + exitHandler);
}

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched exit handler");
