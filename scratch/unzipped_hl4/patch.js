const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

code = code.replace(
    /video\.addEventListener\('playing', \(\) => {/g,
    `document.addEventListener('playing', (e) => {
                if (e.target && e.target.tagName !== 'VIDEO') return;`
);

code = code.replace(
    /document\.addEventListener\('click', function\(\) {/g,
    `document.addEventListener('click', function(e) {
            if (e.target && e.target.closest && (e.target.closest('.plyr__controls') || e.target.closest('.plyr__video-wrapper'))) return;`
);

fs.writeFileSync('play.php', code);
console.log("Patched!");
