const prog = { title: "Let's play", start: "S", end: "E", desc: "", category: "" };
const channelName = "Sky Sports";
const channelUrl = "url";
const str = `<div onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\\\'")}'})">`;
console.log(str);
