const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const targetStr = 'onclick="openEpgProgramDetails({title: \\\'${prog.title.replace(/\\\'/g, "\\\\\\'")}\\\', start: new Date(\\\'${prog.start}\\\'), end: new Date(\\\'${prog.end}\\\'), desc: \\\'${(prog.desc || "").replace(/\\\'/g, "\\\\\\'")}\\\', category: \\\'${(prog.category || "").replace(/\\\'/g, "\\\\\\'")}\\\'}, \\\'${channelName.replace(/\\\'/g, "\\\\\\'")}\\\', (typeof channelUrl !== \\\'undefined\\\' ? channelUrl : null))"';
// wait, I don't know what is currently there. I will just use regex to FIND the block.
const regex = /onclick="openEpgProgramDetails\(\{title:[^\"]+\)"/g;
// I want to replace it with EXACTLY the string in test4.js.
const desired = `onclick="openEpgProgramDetails({title: '\${prog.title.replace(/'/g, "\\\\'")}', start: new Date('\${prog.start}'), end: new Date('\${prog.end}'), desc: '\${(prog.desc || "").replace(/'/g, "\\\\'")}', category: '\${(prog.category || "").replace(/'/g, "\\\\'")}'}, '\${channelName.replace(/'/g, "\\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))"`;

// string.replace with a function prevents any special pattern ($1, \', etc) from being evaluated.
html = html.replace(regex, () => desired);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log("done");
