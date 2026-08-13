const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Reverse the global replacements made by patch_timeline.js
html = html.replace(/text-emerald-400/g, 'text-amber-400');
html = html.replace(/border-emerald-500/g, 'border-amber-500');
html = html.replace(/bg-emerald-600/g, 'bg-amber-600');
html = html.replace(/bg-emerald-500/g, 'bg-amber-500');

// But keep emerald in view-sports!
// So let's extract view-sports
let idxSports = html.indexOf('<section id="view-sports"');
let endSports = html.indexOf('<!-- 5. WATCHLIST VIEW -->', idxSports);
if (idxSports > -1 && endSports > -1) {
    let block = html.substring(idxSports, endSports);
    block = block.replace(/text-amber-400/g, 'text-emerald-400');
    block = block.replace(/border-amber-500/g, 'border-emerald-500');
    block = block.replace(/bg-amber-600/g, 'bg-emerald-600');
    block = block.replace(/bg-amber-500/g, 'bg-emerald-500');
    html = html.substring(0, idxSports) + block + html.substring(endSports);
}

// Now specifically target the timeline Javascript template string
// We'll search for the timeline block creation in javascript.
let idxScript = html.indexOf('const card = document.createElement(\'div\');');
let endScript = html.indexOf('tRow.appendChild(card);', idxScript);
if (idxScript > -1 && endScript > -1) {
    let block = html.substring(idxScript, endScript);
    // Replace amber with emerald inside the script for timeline
    block = block.replace(/bg-zinc-800\/90 hover:bg-emerald-500\/20 hover:border-emerald-400 border border-white\/10/g, 'bg-[#18181b]/90 hover:bg-emerald-500/20 hover:border-emerald-500 border border-white/10');
    block = block.replace(/text-amber/g, 'text-emerald');
    block = block.replace(/border-amber/g, 'border-emerald');
    block = block.replace(/bg-amber/g, 'bg-emerald');
    html = html.substring(0, idxScript) + block + html.substring(endScript);
}

fs.writeFileSync('consumet.html', html);
