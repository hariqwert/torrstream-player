const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Ensure logo uses /stalker_pro_logo.png
html = html.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
html = html.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');

// 1. RE-ORDER ANIME VIEW SECTIONS (#view-anime)
// Order: 1. Anime Spotlight Slider -> 2. Top 10 Anime Today Shelf -> 3. Weekly Broadcast Schedule Radar -> 4. Otaku Bento Hub -> 5. Sub-sections
const animeViewStart = html.indexOf('<section id="view-anime"');
const animeViewEnd = html.indexOf('</section>', animeViewStart);

if (animeViewStart !== -1 && animeViewEnd !== -1) {
    const newAnimeViewHtml = `
<section id="view-anime" class="hidden space-y-8 animate-fade-in">
    <!-- 1. Anime Spotlight Hero Slider with Auto-Scroll & Background Video Trailer -->
    <div id="animeHeroSliderContainer" class="relative h-[400px] sm:h-[500px] rounded-[36px] overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl">
        <div class="absolute inset-0 flex items-center justify-center text-zinc-500 font-mono text-xs">Loading Top 10 Anime Spotlight...</div>
    </div>

    <!-- 2. Top 10 Anime Today Shelf (Giant Typography Numbers #1 - #10) -->
    <div class="space-y-4">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-black shadow-lg">TOP 10 ANIME</span>
                <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Top 10 Anime Today</h2>
            </div>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeTop10Shelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeTop10Shelf" class="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeTop10Shelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <!-- 3. Weekly Anime Release Radar Broadcast Schedule Section -->
    <div id="animeScheduleSection" class="p-6 sm:p-8 rounded-3xl bg-zinc-900/80 backdrop-blur-2xl border border-indigo-500/30 shadow-2xl space-y-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
                <span class="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 w-fit mb-2">
                    <i data-lucide="calendar" class="w-3.5 h-3.5 text-indigo-400"></i> Anime Broadcast Schedule
                </span>
                <h2 class="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    Weekly Anime Release Radar
                </h2>
                <p class="text-xs text-zinc-400 mt-1">Real-time Japanese television broadcasting schedule powered by AniList Airing Engine</p>
            </div>
            <!-- Day Selector Tabs -->
            <div id="animeScheduleTabs" class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <button onclick="switchAnimeScheduleDay('today')" id="schedTab-today" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0">Today</button>
                <button onclick="switchAnimeScheduleDay('monday')" id="schedTab-monday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Mon</button>
                <button onclick="switchAnimeScheduleDay('tuesday')" id="schedTab-tuesday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Tue</button>
                <button onclick="switchAnimeScheduleDay('wednesday')" id="schedTab-wednesday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Wed</button>
                <button onclick="switchAnimeScheduleDay('thursday')" id="schedTab-thursday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Thu</button>
                <button onclick="switchAnimeScheduleDay('friday')" id="schedTab-friday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Fri</button>
                <button onclick="switchAnimeScheduleDay('saturday')" id="schedTab-saturday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Sat</button>
                <button onclick="switchAnimeScheduleDay('sunday')" id="schedTab-sunday" class="sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0">Sun</button>
            </div>
        </div>
        <div id="animeScheduleGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div class="col-span-full py-8 text-center text-xs font-bold text-indigo-400 uppercase tracking-widest">Select a day to view broadcast schedule</div>
        </div>
    </div>

    <!-- 4. Otaku Special Bento Showcase -->
    <div class="p-6 sm:p-10 rounded-[36px] bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-pink-950/90 border border-pink-500/40 shadow-[0_0_60px_rgba(236,72,153,0.25)] relative overflow-hidden space-y-6">
        <div class="absolute -right-20 -top-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2 max-w-xl">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="px-3 py-1 bg-pink-500/30 text-pink-300 border border-pink-500/40 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">⛩️ OTAKU ARENA SHOWCASE</span>
                    <span class="px-3 py-1 bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-full text-[10px] font-black uppercase tracking-widest">最高 SAIKOU</span>
                </div>
                <h2 class="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg">Studio Spotlight & Legendary Sagas</h2>
                <p class="text-xs text-zinc-300 font-medium leading-relaxed">Experience high-budget animation masterpieces from MAPPA, Ufotable, Studio Ghibli, and Wit Studio in ultra high resolution.</p>
            </div>
            <div class="flex flex-wrap gap-2 z-10">
                <span class="px-3 py-1.5 bg-black/60 border border-white/15 text-pink-400 text-xs font-black rounded-xl uppercase shadow-lg">Studio MAPPA</span>
                <span class="px-3 py-1.5 bg-black/60 border border-white/15 text-amber-400 text-xs font-black rounded-xl uppercase shadow-lg">Ufotable</span>
                <span class="px-3 py-1.5 bg-black/60 border border-white/15 text-emerald-400 text-xs font-black rounded-xl uppercase shadow-lg">Studio Ghibli</span>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div onclick="searchAndPlayItem('Jujutsu Kaisen', 'player1')" class="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-pink-500/60 transition-all cursor-pointer shadow-xl">
                <img loading="lazy" src="https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                    <span class="bg-pink-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">MAPPA</span>
                    <h3 class="text-lg font-black text-white uppercase leading-tight mt-1 group-hover:text-pink-400 transition-colors">Jujutsu Kaisen S2</h3>
                    <p class="text-[10px] text-zinc-400">Shonen Action • 24 Eps</p>
                </div>
            </div>
            <div onclick="searchAndPlayItem('Demon Slayer', 'player1')" class="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-indigo-500/60 transition-all cursor-pointer shadow-xl">
                <img loading="lazy" src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                    <span class="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">Ufotable</span>
                    <h3 class="text-lg font-black text-white uppercase leading-tight mt-1 group-hover:text-indigo-400 transition-colors">Demon Slayer Hashira Training</h3>
                    <p class="text-[10px] text-zinc-400">Supernatural • 11 Eps</p>
                </div>
            </div>
            <div onclick="searchAndPlayItem('Attack on Titan', 'player1')" class="group relative aspect-[16/9] rounded-2xl overflow-hidden border border-white/15 hover:border-amber-500/60 transition-all cursor-pointer shadow-xl">
                <img loading="lazy" src="https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=800" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                    <span class="bg-amber-600 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase">WIT / MAPPA</span>
                    <h3 class="text-lg font-black text-white uppercase leading-tight mt-1 group-hover:text-amber-400 transition-colors">Attack on Titan Final Chapter</h3>
                    <p class="text-[10px] text-zinc-400">Dark Fantasy • Finale</p>
                </div>
            </div>
        </div>
    </div>

    <!-- 5. Anime Sub-sections -->
    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Trending Anime Releases</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeTrendingShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeTrendingShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeTrendingShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Shonen & Action Legends</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeShonenShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeShonenShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeShonenShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Top Rated Masterpieces</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeTopRatedShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeTopRatedShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeTopRatedShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Isekai & Reincarnation Realm</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeIsekaiShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeIsekaiShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeIsekaiShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Fighting Masters & Martial Arts</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeFightingShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeFightingShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeFightingShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-pink-400 rounded-full shadow-lg shadow-pink-400/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Cozy Slice of Life & Romance</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeCozySliceShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeCozySliceShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeCozySliceShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Cyberpunk & Futuristic Mecha War</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeMechaShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeMechaShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeMechaShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-emerald-400 rounded-full shadow-lg shadow-emerald-400/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">High School & Sports Champions</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeSportsShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeSportsShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeSportsShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>

    <div class="space-y-4">
        <div class="flex items-center gap-2">
            <span class="w-1.5 h-5 bg-amber-400 rounded-full shadow-lg shadow-amber-400/50 animate-pulse"></span>
            <h2 class="text-xl sm:text-2xl font-black tracking-tight text-amber-100 uppercase">Legendary Classic Anime Vault</h2>
        </div>
        <div class="scroller-container">
            <button class="scroller-btn scroller-left" onclick="scrollShelf('animeClassicsVaultShelf', 'left')"><i data-lucide="chevron-left"></i></button>
            <div id="animeClassicsVaultShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
            <button class="scroller-btn scroller-right" onclick="scrollShelf('animeClassicsVaultShelf', 'right')"><i data-lucide="chevron-right"></i></button>
        </div>
    </div>
</section>
`;
    html = html.substring(0, animeViewStart) + newAnimeViewHtml + html.substring(animeViewEnd + 10);
}

