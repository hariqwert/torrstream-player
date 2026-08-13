const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');
    
    const targetStart = `                container.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 1) {`;
                    
    const repStart = `                container.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.plyr__controls')) return;
                    if (e.touches.length === 1) {`;

    code = code.replace(targetStart, repStart);
    
    const targetMove = `                container.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 1) {`;
                    
    const repMove = `                container.addEventListener('touchmove', (e) => {
                    if (e.target.closest('.plyr__controls')) return;
                    if (e.touches.length === 1) {`;
                    
    code = code.replace(targetMove, repMove);
    
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
