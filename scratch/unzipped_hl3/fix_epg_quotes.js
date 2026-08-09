const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// The problematic line is in `renderNextEpgChunk` inside `consumet.html`
// We want it to just be: replace(/'/g, "\\'")

// Let's find it.
const regex = /onclick="openEpgProgramDetails\(\{title:[^\"]+\)"/g;

html = html.replace(regex, 'onclick="openEpgProgramDetails({title: \\\'${prog.title.replace(/\\\'/g, \\\\\\"\\\\\\\'\\\\\\")}\\\', start: new Date(\\\'${prog.start}\\\'), end: new Date(\\\'${prog.end}\\\'), desc: \\\'${(prog.desc || \\"\\").replace(/\\\'/g, \\\\\\"\\\\\\\'\\\\\\")}\\\', category: \\\'${(prog.category || \\"\\").replace(/\\\'/g, \\\\\\"\\\\\\\'\\\\\\")}\\\'}, \\\'${channelName.replace(/\\\'/g, \\\\\\"\\\\\\\'\\\\\\")}\\\', (typeof channelUrl !== \\\'undefined\\\' ? channelUrl : null))"');

// Actually wait, let's just write exactly the string we want.
const correctString = 'onclick="openEpgProgramDetails({title: \\\'${prog.title.replace(/\\\'/g, "\\\\\\\'")}\\\', start: new Date(\\\'${prog.start}\\\'), end: new Date(\\\'${prog.end}\\\'), desc: \\\'${(prog.desc || "").replace(/\\\'/g, "\\\\\\\'")}\\\', category: \\\'${(prog.category || "").replace(/\\\'/g, "\\\\\\\'")}\\\'}, \\\'${channelName.replace(/\\\'/g, "\\\\\\\'")}\\\', (typeof channelUrl !== \\\'undefined\\\' ? channelUrl : null))"';

html = html.replace(regex, correctString);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log("done");
