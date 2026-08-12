const fs = require('fs');
const path = require('path');

const userHtml = fs.readFileSync(path.join(__dirname, 'user_old_version.html'), 'utf8');

const sectionMatches = userHtml.match(/id="view-[a-zA-Z0-9_-]+"/g) || [];
console.log('All view section IDs in user_old_version.html:');
console.log(sectionMatches);

const modalMatches = userHtml.match(/id="[a-zA-Z0-9_-]*Modal[a-zA-Z0-9_-]*"/g) || [];
console.log('\nAll Modal IDs in user_old_version.html:');
console.log(modalMatches);
