const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /onclick="openEpgProgramDetails\(\{title:[^\"]+\)"/g;

// I will escape the dollar signs so it doesn't interpolate in node.
const replacement = String.raw`onclick="openEpgProgramDetails({title: '\${prog.title.replace(/'/g, "\\\\'")}', start: new Date('\${prog.start}'), end: new Date('\${prog.end}'), desc: '\${(prog.desc || "").replace(/'/g, "\\\\'")}', category: '\${(prog.category || "").replace(/'/g, "\\\\'")}'}, '\${channelName.replace(/'/g, "\\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))"`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log("done");
