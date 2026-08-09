const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const regex = /function formatBytes[\s\S]*$/;
const replacement = `function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}`;

code = code.replace(regex, replacement);
fs.writeFileSync('public/torrent.js', code);
console.log("Fixed end of torrent.js");
