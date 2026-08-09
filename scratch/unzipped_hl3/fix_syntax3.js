const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /onclick="openEpgProgramDetails\(\{title: '\$\{prog\.title\.replace\(\/'\/g, \\\\\&apos;'\)\}', start: new Date\('\$\{prog\.start\}'\), end: new Date\('\$\{prog\.end\}'\), desc: '\$\{\(prog\.desc \|\| ""\)\.replace\(\/'\/g, \\\\\&apos;'\)\}', category: '\$\{\(prog\.category \|\| ""\)\.replace\(\/'\/g, \\\\\&apos;'\)\}'\}, '\$\{channelName\.replace\(\/'\/g, \\\\\&apos;'\)\}', \(typeof channelUrl !== 'undefined' \? channelUrl : null\)\)"/g;

html = html.replace(regex, `onclick="openEpgProgramDetails({title: '\\${prog.title.replace(/'/g, "\\\\\\'")}', start: new Date('\\${prog.start}'), end: new Date('\\${prog.end}'), desc: '\\${(prog.desc || "").replace(/'/g, "\\\\\\'")}', category: '\\${(prog.category || "").replace(/'/g, "\\\\\\'")}'}, '\\${channelName.replace(/'/g, "\\\\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))"`);

fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
