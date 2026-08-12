const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

let pos = 0;
while ((pos = html.indexOf('openDetails', pos)) !== -1) {
    console.log('openDetails at pos:', pos);
    console.log(html.substring(pos - 30, pos + 100));
    pos += 11;
}
