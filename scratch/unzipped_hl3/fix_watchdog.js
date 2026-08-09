const fs = require('fs');

function fixWatchdog(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/if \(stalledTime > 12000\) \{/g, 'if (stalledTime > 45000) {');
    
    // Also change timeStalled in play.php to 45000 for good measure
    code = code.replace(/if \(timeStalled > 30000\) \{/g, 'if (timeStalled > 45000) {');

    fs.writeFileSync(file, code);
}
fixWatchdog('play.php');
fixWatchdog('play_consumet.php');
