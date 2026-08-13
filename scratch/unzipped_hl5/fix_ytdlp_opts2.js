const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace("'-J', '--no-playlist', '--no-warnings', ''--js-runtimes', 'node'", "'-J', '--no-playlist', '--no-warnings', '--js-runtimes', 'node'");
content = content.replace("'--no-warnings', ''--js-runtimes', 'node'", "'--no-warnings', '--js-runtimes', 'node'");

fs.writeFileSync('server.ts', content);