// 2. OFFICIAL YOUTUBE TRAILER API ENGINE (TMDB VIDEOS API) & SPOTLIGHT BACKGROUND TRAILERS
const trailerEngineJs = `
// Official Video Trailer Provider API Engine
async function fetchOfficialTrailerKey(id, type = 'movie') {
    try {
        const data = await fetchTMDB(\`\${type}/\${id}/videos\`);
        if (data && data.results && data.results.length > 0) {
            const trailer = data.results.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube') || data.results[0];
            if (trailer && trailer.key) return trailer.key;
        }
    } catch(e) {}
    return null;
}

let currentSpotlightTrailerKey = null;

async function updateSpotlightBackgroundTrailer(containerId, item, type = 'movie') {
    const container = document.getElementById(containerId);
    if (!container || !item) return;

    const trailerKey = await fetchOfficialTrailerKey(item.id, type);
    const bgVideoEl = container.querySelector('.spotlight-bg-trailer');
    
    if (trailerKey) {
        currentSpotlightTrailerKey = trailerKey;
        if (!bgVideoEl) {
            const iframe = document.createElement('iframe');
            iframe.className = "spotlight-bg-trailer absolute inset-0 w-full h-full object-cover scale-125 opacity-40 pointer-events-none transition-opacity duration-1000 z-0";
            iframe.src = \`https://www.youtube-nocookie.com/embed/\${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=\${trailerKey}&enablejsapi=1&playsinline=1\`;
            iframe.allow = "autoplay; encrypted-media";
            container.insertBefore(iframe, container.firstChild);
        } else {
            bgVideoEl.src = \`https://www.youtube-nocookie.com/embed/\${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=\${trailerKey}&enablejsapi=1&playsinline=1\`;
        }
    } else if (bgVideoEl) {
        bgVideoEl.remove();
    }
}
`;

