const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const sportsSectionStart = userHtml.indexOf('<section id="view-sports"');
const sportsSectionEnd = userHtml.indexOf('</section>', sportsSectionStart) + 10;

console.log('Sports Section Start:', sportsSectionStart, 'End:', sportsSectionEnd);
if (sportsSectionStart !== -1 && sportsSectionEnd !== -1) {
    const sportsSectionMarkup = userHtml.substring(sportsSectionStart, sportsSectionEnd);
    console.log('Extracted Sports Section HTML length:', sportsSectionMarkup.length);
    fs.writeFileSync(path.join(__dirname, 'extracted_sports_section.html'), sportsSectionMarkup, 'utf8');
}
