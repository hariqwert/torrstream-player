const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const userVersionPath = path.join(__dirname, 'user_old_version.html');
const userHtml = fs.existsSync(userVersionPath) ? fs.readFileSync(userVersionPath, 'utf8') : '';

console.log('openAnimeInfo calls in consumet.html:', (html.match(/openAnimeInfo/g) || []).length);
console.log('launchTabSearch calls in consumet.html:', (html.match(/launchTabSearch/g) || []).length);

const openAnimeIdxInUser = userHtml.indexOf('openAnimeInfo');
if (openAnimeIdxInUser !== -1) {
    console.log('\n--- openAnimeInfo in user_old_version ---');
    console.log(userHtml.substring(openAnimeIdxInUser, openAnimeIdxInUser + 800));
}

const launchTabIdxInUser = userHtml.indexOf('launchTabSearch');
if (launchTabIdxInUser !== -1) {
    console.log('\n--- launchTabSearch in user_old_version ---');
    console.log(userHtml.substring(launchTabIdxInUser, launchTabIdxInUser + 800));
}
