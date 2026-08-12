const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

let pos = 0;
while ((pos = html.indexOf('handleModalClose', pos)) !== -1) {
    console.log('Match at pos:', pos);
    console.log(html.substring(pos - 50, pos + 150));
    pos += 16;
}
