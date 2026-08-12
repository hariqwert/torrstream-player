const fs = require('fs');
const path = require('path');

const userHtml = fs.readFileSync(path.join(__dirname, 'user_old_version.html'), 'utf8');

// Find all script blocks
const scripts = [];
const regex = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
let match;
while ((match = regex.exec(userHtml)) !== null) {
  if (match[1].trim()) {
    scripts.push(match[1]);
  }
}

console.log('Total non-empty inline scripts in user_old_version.html:', scripts.length);
scripts.forEach((s, idx) => {
  console.log(`Script ${idx + 1} length:`, s.length);
  // Extract key function names defined in script
  const fnMatches = s.match(/function\s+([a-zA-Z0-9_$]+)/g) || [];
  console.log(`Script ${idx + 1} functions:`, fnMatches.map(f => f.replace('function ', '')));
});
