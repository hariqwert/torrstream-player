const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// 1. Remove renderTimelines implementation
html = html.replace(/async function renderTimelines[^\{]+\{/, 'async function renderTimelines(containerId, timelinesArray) { return;');
console.log("Disabled renderTimelines");

// Remove animeTimelinesContainer from HTML
html = html.replace(/<!-- Anime Timelines.*?<\/div>\s*<\/div>\s*<\/div>/s, '');


// 2. Fix score .toFixed() issue globally
html = html.replace(/item\.score\s*\?\s*item\.score\.toFixed\(1\)/g, "item.score ? (typeof item.score === 'number' ? item.score.toFixed(1) : parseFloat(item.score).toFixed(1))");
html = html.replace(/item\.vote_average\s*\?\s*item\.vote_average\.toFixed\(1\)/g, "item.vote_average ? (typeof item.vote_average === 'number' ? item.vote_average.toFixed(1) : parseFloat(item.vote_average).toFixed(1))");
console.log("Fixed toFixed()");

// 3. Navbar header design completely changed to black minimalist
html = html.replace(/<header class="sticky top-0 z-\[100\] bg-zinc-950\/90 backdrop-blur-xl border-b border-white\/10 shadow-xl transition-all duration-300">[\s\S]*?<!-- Mobile Floating Nav Dock -->/, 
`<header class="sticky top-0 z-[100] bg-black/95 backdrop-blur-3xl border-b border-white/5 shadow-2xl transition-all duration-300">
        <div class="w-full max-w-[1920px] mx-auto px-6 lg:px-12 h-16 sm:h-20 flex items-center justify-between gap-8">
            <div class="flex items-center gap-10 min-w-0">
                <!-- Clean Brand Logo -->
                <a href="/hero.html" class="flex items-center gap-3 shrink-0 group">
                    <img src="/stalker_pro_infinity.svg" alt="Stalker Pro" class="h-6 sm:h-8 w-auto object-contain brightness-110 group-hover:brightness-125 transition-all" />
                </a>
                
                <!-- Minimalist Navigation Links -->
                <nav class="hidden md:flex items-center gap-8">
                    <button onclick="switchTab('home')" id="tab-home" class="nav-link active-tab text-[13px] font-bold text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white indicator"></div>Home</button>
                    <button onclick="switchTab('movies')" id="tab-movies" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Movies</button>
                    <button onclick="switchTab('tv')" id="tab-tv" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>TV Shows</button>
                    <button onclick="switchTab('anime')" id="tab-anime" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Anime</button>
                    <button onclick="switchTab('sports')" id="tab-sports" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Sports</button>
                    <button onclick="switchTab('watchlist')" id="tab-watchlist" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>My List</button>
                    <button onclick="switchTab('epg')" id="tab-epg" class="nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"><div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-transparent indicator transition-all"></div>Guide</button>
                </nav>
            </div>

            <div class="flex items-center gap-4 shrink-0">
                <!-- Search Trigger -->
                <button onclick="switchTab('search')" class="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all">
                    <i data-lucide="search" class="w-4 h-4"></i>
                </button>
                
                <a href="/login.php" class="w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-white/30 transition-all">
                    <img src="https://ui-avatars.com/api/?name=User&background=18181b&color=fff" alt="Account" class="w-full h-full object-cover">
                </a>
            </div>
        </div>
    </header>

    <!-- Mobile Floating Nav Dock -->`);
console.log("Updated Navbar");

// Also need to update the logic for switchTab active class in JS
html = html.replace(/tabBtn\.className = "nav-link active-tab text-sm font-black text-white relative py-2 transition-all after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0\.5 after:bg-amber-400 flex items-center gap-2";/g, 
    'tabBtn.className = "nav-link active-tab text-[13px] font-bold text-white relative py-2 transition-all flex items-center gap-2"; const ind = tabBtn.querySelector(".indicator"); if (ind) { ind.classList.remove("bg-transparent"); ind.classList.add("bg-white"); }');
html = html.replace(/tabBtn\.className = "nav-link text-sm font-bold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2";/g, 
    'tabBtn.className = "nav-link text-[13px] font-semibold text-zinc-400 hover:text-white relative py-2 transition-all flex items-center gap-2"; const ind = tabBtn.querySelector(".indicator"); if (ind) { ind.classList.add("bg-transparent"); ind.classList.remove("bg-white"); }');
console.log("Updated switchTab styling");

// 4. Change Anime Schedule grid to look like Apple TV Cards
// We update `renderAnimeScheduleGrid`
const renderGridStart = 'function renderAnimeScheduleGrid(items) {';
const renderGridEndRegex = /function loadLiveAnimeChannels\(\) \{/;
let renderGridReplacement = `function renderAnimeScheduleGrid(items) {
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
                const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
                const card = document.createElement('div');
                
                // Apple TV Style Card
                card.className = "bg-zinc-900/90 hover:bg-zinc-900 border border-white/10 hover:border-white/25 rounded-3xl p-5 shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer";
                card.onclick = () => openAnimeInfo(item);
                
                card.innerHTML = \`
                    <div class="space-y-4">
                        <div class="flex items-center justify-between gap-3">
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-10 h-10 bg-black/80 border border-white/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                    <img src="\${poster}" alt="" class="w-full h-full object-cover">
                                </div>
                                <div class="min-w-0">
                                    <h3 class="text-sm font-black uppercase tracking-wide text-white truncate group-hover:text-white transition-colors">\${studio}</h3>
                                    <p class="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Episode \${ep}</p>
                                </div>
                            </div>
                            <span class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/5 text-zinc-400 border border-white/10 flex items-center gap-1 shrink-0"><i data-lucide="clock" class="w-3 h-3 text-white/70"></i> \${timeStr}</span>
                        </div>

                        <div class="bg-black/50 border border-white/5 rounded-2xl p-3.5 space-y-2">
                            <div class="flex items-center justify-between gap-2">
                                <h4 class="text-xs sm:text-sm font-black text-white line-clamp-1 leading-snug">\${title}</h4>
                                <span class="text-[9px] font-mono font-bold text-white/70 bg-white/10 px-2 py-0.5 rounded-md shrink-0 border border-white/10">⭐ \${rating}</span>
                            </div>
                            <p class="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed pt-1">\${item.synopsis || "Catch the latest simulcast broadcast directly from Japan."}</p>
                        </div>
                    </div>
                \`;
                grid.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }
        
        async `;

html = html.replace(/function renderAnimeScheduleGrid\(items\) \{[\s\S]*?async function loadLiveAnimeChannels\(\) \{/, renderGridReplacement + 'function loadLiveAnimeChannels() {');
console.log("Updated Anime Scheduler UI");

// 5. Change background to black completely globally
html = html.replace(/<body class="bg-zinc-950 text-white font-sans overflow-x-hidden selection:bg-amber-500\/30 selection:text-amber-200 antialiased custom-scrollbar transition-colors duration-1000">/, 
    '<body class="bg-black text-white font-sans overflow-x-hidden selection:bg-white/30 selection:text-white antialiased custom-scrollbar transition-colors duration-1000">');
html = html.replace(/document\.body\.style\.backgroundImage = `radial-gradient[^`]+`;/g, 'document.body.style.backgroundImage = "none";');
html = html.replace(/document\.body\.style\.backgroundColor = "[^"]+";/g, 'document.body.style.backgroundColor = "black";');
console.log("Changed background to black");

fs.writeFileSync('consumet.html', html, 'utf8');
