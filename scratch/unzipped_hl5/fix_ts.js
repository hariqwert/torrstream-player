const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("            } else {\n                \n                if (isBotBlock) {",
"            } else {\n                const isBotBlock = errData.includes('Sign in to confirm') || errData.includes('bot');\n                if (isBotBlock) {");

fs.writeFileSync('server.ts', content);
