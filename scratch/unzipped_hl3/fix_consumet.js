const fs = require('fs');
let code = fs.readFileSync('play_consumet.php', 'utf8');

// Replace the whole initAdvancedGestures function in play_consumet.php with the one from play.php.

let playCode = fs.readFileSync('play.php', 'utf8');
let startAdv = playCode.indexOf('            function initAdvancedGestures(player, video) {');
let endAdv = playCode.indexOf('            // --- PC KEYBOARD SHORTCUTS ---');
if (startAdv === -1 || endAdv === -1) {
    console.error('Could not find initAdvancedGestures in play.php');
    process.exit(1);
}
let advancedGesturesFunc = playCode.substring(startAdv, endAdv);

let consStartAdv = code.indexOf('            function initAdvancedGestures(plyrInstance) {');
let consEndAdv = code.indexOf('            // Keyboard Shortcuts');
if (consStartAdv === -1 || consEndAdv === -1) {
    console.error('Could not find initAdvancedGestures in play_consumet.php');
    process.exit(1);
}

// Replace in play_consumet.php
code = code.substring(0, consStartAdv) + advancedGesturesFunc + code.substring(consEndAdv);

// Also remove the duplicate bottom block from BOTH files
function removeBottomBlock(c) {
    let rotateStart = c.indexOf('            // Touch button for rotating');
    if (rotateStart !== -1) {
        let scriptEnd = c.indexOf('</script>', rotateStart);
        if (scriptEnd !== -1) {
            c = c.substring(0, rotateStart) + '\n    ' + c.substring(scriptEnd);
        }
    }
    return c;
}

code = removeBottomBlock(code);
fs.writeFileSync('play_consumet.php', code);

playCode = removeBottomBlock(playCode);
fs.writeFileSync('play.php', playCode);
console.log('done');

