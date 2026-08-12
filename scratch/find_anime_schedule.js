const fs = require('fs');

const oldHtml = fs.readFileSync('scratch/user_old_version.html', 'utf8');

const startIdx = oldHtml.indexOf('id="animeScheduleSection"');
if (startIdx !== -1) {
    console.log('--- ANIME SCHEDULE HTML BLOCK ---');
    console.log(oldHtml.substring(startIdx - 100, startIdx + 1500));
} else {
    console.log('animeScheduleSection not found, searching for schedule in oldHtml...');
    const match = oldHtml.match(/schedule[\s\S]{0,300}/i);
    console.log(match ? match[0] : 'No schedule string');
}

const jsMatch = oldHtml.match(/function\s+switchAnimeScheduleDay[\s\S]*?}/);
if (jsMatch) {
    console.log('\n--- ANIME SCHEDULE JS FUNCTION ---');
    console.log(jsMatch[0]);
}
