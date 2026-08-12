const fs = require('fs');
let code = fs.readFileSync('src/proxy.ts', 'utf8');
code = code.replace(/    \}\n    \};\n    addStreamingIp\(cleanIp\);/g, "    }\n    addStreamingIp(cleanIp);");
fs.writeFileSync('src/proxy.ts', code);
