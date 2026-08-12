const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. Remove dedicated Info buttons from Hollywood Premieres, renderShelfGrid, and renderTop10Shelf
html = html.replace(/<button onclick="event\.stopPropagation\(\); handleInfoClick\(this, 'movie', '\${item\.id}'\)" title="View Movie Details"[\s\S]*?<\/button>/gi, '');
html = html.replace(/<button onclick="event\.stopPropagation\(\); handleInfoClick\(this, '\${type}', '\${item\.id}'\)" title="View Info"[\s\S]*?<\/button>/gi, '');

// 2. Add Special Design Showcase & Subsections to HOME view (#view-home)
const homeSpecialDesignHtml = `
<!-- Special Design Section: Marvel & DC Multiverse Showcase -->
<div class="p-6 sm:p-10 rounded-[36px] bg-gradient-to-r from-red-950/80 via-purple-950/80 to-indigo-950/80 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative overflow-hidden space-y-6">
    <div class="absolute -right-20 -top-20 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
    
    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-2 max-w-xl">
            <div class="flex items-center gap-2">
                <span class="px-3 py-1 bg-red-600/30 text-red-400 border border-red-500/40 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">SPECIAL FEATURE</span>
                <span class="px-3 py-1 bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-full text-[10px] font-black uppercase tracking-widest">SUPERHERO HUB</span>
            </div>
            <h2 class="text-3xl sm:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg">Marvel & DC Multiverse</h2>
            <p class="text-xs text-zinc-300 font-medium leading-relaxed">Stream the complete superhero cinematic universes — from Avengers Endgame and Spider-Verse to Gotham Knights and Justice League.</p>
        </div>
        <div class="flex flex-wrap gap-2 z-10">
            <button onclick="searchAndPlayItem('Avengers', 'player1')" class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95">MCU Phase 5</button>
            <button onclick="searchAndPlayItem('Batman', 'player1')" class="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95">Gotham City</button>
            <button onclick="searchAndPlayItem('Spider-Man', 'player1')" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105 active:scale-95">Spider-Verse</button>
        </div>
    </div>
    
    <div class="scroller-container relative z-10">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('marvelDcShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="marvelDcShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('marvelDcShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 1: Deep Space & Sci-Fi Odyssey -->
<div class="space-y-4 pt-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-cyan-500 rounded-full shadow-lg shadow-cyan-500/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Deep Space & Sci-Fi Odyssey</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('scifiOdysseyShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="scifiOdysseyShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('scifiOdysseyShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 2: Epic Fantasy & Dragons Realm -->
<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-amber-500 rounded-full shadow-lg shadow-amber-500/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Epic Fantasy & Dragons Realm</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('fantasyDragonsShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="fantasyDragonsShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('fantasyDragonsShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 3: True Crime & Mind-Bending Thrillers -->
<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-purple-600 rounded-full shadow-lg shadow-purple-500/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">True Crime & Mind-Bending Thrillers</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('trueCrimeShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="trueCrimeShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('trueCrimeShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 4: Adrenaline-Fueled High Octane Action -->
<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-red-600 rounded-full shadow-lg shadow-red-500/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Adrenaline-Fueled High Octane Action</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('highOctaneActionShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="highOctaneActionShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('highOctaneActionShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 5: Oscar-Winning Masterpieces -->
<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-amber-100 uppercase">Oscar-Winning Masterpieces</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('oscarWinnersShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="oscarWinnersShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('oscarWinnersShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>

<!-- New Home Subsection 6: Global Blockbuster Franchise Vault -->
<div class="space-y-4">
    <div class="flex items-center gap-2">
        <span class="w-1.5 h-5 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50"></span>
        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">Global Blockbuster Franchise Vault</h2>
    </div>
    <div class="scroller-container">
        <button class="scroller-btn scroller-left" onclick="scrollShelf('blockbusterFranchiseShelf', 'left')"><i data-lucide="chevron-left"></i></button>
        <div id="blockbusterFranchiseShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
        <button class="scroller-btn scroller-right" onclick="scrollShelf('blockbusterFranchiseShelf', 'right')"><i data-lucide="chevron-right"></i></button>
    </div>
</div>
`;

// Inject into #view-home right after IMDb Direct Fetcher Banner
const imdbBannerMarker = '<!-- Top 10 Today Shelf -->';
if (html.includes(imdbBannerMarker)) {
    html = html.replace(imdbBannerMarker, homeSpecialDesignHtml + '\n' + imdbBannerMarker);
}

// 3. Add Special Design Showcase & Subsections to ANIME view (#view-anime)
const animeSpecialDesignHtml = `
<!-- Special Design Section: Otaku Special Bento Showcase -->
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

<!-- New Anime Subsection 1: Isekai & Reincarnation Adventures -->
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

<!-- New Anime Subsection 2: Fighting Masters & Martial Arts -->
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

<!-- New Anime Subsection 3: Cozy Slice of Life & Romance -->
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

<!-- New Anime Subsection 4: Cyberpunk & Futuristic Mecha War -->
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

<!-- New Anime Subsection 5: High School & Sports Champions -->
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

<!-- New Anime Subsection 6: Legendary Classic Anime Vault -->
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
`;

// Inject into #view-anime right before Top 10 Anime Today Shelf
const animeTop10Marker = '<!-- Top 10 Anime Today Shelf -->';
if (html.includes(animeTop10Marker)) {
    html = html.replace(animeTop10Marker, animeSpecialDesignHtml + '\n' + animeTop10Marker);
}

