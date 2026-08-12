const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /onclick="openEpgProgramDetails\(\{title:[^\"]+\)"/g;

let count = 0;
html = html.replace(regex, (m) => {
    count++;
    return `onclick="openEpgProgramDetails({title: '\${prog.title.replace(/'/g, "\\\\'")}', start: new Date('\${prog.start}'), end: new Date('\${prog.end}'), desc: '\${(prog.desc || "").replace(/'/g, "\\\\'")}', category: '\${(prog.category || "").replace(/'/g, "\\\\'")}'}, '\${channelName.replace(/'/g, "\\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))"`;
});

console.log("Matched:", count);
fs.writeFileSync('consumet.html', html, 'utf8');
