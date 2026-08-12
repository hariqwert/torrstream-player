const fs = require('fs');
const path = require('path');

const userHtml = fs.readFileSync(path.join(__dirname, 'user_old_version.html'), 'utf8');

const lastScriptIdx = userHtml.lastIndexOf('<script>');
const scriptContent = userHtml.substring(lastScriptIdx + 8);

console.log('Script length in user payload:', scriptContent.length);
console.log('\n--- FIRST 1000 CHARS OF SCRIPT ---\n');
console.log(scriptContent.substring(0, 1000));

console.log('\n--- LAST 1000 CHARS OF SCRIPT ---\n');
console.log(scriptContent.substring(scriptContent.length - 1000));
