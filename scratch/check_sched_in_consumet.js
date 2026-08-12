const fs = require('fs');

const code = fs.readFileSync('consumet.html', 'utf8');

console.log('animeScheduleSection in current consumet.html:', code.includes('id="animeScheduleSection"'));
console.log('animeScheduleGrid in current consumet.html:', code.includes('id="animeScheduleGrid"'));
console.log('switchAnimeScheduleDay in current consumet.html:', code.includes('switchAnimeScheduleDay'));
