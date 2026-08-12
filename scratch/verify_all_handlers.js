const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const scriptStart = code.indexOf('<script>');
const jsCode = scriptStart !== -1 ? code.substring(scriptStart) : '';

// Regex to extract function names called in inline HTML event handlers
const handlerRegex = /on[a-z]+=["']([^"']+)["']/gi;
let match;
const fnNames = new Set();
while ((match = handlerRegex.exec(code)) !== null) {
  const handlerBody = match[1];
  // Extract function names like foo(...), bar()
  const calls = handlerBody.match(/([a-zA-Z0-9_$]+)\s*\(/g);
  if (calls) {
    calls.forEach(c => {
      const name = c.replace(/\s*\(/, '').trim();
      if (!['if', 'for', 'while', 'switch', 'catch', 'parseInt', 'parseFloat', 'Math'].includes(name)) {
        fnNames.add(name);
      }
    });
  }
}

console.log('--- ALL FUNCTIONS CALLED IN HTML HANDLERS ---');
const missing = [];
[...fnNames].sort().forEach(fn => {
  const isPresent = new RegExp(`function\\s+${fn}\\b|var\\s+${fn}\\s*=|let\\s+${fn}\\s*=|const\\s+${fn}\\s*=`).test(jsCode);
  if (!isPresent) missing.push(fn);
  console.log(`${fn}: ${isPresent ? 'OK' : 'MISSING!'}`);
});

console.log('\nTotal Missing Handlers:', missing.length);
if (missing.length) console.log('Missing:', missing);
