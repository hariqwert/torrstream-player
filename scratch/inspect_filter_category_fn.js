const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const pos = 180081 + 1800;
console.log(userHtml.substring(pos, pos + 2500));
