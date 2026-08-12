const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const scriptStart = code.indexOf('<script>');
if (scriptStart !== -1) {
  const jsContent = code.substring(scriptStart + 8);
  console.log('--- START OF JS ---');
  console.log(jsContent.substring(0, 3000));
  console.log('--- END OF JS (last 3000 chars) ---');
  console.log(jsContent.substring(jsContent.length - 3000));
}
