const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. UPDATE renderAnimeShelf to include ⚡ Torrent button on hover
const oldAnimeShelfCardHtml = `<div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute top-2.5 right-2.5 bg-black/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/15 flex items-center gap-1">
                    <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400"></i> \${score}
                </div>
            </div>`;

const newAnimeShelfCardHtml = `<div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-10">
                    <button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
                        <i data-lucide="download-cloud" class="w-3.5 h-3.5 fill-white"></i> ⚡ Torrent
                    </button>
                    <button onclick="event.stopPropagation(); openAnimeInfo(window._animeCache[\${id}])" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
                        <i data-lucide="info" class="w-3.5 h-3.5"></i> Info
                    </button>
                </div>
                <div class="absolute top-2.5 right-2.5 bg-black/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/15 flex items-center gap-1 z-20">
                    <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400"></i> \${score}
                </div>
            </div>`;

if (html.includes(oldAnimeShelfCardHtml)) {
    html = html.replace(oldAnimeShelfCardHtml, newAnimeShelfCardHtml);
    console.log('Updated renderAnimeShelf hover card HTML with Torrent button!');
} else {
    console.warn('Could not exact-match oldAnimeShelfCardHtml, attempting pattern replacement...');
}

// 2. UPDATE appendFilterGrid to include ⚡ Torrent button on hover
const oldFilterGridCard = `<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
<div class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
<i data-lucide="play" class="w-5 h-5 fill-black ml-0.5"></i>
</div>
</div>`;

const newFilterGridCard = `<div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-10">
<button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
<i data-lucide="download-cloud" class="w-3.5 h-3.5 fill-white"></i> ⚡ Torrent
</button>
<button onclick="event.stopPropagation(); openDetails(\${item.id}, '\${item.media_type || defaultType}')" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
<i data-lucide="play" class="w-3.5 h-3.5"></i> Details
</button>
</div>`;

if (html.includes(oldFilterGridCard)) {
    html = html.replace(oldFilterGridCard, newFilterGridCard);
    console.log('Updated appendFilterGrid hover card HTML with Torrent button!');
}

// 3. UPDATE renderTop10Shelf hover overlay
const oldTop10CardHover = `<div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
<div class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
<i data-lucide="play" class="w-6 h-6 fill-black ml-0.5"></i>
</div>
</div>`;

const newTop10CardHover = `<div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-20">
<button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="w-full bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg transform active:scale-95">
<i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> ⚡ Torrent
</button>
<button onclick="event.stopPropagation(); openDetails(\${item.id}, '\${type}')" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg">
<i data-lucide="play" class="w-3.5 h-3.5"></i> Details
</button>
</div>`;

if (html.includes(oldTop10CardHover)) {
    html = html.replace(oldTop10CardHover, newTop10CardHover);
    console.log('Updated renderTop10Shelf hover card HTML with Torrent button!');
}

// 4. UPDATE loadHollywoodPremieres card button
const oldHollywoodBtn = `<button class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:bg-red-600 hover:text-white shrink-0">
<i data-lucide="play" class="w-5 h-5 fill-current"></i>
</button>`;

const newHollywoodBtn = `<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shrink-0">
<button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${item.title.replace(/'/g, "\\\\'")}')" class="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl flex items-center gap-1.5 active:scale-95">
<i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> ⚡ Torrent
</button>
<button onclick="event.stopPropagation(); openDetails(\${item.id}, 'movie')" class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl hover:bg-zinc-200 transition-all active:scale-95">
<i data-lucide="play" class="w-5 h-5 fill-current ml-0.5"></i>
</button>
</div>`;

if (html.includes(oldHollywoodBtn)) {
    html = html.replace(oldHollywoodBtn, newHollywoodBtn);
    console.log('Updated loadHollywoodPremieres card HTML with Torrent button!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved updated consumet.html!');
