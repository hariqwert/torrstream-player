const str = `onclick="foo({title: '${"Don't".replace(/'/g, "\\\\'")}'})"`;
console.log(str);
