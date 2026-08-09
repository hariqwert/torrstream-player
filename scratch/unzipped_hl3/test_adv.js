const fs = require('fs');
let playCode = fs.readFileSync('play.php', 'utf8');
let startAdv = playCode.indexOf('            function initAdvancedGestures(player, video) {');
let endAdv = playCode.indexOf('            // --- PC KEYBOARD SHORTCUTS ---');
console.log(playCode.substring(startAdv, endAdv));
