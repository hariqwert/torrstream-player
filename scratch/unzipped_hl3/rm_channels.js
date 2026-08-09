const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Remove desktop tab
html = html.replace(/<button onclick="switchTab\('channels'\)".*?<\/button>/g, '');
// Remove mobile tab
html = html.replace(/<button onclick="switchTab\('channels'\)".*?<\/button>/gs, ''); // If multiline, use s flag

// Remove section
const sectionRegex = /<!-- 5\. CHANNELS DIRECTORY VIEW[\s\S]*?<\/section>/;
html = html.replace(sectionRegex, '');

fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
