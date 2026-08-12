const fs = require('fs');

let code = fs.readFileSync('src/proxy.ts', 'utf8');

code = code.replace(
    /res\.setHeader\('Content-Type', 'application\/vnd\.apple\.mpegurl'\);/g,
    `res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');`
);

fs.writeFileSync('src/proxy.ts', code);