// Insert trailer engine JS right before renderSpotlightSlider
const renderSpotlightMarker = 'async function loadHomeSpotlight() {';
const markerIdx = html.indexOf(renderSpotlightMarker);
if (markerIdx !== -1) {
    html = html.substring(0, markerIdx) + trailerEngineJs + '\n\n' + html.substring(markerIdx);
}

// 3. UPDATE renderSpotlightSlider and renderAnimeSpotlightSlider to invoke updateSpotlightBackgroundTrailer
const updatedHomeSpotlightFn = `
async function loadHomeSpotlight() {
    try {
        const data = await fetchTMDB('trending/all/week');
        if (!data || !data.results) return;
        spotlightSlides = data.results.slice(0, 10);
        renderSpotlightSlider(0);
        
        if (spotlightInterval) clearInterval(spotlightInterval);
        spotlightInterval = setInterval(() => {
            if (activeTab === 'home' && spotlightSlides.length > 0) {
                currentSlideIndex = (currentSlideIndex + 1) % spotlightSlides.length;
                renderSpotlightSlider(currentSlideIndex);
            }
        }, 7000);
    } catch(e) {}
}

function renderSpotlightSlider(index = 0) {
    const container = document.getElementById('heroSliderContainer');
    if (!container || !spotlightSlides.length) return;
    currentSlideIndex = index;
    const item = spotlightSlides[index];
    const rank = index + 1;
    const title = item.title || item.name || "Featured Spotlight";
    const backdrop = item.backdrop_path ? \`https://image.tmdb.org/t/p/original\${item.backdrop_path}\` : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1920';
    const overview = item.overview || "Experience high-definition cinematic streaming.";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.5';
    const year = (item.release_date || item.first_air_date || '').substring(0,4) || '2024';
    const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');

    const dotsHtml = spotlightSlides.map((_, i) => \`
        <button onclick="renderSpotlightSlider(\${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 \${i === index ? 'bg-red-600 w-8 shadow-lg shadow-red-500/50' : 'bg-white/30 hover:bg-white/60'}" title="Slide \${i+1}"></button>
    \`).join('');

    container.innerHTML = \`
        <div class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('\${backdrop}')"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>

        <div class="absolute top-6 right-6 z-20 flex items-center gap-2">
            <span class="bg-red-600/90 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg uppercase tracking-wider border border-red-500/30">#\${rank} SPOTLIGHT TOP 10</span>
            <div class="hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                \${dotsHtml}
            </div>
        </div>

        <div class="absolute bottom-8 left-6 sm:left-12 right-6 z-20 max-w-2xl space-y-4">
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-wider">TOP 10 TRENDING</span>
                <span class="text-xs font-bold text-zinc-300 flex items-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i> \${rating}</span>
                <span class="text-xs font-bold text-zinc-400">\${year}</span>
                <span class="text-xs font-bold text-zinc-400 uppercase bg-white/10 px-2 py-0.5 rounded border border-white/10">\${type === 'tv' ? 'TV Series' : 'Movie'}</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl">\${title}</h1>
            <p class="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed font-medium">\${overview}</p>
            <div class="flex flex-wrap items-center gap-4 pt-2">
                <button onclick="openDetails('\${item.id}', '\${type}')" class="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-red-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="play" class="w-4 h-4 fill-white"></i> Watch Now
                </button>
                <button onclick="openDetails('\${item.id}', '\${type}')" class="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-amber-400"></i> View Info
                </button>
            </div>
        </div>
    \`;
    triggerLucide();
    updateSpotlightBackgroundTrailer('heroSliderContainer', item, type);
}
`;

