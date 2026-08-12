const fs = require('fs');

let html = fs.readFileSync('consumet.html', 'utf8');

// 1. Remove Toast Message system
// It has `<div id="toast"` to `</div>`
const toastStartIndex = html.indexOf('<div id="toast"');
if (toastStartIndex !== -1) {
    const toastEndIndex = html.indexOf('</div>', toastStartIndex) + 6;
    html = html.substring(0, toastStartIndex) + html.substring(toastEndIndex);
    console.log("Removed toast HTML");
}

// 2. Remove "timelines" (colored pills) in the Anime section
// Look for `<span class="w-1.5 h-5 bg-... animate-pulse"></span>` near Anime section titles
const pills = [
    '<span class="w-1.5 h-5 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50 animate-pulse"></span>',
    '<span class="w-1.5 h-5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50 animate-pulse"></span>',
    '<span class="w-1.5 h-5 bg-amber-500 rounded-full shadow-lg shadow-emerald-500/50 animate-pulse"></span>', // Sci-fi has emerald shadow?
    '<span class="w-1.5 h-5 bg-violet-500 rounded-full shadow-lg shadow-violet-500/50 animate-pulse"></span>',
    '<span class="w-1.5 h-5 bg-rose-500 rounded-full shadow-lg shadow-rose-500/50 animate-pulse"></span>',
    '<span class="w-1.5 h-5 bg-red-400 rounded-full shadow-lg shadow-red-400/50 animate-pulse"></span>'
];

pills.forEach(pill => {
    while (html.includes(pill)) {
        html = html.replace(pill, '');
        console.log("Removed an anime timeline pill");
    }
});

// Also there might be a blue one for Trending / Latest in Anime? Let's use regex to be safe.
html = html.replace(/<span class="w-1\.5 h-5 bg-[a-z]+-[0-9]+ rounded-full shadow-lg shadow-[a-z]+-[0-9]+\/50 animate-pulse"><\/span>\s*/g, '');

// 3. EPG UI Initialization
// To make sure the redesigned scheduler UI is active and visible by default, 
// let's explicitly call `toggleEpgView('timeline')` inside `renderEpgBoard`.
const renderEpgHook = 'await window.renderNextEpgChunk();';
if (html.includes(renderEpgHook) && !html.includes("toggleEpgView('timeline');")) {
    html = html.replace(renderEpgHook, renderEpgHook + '\n            toggleEpgView(\'timeline\');');
    console.log("Added toggleEpgView to renderEpgBoard");
}

// 4. Just in case EPG timeline view is hidden by something else, let's make sure it's the default
html = html.replace("window.epgCurrentViewMode = 'timeline';", "window.epgCurrentViewMode = 'timeline';");

fs.writeFileSync('consumet.html', html, 'utf8');
console.log("Update complete.");
