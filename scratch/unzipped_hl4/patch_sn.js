const fs = require('fs');
let code = fs.readFileSync('src/routes/torrent.ts', 'utf8');

code = code.replace(
  /'-avoid_negative_ts', 'make_zero',/g,
  "'-sn', '-dn',\n        '-avoid_negative_ts', 'make_zero',"
);

fs.writeFileSync('src/routes/torrent.ts', code);
console.log("Patched FFmpeg with -sn -dn!");