const homeSpotlightStart = html.indexOf('async function loadHomeSpotlight() {');
const homeSpotlightEnd = html.indexOf('function renderShelfGrid', homeSpotlightStart);
if (homeSpotlightStart !== -1 && homeSpotlightEnd !== -1) {
    html = html.substring(0, homeSpotlightStart) + updatedHomeSpotlightFn + '\n\n' + html.substring(homeSpotlightEnd);
}

// 4. UPDATE openDetails to load Official Background Video Trailer in Details Modal
const oldDetailsLogic = `async function openDetails(id, type = 'movie') {`;
const updatedDetailsFn = `async function openDetails(id, type = 'movie') {
    const modal = document.getElementById('detailsModal');
    if (!modal) return;

    handleModalOpen(modal);

    document.getElementById('detailTitle').textContent = "Loading...";
    document.getElementById('detailOverview').textContent = "Fetching stream metadata and catalog info...";
    document.getElementById('detailCast').innerHTML = '';
    document.getElementById('detailGenres').innerHTML = '';

    let data = null;
    let actualType = type;

    try {
        data = await fetchTMDB(\`\${actualType}/\${id}\`, { append_to_response: 'credits,videos,external_ids' });
    } catch(err) {
        try {
            actualType = actualType === 'movie' ? 'tv' : 'movie';
            data = await fetchTMDB(\`\${actualType}/\${id}\`, { append_to_response: 'credits,videos,external_ids' });
        } catch(e2) {
            document.getElementById('detailTitle').textContent = "Details Unavailable";
            document.getElementById('detailOverview').textContent = "Failed to load metadata. " + err.message;
            return;
        }
    }

    if (!data) return;

    selectedMedia = data;
    selectedMedia.media_type = actualType;
    selectedSeason = 1;
    selectedEpisode = 1;

    const title = data.title || data.name || "Untitled";
    const tagline = data.tagline || "";
    const overview = data.overview || "No overview available.";
    const year = (data.release_date || data.first_air_date || '').substring(0,4) || '2024';
    const rating = data.vote_average ? data.vote_average.toFixed(1) : '8.5';
    const runtime = data.runtime ? \`\${data.runtime} min\` : (data.episode_run_time?.[0] ? \`\${data.episode_run_time[0]} min\` : '120 min');
    const poster = data.poster_path ? \`https://image.tmdb.org/t/p/w400\${data.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
    const backdrop = data.backdrop_path ? \`https://image.tmdb.org/t/p/original\${data.backdrop_path}\` : poster;

    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailTagline').textContent = tagline;
    document.getElementById('detailOverview').textContent = overview;
    document.getElementById('detailYear').textContent = year;
    document.getElementById('detailRating').innerHTML = \`<i class="w-3.5 h-3.5 fill-red-500 text-red-500 inline mr-1"></i> \${rating}\`;
    document.getElementById('detailRuntime').textContent = runtime;
    document.getElementById('detailType').textContent = actualType === 'tv' ? 'TV Series' : 'Movie';

    document.getElementById('detailPoster').src = poster;
    document.getElementById('detailBackdrop').style.backgroundImage = \`url('\${backdrop}')\`;

    // Load Official Background Video Trailer in Details Modal
    const trailerKey = data.videos?.results?.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube')?.key;
    const iframe = document.getElementById('trailerBgIframe');
    const trailerControls = document.getElementById('detailsTrailerControls');

    if (trailerKey && iframe) {
        iframe.src = \`https://www.youtube-nocookie.com/embed/\${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=\${trailerKey}&enablejsapi=1\`;
        if (trailerControls) trailerControls.classList.remove('hidden');
    } else if (iframe) {
        iframe.src = '';
        if (trailerControls) trailerControls.classList.add('hidden');
    }

    const genresContainer = document.getElementById('detailGenres');
    if (genresContainer && data.genres) {
        genresContainer.innerHTML = data.genres.map(g => \`<span class="bg-white/10 border border-white/15 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase">\${g.name}</span>\`).join('');
    }

    const imdbBadge = document.getElementById('imdbBadge');
    if (imdbBadge && data.external_ids?.imdb_id) {
        imdbBadge.href = \`https://www.imdb.com/title/\${data.external_ids.imdb_id}/\`;
        document.getElementById('imdbRatingVal').textContent = rating;
        imdbBadge.classList.remove('hidden');
    } else if (imdbBadge) {
        imdbBadge.classList.add('hidden');
    }

    const castContainer = document.getElementById('detailCast');
    if (castContainer && data.credits?.cast) {
        castContainer.innerHTML = data.credits.cast.slice(0, 10).map(c => \`
            <div class="w-20 shrink-0 text-center">
                <img loading="lazy" src="\${c.profile_path ? 'https://image.tmdb.org/t/p/w185' + c.profile_path : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=150'}" class="w-16 h-16 rounded-full object-cover mx-auto mb-1 border border-white/10">
                <p class="text-[10px] font-bold text-white truncate">\${c.name}</p>
                <p class="text-[8px] text-zinc-400 truncate">\${c.character || ''}</p>
            </div>
        \`).join('');
    }

    const tvNav = document.getElementById('tvNavigator');
    if (actualType === 'tv' && data.number_of_seasons) {
        tvNav.classList.remove('hidden');
        const seasonSelect = document.getElementById('seasonSelector');
        seasonSelect.innerHTML = '';
        for (let s = 1; s <= data.number_of_seasons; s++) {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = \`Season \${s}\`;
            seasonSelect.appendChild(opt);
        }
        loadSeasonEpisodes();
    } else if (tvNav) {
        tvNav.classList.add('hidden');
    }

    updateWatchlistBtnState();
    triggerLucide();
}`;

const openDetailsStart = html.indexOf('async function openDetails(id, type = \'movie\') {');
const openDetailsEnd = html.indexOf('function closeDetailsModal()', openDetailsStart);
if (openDetailsStart !== -1 && openDetailsEnd !== -1) {
    html = html.substring(0, openDetailsStart) + updatedDetailsFn + '\n\n' + html.substring(openDetailsEnd);
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully applied consumet.html v5 with Trailer API & EPG updates');
