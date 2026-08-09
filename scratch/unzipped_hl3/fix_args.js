const fs = require('fs');
let code = fs.readFileSync('play_consumet.php', 'utf8');

code = code.replace(/initAdvancedGestures\(player\);/g, 'initAdvancedGestures(player, video);');
code = code.replace(/initAdvancedGestures\(plyrInstance\);/g, 'initAdvancedGestures(player, video);');

fs.writeFileSync('play_consumet.php', code);
