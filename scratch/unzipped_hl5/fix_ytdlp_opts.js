const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace both occurrences of the bad compat option
content = content.replace("--compat-options', 'no-python-warning', ", "");
content = content.replace("--compat-options', 'no-python-warning', ", "");

fs.writeFileSync('server.ts', content);
