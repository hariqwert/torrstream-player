const prog = { title: "Let's play" };
const str1 = `<div onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\'")}'})">`;
const str2 = `<div onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\\\'")}'})">`;
const str3 = `<div onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\\\\\'")}'})">`;
console.log("1:", str1);
console.log("2:", str2);
console.log("3:", str3);
