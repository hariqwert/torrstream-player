const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

const sportsHtmlMarkup = fs.readFileSync(path.join(__dirname, 'extracted_sports_section.html'), 'utf8');
const sportsJsEngine = fs.readFileSync(path.join(__dirname, 'extracted_sports_engine.js'), 'utf8');

// 1. Replace Sports Section HTML
const sportsSectionStart = html.indexOf('<section id="view-sports"');
const sportsSectionEnd = html.indexOf('</section>', sportsSectionStart) + 10;

if (sportsSectionStart !== -1 && sportsSectionEnd !== -1) {
    html = html.substring(0, sportsSectionStart) + sportsHtmlMarkup + html.substring(sportsSectionEnd);
    console.log('Successfully replaced <section id="view-sports"> HTML');
} else {
    console.error('FAILED to locate <section id="view-sports"> in consumet.html');
}

// 2. Replace Sports JS Engine
const jsStart = html.indexOf('function loadSportsChannels()');
const jsEnd = html.indexOf('function loadAllChannelsDirectory()', jsStart);

if (jsStart !== -1 && jsEnd !== -1) {
    html = html.substring(0, jsStart) + sportsJsEngine + '\n\n' + html.substring(jsEnd);
    console.log('Successfully replaced Sports JS Engine');
} else {
    // Try finding next function boundary
    const altJsEnd = html.indexOf('// 4. CHANNELS DIRECTORY ENGINE', jsStart);
    if (jsStart !== -1 && altJsEnd !== -1) {
        html = html.substring(0, jsStart) + sportsJsEngine + '\n\n' + html.substring(altJsEnd);
        console.log('Successfully replaced Sports JS Engine (alt boundary)');
    } else {
        console.error('FAILED to locate Sports JS boundary in consumet.html');
    }
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with complete 40KB Sports Engine!');
