const fs = require('fs');
let code = fs.readFileSync('src/routes/customM3uProxy.ts', 'utf8');
code = code.replace(/    \}\n    \};\n    if \(referer\)/g, "    }\n    if (referer)");
fs.writeFileSync('src/routes/customM3uProxy.ts', code);
