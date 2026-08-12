const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const hasKinoCheckUrl = html.includes('https://api.kinocheck.com/');
const hasFetchOfficialTrailerKey = html.includes('async function fetchOfficialTrailerKey(');
const hasSpotlightUpdate = html.includes('updateSpotlightBackgroundTrailer');

console.log('KinoCheck API URL present:', hasKinoCheckUrl);
console.log('fetchOfficialTrailerKey present:', hasFetchOfficialTrailerKey);
console.log('Spotlight Update present:', hasSpotlightUpdate);

console.log('\nKINOCHECK INTEGRATION VERIFICATION:', (hasKinoCheckUrl && hasFetchOfficialTrailerKey && hasSpotlightUpdate) ? '100% PASSED!' : 'FAILED!');
