const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

if (!code.includes('window.addEventListener("error", function (e) {')) {
    code += `\nwindow.addEventListener("error", function (e) {
    if (e.message === undefined && e.error === undefined && e.isTrusted !== undefined) {
        // This is a DOM element error (e.g., <track>, <video>, <img> failing to load)
        // Prevent it from bubbling up to AI Studio's global error capturer
        e.preventDefault();
        console.warn('Caught unhandled DOM element error:', e);
    }
}, true);\n`;
    fs.writeFileSync('public/torrent.js', code);
    console.log("Patched window error!");
}
