const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

let startIndex = code.indexOf('// --- MOBILE GESTURES ---');
let endIndex = code.indexOf('// --- PC KEYBOARD SHORTCUTS ---');
let gestureBlock = code.substring(startIndex, endIndex);
fs.writeFileSync('gesture_block.js', gestureBlock);
