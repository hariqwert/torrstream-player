const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const newHomeContent = `                <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">
                    <div class="bg-black/40 backdrop-blur-3xl border border-white/10 p-6 sm:p-8 rounded-[32px] max-w-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
                        <div class="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/70 mb-4">
                            <span class="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full">⭐ Spotlight</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i> \${rating}</span>
                            <span>\${year}</span>
                            <span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span>\${type}</span>
                        </div>
                        <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-white leading-[1.1] mb-4">\${title}</h1>
                        <p class="text-sm text-zinc-300 leading-relaxed line-clamp-3 mb-6 font-medium">\${overview}</p>
                        <div class="flex flex-wrap items-center gap-3">
                            <button onclick="openDetails('\${item.id}', '\${item.media_type || 'movie'}')" class="px-8 py-3.5 bg-white text-black hover:bg-zinc-200 text-xs font-black tracking-widest uppercase rounded-2xl shadow-xl flex items-center gap-2 transform active:scale-95 transition-all"><i data-lucide="play" class="w-4 h-4 fill-black"></i> Watch Now</button>
                            \${trailerBtnHtml}
                        </div>
                    </div>
                </div>`;

const newAnimeContent = `                <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">
                    <div class="bg-black/40 backdrop-blur-3xl border border-red-500/20 p-6 sm:p-8 rounded-[32px] max-w-2xl shadow-[0_30px_60px_-15px_rgba(239,68,68,0.2)]">
                        <div class="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/70 mb-4">
                            <span class="bg-red-500/20 text-red-300 border border-red-500/30 px-3 py-1 rounded-full">🌸 Anime Arena</span>
                            <span class="flex items-center gap-1.5"><i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400"></i> \${rating}</span>
                            <span>\${year}</span>
                            <span class="w-1.5 h-1.5 rounded-full bg-white/20"></span>
                            <span>\${type}</span>
                        </div>
                        <h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-white leading-[1.1] mb-4">\${title}</h1>
                        <p class="text-sm text-zinc-300 leading-relaxed line-clamp-3 mb-6 font-medium">\${overview}</p>
                        <div class="flex flex-wrap items-center gap-3">
                            <button onclick="openDetails('\${item.id}', '\${item.media_type || 'tv'}')" class="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-red-600/30 flex items-center gap-2 transform active:scale-95 transition-all"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Anime</button>
                            \${trailerBtnHtml}
                        </div>
                    </div>
                </div>`;

const regexHome = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">([\s\S]*?)<\/div>\n                <\/div>\n            `;/;
const regexAnime = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">([\s\S]*?)<\/div>\n                <\/div>\n            `;/;

// We need to be careful with replace since both have identical start wrappers. Let's do string index matching.
let idx1 = html.indexOf('function renderSpotlightSlide(index) {');
let end1 = html.indexOf('lucide.createIcons();', idx1);

let block1 = html.substring(idx1, end1);
block1 = block1.replace(/<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">[\s\S]*?<\/div>\n                <\/div>/, newHomeContent);
html = html.substring(0, idx1) + block1 + html.substring(end1);

let idx2 = html.indexOf('function renderAnimeSpotlightSlide(index) {');
let end2 = html.indexOf('lucide.createIcons();', idx2);

let block2 = html.substring(idx2, end2);
block2 = block2.replace(/<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">[\s\S]*?<\/div>\n                <\/div>/, newAnimeContent);
html = html.substring(0, idx2) + block2 + html.substring(end2);

fs.writeFileSync('consumet.html', html);
