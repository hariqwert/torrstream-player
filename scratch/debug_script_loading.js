const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const scriptTagMatches = code.match(/<script[\s\S]*?>/gi);
console.log('Script tag opening matches:', scriptTagMatches);

// Find script index
const idx = code.indexOf('<script>');
console.log('First <script> without src at index:', idx);

// Check if there are syntax errors in the whole HTML when parsed
const lastScriptIdx = code.lastIndexOf('<script>');
console.log('Last <script> at index:', lastScriptIdx);
const lastScriptContent = code.substring(lastScriptIdx + 8, code.lastIndexOf('</script>'));

console.log('First 500 chars of main script:\n', lastScriptContent.substring(0, 500));
console.log('\nLast 500 chars of main script:\n', lastScriptContent.substring(lastScriptContent.length - 500));
