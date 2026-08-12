const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex1 = /function openEpgChannelModal\(channelId, channelName, channelLogo\) \{/;
html = html.replace(regex1, 'function openEpgChannelModal(channelId, channelName, channelLogo, channelUrl) {');

const regex2 = /onclick="openEpgProgramDetails\(\{title: '\$\{prog\.title\.replace\(\/'\/g, "\\\\'"\)\}', start: new Date\('\$\{prog\.start\}'\), end: new Date\('\$\{prog\.end\}'\), desc: '\$\{\(prog\.desc \|\| ""\)\.replace\(\/'\/g, "\\\\'"\)\}', category: '\$\{\(prog\.category \|\| ""\)\.replace\(\/'\/g, "\\\\'"\)\}'\}, '\$\{channelName\.replace\(\/'\/g, "\\\\'"\)\}'\)"/g;

html = html.replace(regex2, `onclick="openEpgProgramDetails({title: '\${prog.title.replace(/'/g, \\\\\\'')}', start: new Date('\${prog.start}'), end: new Date('\${prog.end}'), desc: '\${(prog.desc || "").replace(/'/g, \\\\\\'')}', category: '\${(prog.category || "").replace(/'/g, \\\\\\'')}'}, '\${channelName.replace(/'/g, \\\\\\'')}', (typeof channelUrl !== 'undefined' ? channelUrl : null))"`);

fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
