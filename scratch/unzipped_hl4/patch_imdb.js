const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /<!-- IMDb Instant Fetcher Banner -->[\s\S]*?<!-- Top 10 Today Shelf -->/;

const newImdb = `<!-- IMDb Instant Fetcher Banner -->
            <div class="bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden shadow-2xl mx-auto w-full">
                <div class="flex items-center gap-4 w-full md:w-auto">
                    <div class="w-12 h-12 bg-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-400/20">
                        <i data-lucide="film" class="w-6 h-6 text-black"></i>
                    </div>
                    <div>
                        <h3 class="text-sm font-black text-white tracking-widest uppercase">IMDb Direct</h3>
                        <p class="text-xs text-zinc-400 font-medium">Paste link or ID (tt1234567) to stream instantly</p>
                    </div>
                </div>
                
                <div class="w-full md:w-auto flex flex-col sm:flex-row gap-2 relative z-10 flex-1 justify-end">
                    <div class="relative w-full sm:max-w-md">
                        <i data-lucide="search" class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500"></i>
                        <input type="text" id="imdbFetcherInput" placeholder="Paste IMDb link or ID..." class="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-semibold text-white outline-none focus:border-white/30 focus:bg-white/10 placeholder:text-zinc-500 transition-all">
                    </div>
                    <button onclick="fetchIMDbItem()" class="px-8 py-3 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 shrink-0 transform active:scale-95 transition-all">
                        <i data-lucide="play" class="w-4 h-4 fill-black text-black"></i> Play
                    </button>
                </div>
            </div>

            <!-- Top 10 Today Shelf -->`;

html = html.replace(regex, newImdb);
fs.writeFileSync('consumet.html', html);
