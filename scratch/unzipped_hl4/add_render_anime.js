const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const renderAnimeShelfCode = `
        function renderAnimeShelf(items, shelfId, typeOverride = null) {
            const shelf = document.getElementById(shelfId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            if (!items || items.length === 0) {
                const catKey = (shelfId || '').replace(/^anime/i, '').replace(/Shelf$/i, '').toLowerCase();
                items = (window.ANIME_CURATED_FALLBACKS && window.ANIME_CURATED_FALLBACKS[catKey]) ? window.ANIME_CURATED_FALLBACKS[catKey] : ((window.ANIME_CURATED_FALLBACKS && window.ANIME_CURATED_FALLBACKS['trending']) ? window.ANIME_CURATED_FALLBACKS['trending'] : []);
            }
            if (!items || items.length === 0) return;
            
            items.slice(0, 15).forEach(item => {
                const title = item.title_english || item.title || item.name || "Untitled Anime";
                let poster = item.poster;
                if (!poster && item.images?.jpg?.large_image_url) poster = item.images.jpg.large_image_url;
                if (!poster && item.images?.jpg?.image_url) poster = item.images.jpg.image_url;
                if (!poster && item.poster_path) poster = \`https://image.tmdb.org/t/p/w300\${item.poster_path}\`;
                if (!poster) poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
                
                const rating = item.score ? (typeof item.score === 'number' ? item.score.toFixed(1) : parseFloat(item.score).toFixed(1)) : (item.vote_average ? (typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : parseFloat(item.vote_average).toFixed(1)) : '8.5');
                const year = item.year || (item.first_air_date || item.release_date || '').split('-')[0] || '2024';
                const finalType = typeOverride || (item.first_air_date ? 'tv' : 'movie');
                const safeTitle = title.replace(/'/g, "\\\\\\'").replace(/"/g, '&quot;');

                const card = document.createElement('div');
                card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-105 hover:border-indigo-400/50 relative flex flex-col group";
                
                card.onclick = () => {
                    openAnimeInfo(item);
                };
                
                card.innerHTML = \`
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                        <img src="\${poster}" alt="\${safeTitle}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                        <div class="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 text-[10px] font-black text-amber-400">
                            <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i> \${rating}
                        </div>
                        <div class="absolute bottom-2 left-2 right-2">
                            <div class="bg-indigo-600/90 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-white w-max border border-indigo-400/30">\${item.type === 'movie' ? 'MOVIE' : 'TV SHOW'}</div>
                        </div>
                        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-12 h-12 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                <i data-lucide="play" class="w-5 h-5 ml-0.5 fill-white"></i>
                            </div>
                        </div>
                    </div>
                    <div class="p-3.5 bg-zinc-950 flex flex-col flex-grow justify-between border-t border-white/5 relative z-10">
                        <div>
                            <h3 class="text-xs sm:text-sm font-black text-white line-clamp-1 group-hover:text-indigo-400 transition-colors" title="\${safeTitle}">\${title}</h3>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">\${year}</span>
                                <span class="text-zinc-600 text-[10px]">•</span>
                                <span class="text-[10px] text-zinc-400 font-bold truncate">\${item.studio || 'Anime Studio'}</span>
                            </div>
                        </div>
                    </div>
                \`;
                shelf.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }
`;

if (!html.includes('function renderAnimeShelf(')) {
    html = html.replace('async function loadLiveAnimeChannels() {', renderAnimeShelfCode + '\n        async function loadLiveAnimeChannels() {');
}

fs.writeFileSync('consumet.html', html, 'utf8');
