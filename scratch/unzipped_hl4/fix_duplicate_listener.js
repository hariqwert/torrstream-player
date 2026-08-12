const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const regex = /playerElement\.addEventListener\('error', function\(e\) \{[\s\S]*?\}\);/g;

code = code.replace(regex, `// Removed redundant error listener to prevent infinite fallback loops`);

fs.writeFileSync('public/torrent.js', code);
console.log("Patched duplicate listener!");
