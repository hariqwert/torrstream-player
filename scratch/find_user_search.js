const fs = require('fs');
const path = require('path');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.readFileSync(userVersionPath, 'utf8');

function findFnInUser(name) {
    const idx = userHtml.indexOf(name);
    console.log(`\n=== ${name} in user_old_version ===`);
    if (idx !== -1) {
        console.log(userHtml.substring(idx - 20, idx + 1000));
    } else {
        console.log('NOT FOUND');
    }
}

findFnInUser('openSearchPalette');
findFnInUser('executeSearch');
findFnInUser('launchTabSearch');
findFnInUser('openDetails');
findFnInUser('openAnimeInfo');
