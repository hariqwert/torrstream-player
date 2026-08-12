const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

let pos = 0;
while ((pos = userHtml.indexOf('filterSportsCategory', pos)) !== -1) {
    console.log('Match at pos:', pos);
    console.log(userHtml.substring(pos - 50, pos + 200));
    pos += 20;
}
