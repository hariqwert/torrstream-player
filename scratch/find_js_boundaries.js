const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const sportsIdx = html.indexOf('loadSportsChannels');
console.log('loadSportsChannels index:', sportsIdx);
if (sportsIdx !== -1) {
    console.log('Snippet around loadSportsChannels:\n', html.substring(sportsIdx - 100, sportsIdx + 500));
}
