const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">[\s\S]*?<div class="flex flex-wrap items-center gap-2\.5 text-\[10px\] font-black uppercase tracking-widest text-slate-300">[\s\S]*?<\/div>[\s\S]*?<h1 class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">\$\{title\}<\/h1>[\s\S]*?<p class="text-sm text-slate-300 leading-relaxed max-w-lg line-clamp-3">\$\{overview\}<\/p>[\s\S]*?<div class="flex flex-wrap items-center gap-3 pt-4">[\s\S]*?<\/div>[\s\S]*?<\/div>/;

const newDesign = `<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">
                    <div class="max-w-4xl">
                        <div class="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/70 mb-4">
                            <span class="bg-indigo-500 text-white px-3 py-1 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]">✨ Anime Spotlight</span>
                            <span class="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5"><i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-400"></i> \${rating}</span>
                            <span class="bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">\${year}</span>
                        </div>
                        <h1 class="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-white leading-[1.1] mb-4 drop-shadow-2xl">\${title}</h1>
                        <p class="text-sm sm:text-base text-zinc-300 leading-relaxed line-clamp-3 mb-8 font-medium max-w-3xl drop-shadow-md">\${overview}</p>
                        <div class="flex flex-wrap items-center gap-3">
                            <button onclick="openDetails('\${item.id}', '\${item.media_type || 'tv'}')" class="px-8 py-3.5 bg-white text-black hover:bg-zinc-200 text-xs font-black tracking-widest uppercase rounded-2xl shadow-xl flex items-center gap-2 transform active:scale-95 transition-all"><i data-lucide="play" class="w-4 h-4 fill-black"></i> Play Anime</button>
                            \${trailerBtnHtml}
                        </div>
                    </div>
                </div>`;

html = html.replace(regex, newDesign);
fs.writeFileSync('consumet.html', html);
