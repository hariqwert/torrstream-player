const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

code = code.replace(
    "import { createProxyMiddleware } from 'http-proxy-middleware';",
    "import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';"
);

code = code.replace(
    "app.use('/torrents', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));",
    "app.use('/torrents', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, on: { proxyReq: fixRequestBody } }));"
);
code = code.replace(
    "app.use('/echo', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));",
    "app.use('/echo', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, on: { proxyReq: fixRequestBody } }));"
);
code = code.replace(
    "app.use('/stream', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));",
    "app.use('/stream', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, on: { proxyReq: fixRequestBody } }));"
);
code = code.replace(
    "app.use('/settings', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true }));",
    "app.use('/settings', createProxyMiddleware({ target: 'http://127.0.0.1:8090', changeOrigin: true, on: { proxyReq: fixRequestBody } }));"
);

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched proxy with fixRequestBody");
