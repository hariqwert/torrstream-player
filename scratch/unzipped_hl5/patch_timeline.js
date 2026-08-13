const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Change timeline colors to emerald
html = html.replace(/bg-zinc-800\/90 hover:bg-amber-500\/20 hover:border-amber-400/g, 'bg-[#18181b]/90 hover:bg-emerald-500/20 hover:border-emerald-500');
html = html.replace(/text-amber-500/g, 'text-emerald-400');
html = html.replace(/text-amber-400/g, 'text-emerald-400');
html = html.replace(/border-amber-500/g, 'border-emerald-500');
html = html.replace(/bg-amber-600/g, 'bg-emerald-600');
html = html.replace(/bg-amber-500/g, 'bg-emerald-500');

// Fix epg selected day colors in renderEpgBoard
html = html.replace(/bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600\/15/g, 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/15');

fs.writeFileSync('consumet.html', html);
