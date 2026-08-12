const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const sportsIdx = html.indexOf('function loadSportsChannels');
if (sportsIdx !== -1) {
    console.log(html.substring(sportsIdx, sportsIdx + 2000));
} else {
    console.log('loadSportsChannels NOT FOUND!');
}
