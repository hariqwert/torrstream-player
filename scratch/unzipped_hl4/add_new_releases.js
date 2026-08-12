const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Insert HTML shelves
const htmlToAdd = `
            <!-- Hollywood Special Big Design -->
            <div class="space-y-4 pt-4">
                <div class="flex items-center gap-2">
                    <span class="bg-gradient-to-r from-red-600 to-orange-500 w-1.5 h-6 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                    <h2 class="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase drop-shadow-md">Hollywood Premieres</h2>
                </div>
                <div class="scroller-container relative">
                    <button class="scroller-btn scroller-left z-30" onclick="scrollShelf('hollywoodShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                    <div id="hollywoodShelf" class="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2"></div>
                    <button class="scroller-btn scroller-right z-30" onclick="scrollShelf('hollywoodShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>

            <!-- Regional Indian -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6">
                <!-- Tamil -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <span class="bg-gradient-to-r from-purple-500 to-pink-500 w-1 h-5 rounded-full"></span>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Kollywood (Tamil) Hits</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('tamilShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="tamilShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('tamilShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- Malayalam -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <span class="bg-gradient-to-r from-emerald-500 to-teal-500 w-1 h-5 rounded-full"></span>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Mollywood (Malayalam) Hits</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('malayalamShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="malayalamShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('malayalamShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>
            </div>
`;

html = html.replace('<div id="homeTimelinesContainer"', htmlToAdd + '\n            <div id="homeTimelinesContainer"');


// Define JS loaders
const jsLoaders = `
        async function loadHollywoodPremieres() {
            try {
                // Fetch new hollywood movies
                const data = await fetchTMDB('discover/movie', {
                    with_original_language: 'en',
                    'primary_release_date.gte': new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    sort_by: 'popularity.desc',
                    page: 1
                });
                
                const shelf = document.getElementById('hollywoodShelf');
                if(!shelf) return;
                
                shelf.innerHTML = '';
                const items = data.results || [];
                
                items.slice(0, 15).forEach(item => {
                    const fallbackBg = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80';
                    const bg = item.backdrop_path ? \`https://image.tmdb.org/t/p/w780\${item.backdrop_path}\` : fallbackBg;
                    const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : fallbackBg;
                    
                    const card = document.createElement('div');
                    // Special Big Design
                    card.className = "shrink-0 w-80 sm:w-[450px] aspect-[16/9] bg-zinc-950 rounded-3xl overflow-hidden cursor-pointer relative group border border-white/10 hover:border-red-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)]";
                    card.onclick = () => openDetails(item.id, 'movie');
                    
                    card.innerHTML = \`
                        <img src="\${bg}" alt="\${item.title}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                        <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
                        
                        <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
                            <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                            <span class="text-xs font-black text-white">\${item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</span>
                        </div>
                        
                        <div class="absolute bottom-0 left-0 p-6 w-full flex flex-row items-end justify-between">
                            <div class="max-w-[75%]">
                                <span class="bg-red-600/90 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-2 inline-block">New Release</span>
                                <h3 class="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-lg group-hover:text-red-400 transition-colors">\${item.title}</h3>
                                <p class="text-xs text-zinc-400 mt-2 font-medium line-clamp-1">\${item.release_date?.substring(0,4)} • Hollywood</p>
                            </div>
                            
                            <button class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:bg-red-600 hover:text-white shrink-0">
                                <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                            </button>
                        </div>
                    \`;
                    shelf.appendChild(card);
                });
            } catch(e) {}
        }

        async function loadRegionalHits(language, shelfId) {
            try {
                const data = await fetchTMDB('discover/movie', {
                    with_original_language: language,
                    sort_by: 'popularity.desc',
                    'primary_release_date.lte': new Date().toISOString().split('T')[0],
                    page: 1
                });
                if(data && data.results) {
                    renderShelfGrid(data.results, shelfId, 'movie');
                }
            } catch(e) {}
        }
`;

html = html.replace('async function refreshAllData(silent = false) {', jsLoaders + '\n        async function refreshAllData(silent = false) {');

const injectCalls = `
                setTimeout(() => loadAsianDramaAndAnime(), 800);
                setTimeout(() => loadHollywoodPremieres(), 900);
                setTimeout(() => loadRegionalHits('ta', 'tamilShelf'), 1000);
                setTimeout(() => loadRegionalHits('ml', 'malayalamShelf'), 1100);
`;

html = html.replace('setTimeout(() => loadAsianDramaAndAnime(), 800);', injectCalls.trim());

const injectCallsRefresh = `
                loadAsianDramaAndAnime(),
                loadHollywoodPremieres(),
                loadRegionalHits('ta', 'tamilShelf'),
                loadRegionalHits('ml', 'malayalamShelf'),
`;

html = html.replace('loadAsianDramaAndAnime(),', injectCallsRefresh.trim());


fs.writeFileSync('consumet.html', html);
