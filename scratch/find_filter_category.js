const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

const filterCategoryIdx = userHtml.indexOf('filterSportsCategory');
console.log('filterSportsCategory index in user_old_version:', filterCategoryIdx);
if (filterCategoryIdx !== -1) {
    console.log(userHtml.substring(filterCategoryIdx - 100, filterCategoryIdx + 1500));
}
