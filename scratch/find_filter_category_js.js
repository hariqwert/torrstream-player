const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const filterCategoryJsIdx = userHtml.indexOf('function filterSportsCategory');
console.log('function filterSportsCategory index in user_old_version:', filterCategoryJsIdx);
if (filterCategoryJsIdx !== -1) {
    console.log(userHtml.substring(filterCategoryJsIdx, filterCategoryJsIdx + 1500));
}
