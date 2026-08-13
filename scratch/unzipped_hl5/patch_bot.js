const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/\/\* isBotBlock already calculated \*\//g, "");
// But I need `const isBotBlock = errData.includes('Sign in to confirm') || errData.includes('bot');` to be available. 
// Since `isBotBlock` is defined inside `if (code === 0 && stdout) { ... } else { ... }`, wait, the `isBotBlock` was originally inside `if (!res.headersSent) { ... }`.
// I defined `const isBotBlock = errData.includes(...)` at the beginning of the `else` block now.
fs.writeFileSync('server.ts', content);
