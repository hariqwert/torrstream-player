const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const matches = html.match(/function\s+\w*Spotlight\w*/g);
console.log('Spotlight functions found:', matches);

const matchesAsync = html.match(/async\s+function\s+\w*Spotlight\w*/g);
console.log('Async Spotlight functions found:', matchesAsync);

// Also search user_old_version.html for loadHomeSpotlight or spotlight function names
const userVersionPath = path.join(__dirname, 'user_old_version.html');
if (fs.existsSync(userVersionPath)) {
    const userHtml = fs.readFileSync(userVersionPath, 'utf8');
    console.log('user_old_version Spotlight functions:', userHtml.match(/function\s+\w*Spotlight\w*/g));
}
