const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const html = fs.readFileSync(filePath, 'utf8');

const checks = [
    'id="view-sports"',
    'id="sportsSearch"',
    'id="sportsHomeLayout"',
    'id="sportsHeroSliderContainer"',
    'id="customM3uLauncherCard"',
    'id="customM3uNameInput"',
    'id="customM3uUrlInput"',
    'id="userCustomM3uChips"',
    'id="sportsSavedShelfContainer"',
    'id="sportsLiveEventsShelfContainer"',
    'id="sportsCustomShelfContainer"',
    'id="sportsSkyShelf"',
    'id="sportsFootballShelf"',
    'id="sportsCricketShelf"',
    'id="sportsF1Shelf"',
    'id="sportsUSShelf"',
    'id="sportsSonyShelf"',
    'id="sportsHBOShelf"',
    'id="sports4kShelf"',
    'id="sportsMalayalamNewsShelf"',
    'id="sportsMalayalamEntShelf"',
    'id="sportsMalayalamMoviesShelf"',
    'id="sportsKidsShelf"',
    'id="sportsCatalogLayout"',
    'id="sportsGrid"',
    'function loadSportsChannels()',
    'function renderSportsHome()',
    'function renderSportsSpotlight(',
    'function getSportsLogo(',
    'function filterSportsCategory('
];

let allPassed = true;
checks.forEach(c => {
    const ok = html.includes(c);
    console.log(c, ':', ok ? 'OK' : 'MISSING!');
    if (!ok) allPassed = false;
});

console.log('\nSPORTS INTEGRATION VERIFICATION:', allPassed ? '100% PASSED!' : 'FAILED!');