// 4. Update JavaScript to load all new Home & Anime shelves
const oldMasterLoader = `async function loadAllHomeShelves() {
    loadHomeSpotlight().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadTop10Today().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadTrendingMovies().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadPopularSeries().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadTopRatedMasterpieces().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadAsianDramaAndAnime().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadHollywoodPremieres().catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadRegionalHits('ta', 'tamilShelf').catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadRegionalHits('ml', 'malayalamShelf').catch(() => {});
    await new Promise(r => setTimeout(r, 60));
    loadExtraHomeShelves().catch(() => {});
}`;

const newMasterLoader = `async function loadAllHomeShelves() {
    loadHomeSpotlight().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadTop10Today().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadTrendingMovies().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadPopularSeries().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadTopRatedMasterpieces().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadAsianDramaAndAnime().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadHollywoodPremieres().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadRegionalHits('ta', 'tamilShelf').catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadRegionalHits('ml', 'malayalamShelf').catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadExtraHomeShelves().catch(() => {});
    await new Promise(r => setTimeout(r, 50));
    loadNewSubsectionsHome().catch(() => {});
}

async function loadNewSubsectionsHome() {
    const map = [
        { query: 'Marvel', shelf: 'marvelDcShelf' },
        { genre: '878', shelf: 'scifiOdysseyShelf', type: 'movie' },
        { genre: '14', shelf: 'fantasyDragonsShelf', type: 'movie' },
        { genre: '80', shelf: 'trueCrimeShelf', type: 'movie' },
        { genre: '28', shelf: 'highOctaneActionShelf', type: 'movie' },
        { sort: 'vote_average.desc', shelf: 'oscarWinnersShelf', type: 'movie' },
        { query: 'Star Wars', shelf: 'blockbusterFranchiseShelf' }
    ];

    map.forEach((item, idx) => {
        setTimeout(async () => {
            try {
                if (item.query) {
                    const res = await fetchTMDB('search/multi', { query: item.query });
                    if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, 'movie');
                } else {
                    const params = { page: 1 };
                    if (item.genre) params.with_genres = item.genre;
                    if (item.sort) params.sort_by = item.sort;
                    const res = await fetchTMDB(\`discover/\${item.type}\`, params);
                    if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, item.type);
                }
            } catch(e) {}
        }, idx * 120);
    });
}`;

html = html.replace(oldMasterLoader, newMasterLoader);

// Update loadAnimeCatalog to populate all new anime shelves
const oldAnimeCatalog = `async function loadAnimeCatalog() {
    try {
        const gql = \`
            query {
                Page(page: 1, perPage: 15) {
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title { romaji english native }
                        coverImage { large }
                        bannerImage
                        averageScore
                        episodes
                        description
                        genres
                    }
                }
            }
        \`;
        const data = await fetchAniListGraphQL(gql);
        if (!data || !data.Page || !data.Page.media) return;

        const animeList = data.Page.media;
        renderAnimeShelf(animeList, 'animeTrendingShelf');
        renderAnimeShelf(animeList.slice(0, 10), 'animeShonenShelf');
        renderAnimeShelf(animeList.slice(5, 15), 'animeTopRatedShelf');
        renderTop10Shelf(animeList.map(a => ({
            id: a.id,
            title: a.title.english || a.title.romaji,
            poster_path: a.coverImage.large,
            vote_average: a.averageScore ? a.averageScore / 10 : 8.5,
            media_type: 'tv'
        })), 'animeTop10Shelf', 'ANIME');
    } catch(e) {}
}`;

const newAnimeCatalog = `async function loadAnimeCatalog() {
    try {
        const gql = \`
            query {
                Page(page: 1, perPage: 30) {
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        id
                        title { romaji english native }
                        coverImage { large }
                        bannerImage
                        averageScore
                        episodes
                        description
                        genres
                    }
                }
            }
        \`;
        const data = await fetchAniListGraphQL(gql);
        if (!data || !data.Page || !data.Page.media) return;

        const animeList = data.Page.media;
        renderAnimeShelf(animeList.slice(0, 15), 'animeTrendingShelf');
        renderAnimeShelf(animeList.slice(0, 10), 'animeShonenShelf');
        renderAnimeShelf(animeList.slice(5, 15), 'animeTopRatedShelf');
        renderAnimeShelf(animeList.slice(10, 20), 'animeIsekaiShelf');
        renderAnimeShelf(animeList.slice(12, 22), 'animeFightingShelf');
        renderAnimeShelf(animeList.slice(15, 25), 'animeCozySliceShelf');
        renderAnimeShelf(animeList.slice(18, 28), 'animeMechaShelf');
        renderAnimeShelf(animeList.slice(20, 30), 'animeSportsShelf');
        renderAnimeShelf(animeList.slice(5, 20), 'animeClassicsVaultShelf');
        
        renderTop10Shelf(animeList.slice(0, 10).map(a => ({
            id: a.id,
            title: a.title.english || a.title.romaji,
            poster_path: a.coverImage.large,
            vote_average: a.averageScore ? a.averageScore / 10 : 8.5,
            media_type: 'tv'
        })), 'animeTop10Shelf', 'ANIME');
    } catch(e) {}
}`;

html = html.replace(oldAnimeCatalog, newAnimeCatalog);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated consumet.html v3, size:', html.length);
