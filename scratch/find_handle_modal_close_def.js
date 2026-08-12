const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const pos = userHtml.indexOf('function handleModalClose');
console.log('function handleModalClose pos in user_old_version:', pos);
if (pos !== -1) {
    console.log(userHtml.substring(pos, pos + 500));
}
