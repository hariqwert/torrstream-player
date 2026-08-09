const fs = require('fs');
let code = fs.readFileSync('play_consumet.php', 'utf8');

code = code.replace(/if \(Hls\.isSupported\(\) && !isTs\) \{/g, 'if (Hls.isSupported()) {');
fs.writeFileSync('play_consumet.php', code);

code = fs.readFileSync('play.php', 'utf8');
code = code.replace(/if \(Hls\.isSupported\(\) && !isTs\) \{/g, 'if (Hls.isSupported()) {');
fs.writeFileSync('play.php', code);
