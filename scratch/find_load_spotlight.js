const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

let pos = 0;
while ((pos = html.indexOf('loadHomeSpotlight', pos)) !== -1) {
    console.log('Match at pos:', pos);
    console.log(html.substring(pos - 40, pos + 120));
    pos += 17;
}
