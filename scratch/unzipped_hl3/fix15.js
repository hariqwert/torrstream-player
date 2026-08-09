const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onclick="openEpgProgramDetails({title:')) {
        count++;
        lines[i] = `                                <div class="bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:bg-zinc-900 transition-colors cursor-pointer mb-2" onclick="openEpgProgramDetails({title: '\${prog.title.replace(/'/g, "\\\\'")}', start: new Date('\${prog.start}'), end: new Date('\${prog.end}'), desc: '\${(prog.desc || "").replace(/'/g, "\\\\'")}', category: '\${(prog.category || "").replace(/'/g, "\\\\'")}'}, '\${channelName.replace(/'/g, "\\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))">`;
    }
}

console.log("Matched:", count);
fs.writeFileSync('consumet.html', lines.join('\n'), 'utf8');
