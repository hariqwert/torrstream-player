const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const sportsJsStart = userHtml.indexOf('// 3. SPORTS CHANNELS ENGINE');
const sportsJsEnd = userHtml.indexOf('// 4. DETAIL PANEL ENGINE (MODAL)', sportsJsStart);

console.log('Sports JS Start:', sportsJsStart, 'End:', sportsJsEnd);
if (sportsJsStart !== -1 && sportsJsEnd !== -1) {
    const sportsJs = userHtml.substring(sportsJsStart, sportsJsEnd);
    console.log('Extracted Sports JS length:', sportsJs.length);
    fs.writeFileSync(path.join(__dirname, 'extracted_sports_engine.js'), sportsJs, 'utf8');
}
