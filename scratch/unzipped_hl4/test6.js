const prog = { title: "Let's play", start: "S", end: "E", desc: "", category: "" };
const channelName = "C";
const channelUrl = "U";
const str = `<div class="bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:bg-zinc-900 transition-colors cursor-pointer mb-2" onclick="openEpgProgramDetails({title: '${prog.title.replace(/\'/g, "\\\'")}', start: new Date('${prog.start}'), end: new Date('${prog.end}'), desc: '${(prog.desc || "").replace(/\'/g, "\\\'")}', category: '${(prog.category || "").replace(/\'/g, "\\\'")}'}, '${channelName.replace(/\'/g, "\\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))">`;
console.log(str);
