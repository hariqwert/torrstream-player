const fs = require('fs');
let content = fs.readFileSync('public/watchdog.js', 'utf8');

content = content.replace(/if\s*\(window\.location\.pathname\.indexOf\('hari\.html'\)\s*!==\s*-1\)\s*\{\s*return;\s*\}/, "if (document.cookie.indexOf('admin_auth=') !== -1) return;");

content = content.replace(/window\.location\.pathname\.indexOf\('hari\.html'\)\s*===\s*-1/g, "document.cookie.indexOf('admin_auth=') === -1");

fs.writeFileSync('public/watchdog.js', content);
