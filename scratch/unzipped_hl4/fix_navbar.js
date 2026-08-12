const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// 1. Restore renderAnimeShelf
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
                card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-105 hover:border-indigo-400/50 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10";
                
                card.onclick = () => {
                    openAnimeInfo(item);
                };
                
                card.innerHTML = \`
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                        <img src="\${poster}" alt="\${safeTitle}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                        <div class="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg flex items-center gap-1 text-[10px] font-black text-amber-400">
                            <i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i> \${rating}
                        </div>
                        <div class="absolute bottom-2 left-2 right-2">
                            <div class="bg-indigo-600/90 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest text-white shadow-lg w-max border border-indigo-400/30">\${item.type === 'movie' ? 'MOVIE' : 'TV SHOW'}</div>
                        </div>
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white shadow-2xl transform scale-75 group-hover:scale-100 transition-transform duration-300">
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
        
        async `;

html = html.replace(/async function loadLiveAnimeChannels\(\) \{/, renderAnimeShelfCode + 'function loadLiveAnimeChannels() {');


// 2. Redesign Scheduler (Apple TV style card actually looking like a poster, not avatar)
const renderGridReplacement = `function renderAnimeScheduleGrid(items) {
            const grid = document.getElementById('animeScheduleGrid');
            if (!grid) return;
            grid.innerHTML = '';
            if (!items || items.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-12 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest bg-zinc-900/50 rounded-2xl border border-white/5">No Japanese Broadcasts Scheduled for this Day</div>';
                return;
            }
            
            items.slice(0, 18).forEach(item => {
                const title = item.title || "Untitled Anime";
                const poster = item.poster || item.backdrop || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&h=450&fit=crop';
                const timeStr = item.time || 'Airing Today';
                const rating = item.score || '8.8';
                const studio = item.studio || 'Japan TV';
                const ep = item.episode || 1;
                const safeTitle = title.replace(/'/g, "\\\\\\'").replace(/"/g, '&quot;');
                const card = document.createElement('div');
                
                // Proper Apple TV / Premium Style Poster Card
                card.className = "group relative rounded-3xl overflow-hidden bg-zinc-900/90 border border-white/10 hover:border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between transform hover:-translate-y-1.5 cursor-pointer";
                card.onclick = () => openAnimeInfo(item);
                
                card.innerHTML = \`
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                        <img src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="\${safeTitle}" loading="lazy">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent"></div>
                        
                        <!-- Top Simulcast Pill & Time -->
                        <div class="absolute top-3 inset-x-3 flex justify-between items-start">
                            <div class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border border-white/10 flex items-center gap-1.5 shadow-md">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> SIMULCAST
                            </div>
                            <div class="bg-black/70 backdrop-blur-md text-zinc-300 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border border-white/10 shadow-md">
                                \${timeStr}
                            </div>
                        </div>
                        
                        <!-- Play Hover -->
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 text-white flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                <i data-lucide="play" class="w-6 h-6 fill-white ml-0.5"></i>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Card Body -->
                    <div class="p-4 bg-zinc-950 flex flex-col flex-grow justify-between gap-2 border-t border-white/5">
                        <div class="bg-white/5 border border-white/5 text-zinc-300 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md self-start">
                            Episode \${ep}
                        </div>
                        <div>
                            <h4 class="text-white font-extrabold text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-indigo-400 transition-colors" title="\${safeTitle}">\${title}</h4>
                            <p class="text-[10px] text-zinc-400 font-medium truncate mt-1">\${studio}</p>
                        </div>
                    </div>
                \`;
                grid.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }
`;

html = html.replace(/function renderAnimeScheduleGrid\(items\) \{[\s\S]*?async function loadLiveAnimeChannels\(\) \{/, renderGridReplacement + '\n        async function loadLiveAnimeChannels() {');


// 3. Navbar Redesign
const newNavbar = `<header class="sticky top-0 z-[100] bg-black/80 backdrop-blur-3xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div class="w-full max-w-[1920px] mx-auto px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-8">
            <div class="flex items-center gap-10 min-w-0">
                <!-- Clean Brand Logo -->
                <a href="/hero.html" class="flex items-center gap-3 shrink-0 group">
                    <img src="/stalker_pro_infinity.svg" alt="Stalker Pro" class="h-6 sm:h-7 w-auto object-contain brightness-110 group-hover:brightness-125 transition-all" />
                </a>
            </div>
                
            <!-- Minimalist Navigation Links (Centered) -->
            <nav class="hidden md:flex items-center justify-center gap-6 absolute left-1/2 -translate-x-1/2 h-full">
                <button onclick="switchTab('home')" id="tab-home" class="nav-link active-tab text-[13px] font-bold text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-white indicator shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>Home</button>
                <button onclick="switchTab('movies')" id="tab-movies" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Movies</button>
                <button onclick="switchTab('tv')" id="tab-tv" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>TV Shows</button>
                <button onclick="switchTab('anime')" id="tab-anime" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Anime</button>
                <button onclick="switchTab('sports')" id="tab-sports" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Sports</button>
                <button onclick="switchTab('watchlist')" id="tab-watchlist" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>My List</button>
                <button onclick="switchTab('epg')" id="tab-epg" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"><div class="w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Guide</button>
            </nav>

            <div class="flex items-center gap-4 shrink-0">
                <!-- Search Trigger -->
                <button onclick="switchTab('search')" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all backdrop-blur-md">
                    <i data-lucide="search" class="w-4 h-4"></i>
                </button>
                
                <a href="/login.php" class="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/30 transition-all shadow-lg">
                    <img src="https://ui-avatars.com/api/?name=User&background=18181b&color=fff" alt="Account" class="w-full h-full object-cover">
                </a>
            </div>
        </div>
    </header>

    <!-- Mobile Floating Nav Dock -->`;

html = html.replace(/<header class="sticky top-0 z-\[100\] bg-black\/95 backdrop-blur-3xl border-b border-white\/5 shadow-2xl transition-all duration-300">[\s\S]*?<!-- Mobile Floating Nav Dock -->/, newNavbar);


// Update switchTab JS to handle the new dot indicator (shadow + background)
html = html.replace(/tabBtn\.className = "nav-link active-tab text-\[13px\] font-bold text-white relative py-2 transition-all flex items-center gap-2"; const ind = tabBtn\.querySelector\("\.indicator"\); if \(ind\) \{ ind\.classList\.remove\("bg-transparent"\); ind\.classList\.add\("bg-white"\); \}/g, 
    'tabBtn.className = "nav-link active-tab text-[13px] font-bold text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"; const ind = tabBtn.querySelector(".indicator"); if (ind) { ind.classList.remove("bg-transparent"); ind.classList.add("bg-white", "shadow-[0_0_8px_rgba(255,255,255,0.8)]"); }');
html = html.replace(/tabBtn\.className = "nav-link text-\[13px\] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"; const ind = tabBtn\.querySelector\("\.indicator"\); if \(ind\) \{ ind\.classList\.add\("bg-transparent"\); ind\.classList\.remove\("bg-white"\); \}/g, 
    'tabBtn.className = "nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 px-3 rounded-full hover:bg-white/5 transition-all flex items-center gap-2"; const ind = tabBtn.querySelector(".indicator"); if (ind) { ind.classList.add("bg-transparent"); ind.classList.remove("bg-white", "shadow-[0_0_8px_rgba(255,255,255,0.8)]"); }');

fs.writeFileSync('consumet.html', html, 'utf8');
