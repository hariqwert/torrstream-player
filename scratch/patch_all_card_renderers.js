const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. appendFilterGrid Hover Overlay Replacement
const filterHoverTarget = `<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 md:group-hover:scale-100 transition-transform duration-300">
                        <i data-lucide="play" class="w-5.5 h-5.5 fill-black ml-0.5"></i>
                    </div>
                </div>`;

const filterHoverReplacement = `<div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-10">
                    <button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95">
                        <i data-lucide="download-cloud" class="w-3.5 h-3.5 fill-white"></i> ⚡ Torrent
                    </button>
                    <button onclick="event.stopPropagation(); openDetails(\${item.id}, '\${type}')" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i> Details
                    </button>
                </div>`;

if (html.includes(filterHoverTarget)) {
    html = html.replace(filterHoverTarget, filterHoverReplacement);
    console.log('SUCCESS: Patched appendFilterGrid hover overlay with Torrent button!');
} else {
    console.error('FAILED: filterHoverTarget not found!');
}

// 2. renderTop10Shelf Hover Overlay Replacement
const top10HoverTarget = `<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                    <div class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <i data-lucide="play" class="w-6 h-6 fill-black ml-0.5"></i>
                    </div>
                </div>`;

const top10HoverReplacement = `<div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-20">
                    <button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95">
                        <i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> ⚡ Torrent
                    </button>
                    <button onclick="event.stopPropagation(); openDetails(\${item.id}, '\${type}')" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg">
                        <i data-lucide="play" class="w-3.5 h-3.5"></i> Details
                    </button>
                </div>`;

if (html.includes(top10HoverTarget)) {
    html = html.replace(top10HoverTarget, top10HoverReplacement);
    console.log('SUCCESS: Patched renderTop10Shelf hover overlay with Torrent button!');
} else {
    console.error('FAILED: top10HoverTarget not found!');
}

// 3. loadHollywoodPremieres Hover Replacement
const hollywoodTarget = `<button class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:bg-red-600 hover:text-white shrink-0">
                    <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                </button>`;

const hollywoodReplacement = `<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shrink-0">
                    <button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${item.title.replace(/'/g, "\\\\'")}')" class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-1.5 active:scale-95">
                        <i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> ⚡ Torrent
                    </button>
                    <button onclick="event.stopPropagation(); openDetails(\${item.id}, 'movie')" class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:bg-zinc-200 transition-all active:scale-95">
                        <i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
                    </button>
                </div>`;

if (html.includes(hollywoodTarget)) {
    html = html.replace(hollywoodTarget, hollywoodReplacement);
    console.log('SUCCESS: Patched loadHollywoodPremieres card button with Torrent button!');
} else {
    console.error('FAILED: hollywoodTarget not found!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with all Torrent buttons added!');
