const fs = require('fs');
const path = require('path');

const userHtml = fs.readFileSync(path.join(__dirname, 'user_old_version.html'), 'utf8');

const scriptPositions = [];
let pos = 0;
while ((pos = userHtml.indexOf('<script', pos)) !== -1) {
  const close = userHtml.indexOf('>', pos);
  scriptPositions.push(userHtml.substring(pos, close + 1));
  pos = close + 1;
}

console.log('Script tag headers found in user_old_version.html:');
console.log(scriptPositions);

// Let's find where the main script starts in user_old_version.html
const lastScriptIdx = userHtml.lastIndexOf('<script');
console.log('\nLast script tag header:', userHtml.substring(lastScriptIdx, userHtml.indexOf('>', lastScriptIdx) + 1));
console.log('First 500 chars of last script:\n', userHtml.substring(lastScriptIdx, lastScriptIdx + 500));
