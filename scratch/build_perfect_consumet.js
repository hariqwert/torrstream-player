const fs = require('fs');
const path = require('path');

const userHtmlPath = path.join(__dirname, 'user_old_version.html');
let rawHtml = fs.readFileSync(userHtmlPath, 'utf8');

// 1. Clean Kaspersky injected scripts and clean CDN links in <head>
rawHtml = rawHtml.replace(/src="\[https:\/\/gc\.kis\.v2\.scr\.kaspersky-labs\.com[\s\S]*?<\/script>/gi, '');
rawHtml = rawHtml.replace(/<link rel="stylesheet" crossorigin="anonymous" href="\[https:\/\/gc\.kis\.v2\.scr\.kaspersky-labs\.com[\s\S]*?\/>/gi, '');

rawHtml = rawHtml.replace(/<script src="\[https:\/\/cdn\.tailwindcss\.com\]\(https:\/\/cdn\.tailwindcss\.com\/\)"><\/script>/gi, '<script src="https://cdn.tailwindcss.com"></script>');
rawHtml = rawHtml.replace(/<script src="\[https:\/\/unpkg\.com\/lucide@latest\]\(https:\/\/unpkg\.com\/lucide@latest\)"><\/script>/gi, '<script src="https://unpkg.com/lucide@latest"></script>');
rawHtml = rawHtml.replace(/<script src="\[https:\/\/cdn\.jsdelivr\.net\/npm\/hls\.js@latest\]\(https:\/\/cdn\.jsdelivr\.net\/npm\/hls\.js@latest\)"><\/script>/gi, '<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>');
rawHtml = rawHtml.replace(/<script src="\[https:\/\/unpkg\.com\/lenis@1\.1\.18\/dist\/lenis\.min\.js\]\(https:\/\/unpkg\.com\/lenis@1\.1\.18\/dist\/lenis\.min\.js\)"><\/script>/gi, '<script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>');
rawHtml = rawHtml.replace(/<link href="\[https:\/\/fonts\.googleapis\.com[\s\S]*?" rel="stylesheet">/gi, '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">');

// 2. Clean logo image links and hrefs
rawHtml = rawHtml.replace(/href="\[\/hero\.html\]\(https:\/\/ellamoonu\.ai\.studio\/hero\.html\)"/g, 'href="/hero.html"');
rawHtml = rawHtml.replace(/src="\[\/stalker_pro_infinity\.svg\]\(https:\/\/ellamoonu\.ai\.studio\/stalker_pro_infinity\.svg\)"/g, 'src="/stalker_pro_logo.png"');
rawHtml = rawHtml.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
rawHtml = rawHtml.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
rawHtml = rawHtml.replace(/href="\[\/\]\(https:\/\/ellamoonu\.ai\.studio\/\)"/g, 'href="/"');

// 3. Remove cluttered overlay info buttons from HTML cards
rawHtml = rawHtml.replace(/<button onclick="event\.stopPropagation\(\); handleInfoClick\(this, 'movie', '\${item\.id}'\)" title="View Movie Details"[\s\S]*?<\/button>/gi, '');
rawHtml = rawHtml.replace(/<button onclick="event\.stopPropagation\(\); handleInfoClick\(this, '\${type}', '\${item\.id}'\)" title="View Info"[\s\S]*?<\/button>/gi, '');

// Extract HTML header & body up to <script>
const lastScriptIdx = rawHtml.lastIndexOf('<script>');
let htmlContent = rawHtml.substring(0, lastScriptIdx);

// 4. Ensure Marvel & DC Multiverse Showcase is present in #view-home
const marvelHomeShowcase = `
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

<!-- Home Subsections -->
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

if (!htmlContent.includes('id="marvelDcShelf"')) {
    const imdbMarker = '<!-- Top 10 Today Shelf -->';
    if (htmlContent.includes(imdbMarker)) {
        htmlContent = htmlContent.replace(imdbMarker, marvelHomeShowcase + '\n' + imdbMarker);
    }
}

// 5. Structure #view-anime cleanly with requested section order
const perfectAnimeHtml = `
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

const origAnimeStart = htmlContent.indexOf('<section id="view-anime"');
const origAnimeEnd = htmlContent.indexOf('</section>', htmlContent.indexOf('id="animeClassicsVaultShelf"'));
if (origAnimeStart !== -1 && origAnimeEnd !== -1) {
    const endTag = htmlContent.indexOf('</section>', origAnimeEnd);
    htmlContent = htmlContent.substring(0, origAnimeStart) + perfectAnimeHtml + htmlContent.substring(endTag + 10);
}

// 6. Complete, untruncated, 100% robust JavaScript engine
const masterJsEngine = `<script>
let lucideTimeout;
function triggerLucide() {
    if (!window.lucide) return;
    clearTimeout(lucideTimeout);
    lucideTimeout = setTimeout(() => {
        try { lucide.createIcons(); } catch(e){}
    }, 50);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    if (toastText) toastText.textContent = msg;
    if (toast) {
        toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
        }, 3000);
    }
}

let isTrailerPlaying = true;
let isTrailerMuted = true;

function toggleDetailsTrailerPlay() {
    const iframe = document.getElementById('trailerBgIframe');
    const playIcon = document.getElementById('detailsTrailerPlayIcon');
    if (!iframe) return;
    try {
        if (isTrailerPlaying) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
            isTrailerPlaying = false;
            if (playIcon) playIcon.setAttribute('data-lucide', 'play');
        } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
            isTrailerPlaying = true;
            if (playIcon) playIcon.setAttribute('data-lucide', 'pause');
        }
        triggerLucide();
    } catch(e){}
}

function toggleDetailsTrailerMute() {
    const iframe = document.getElementById('trailerBgIframe');
    const muteIcon = document.getElementById('detailsTrailerMuteIcon');
    if (!iframe) return;
    try {
        if (isTrailerMuted) {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
            isTrailerMuted = false;
            if (muteIcon) muteIcon.setAttribute('data-lucide', 'volume-2');
        } else {
            iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'mute', args: [] }), '*');
            isTrailerMuted = true;
            if (muteIcon) muteIcon.setAttribute('data-lucide', 'volume-x');
        }
        triggerLucide();
    } catch(e){}
}

// Robust Key Rotation Pool for 100% TMDB Reliability
const TMDB_KEYS = [
    "844dba0bfd8f3a231a957b6e07a10be8",
    "9d83476d2e27f56748167514c69cd2b4",
    "15d2ea6d0dc1d476efbca3eba2b9bbfb"
];
let tmdbKeyIdx = 0;

async function fetchTMDB(endpoint, params = {}) {
    for (let attempts = 0; attempts < TMDB_KEYS.length; attempts++) {
        const apiKey = TMDB_KEYS[tmdbKeyIdx];
        const query = new URLSearchParams({ api_key: apiKey, ...params }).toString();
        try {
            const res = await fetch(\`https://api.themoviedb.org/3/\${endpoint}?\${query}\`);
            if (res.ok) return await res.json();
            if (res.status === 404) throw new Error(\`TMDB 404: \${endpoint}\`);
        } catch(e) {
            if (e.message.includes('404')) throw e;
        }
        tmdbKeyIdx = (tmdbKeyIdx + 1) % TMDB_KEYS.length;
    }
    throw new Error(\`TMDB request failed for \${endpoint}\`);
}

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

// AniList GraphQL Engine
async function fetchAniListGraphQL(query, variables = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(\`AniList HTTP \${response.status}\`);
        const data = await response.json();
        return data.data;
    } catch (err) {
        console.warn('AniList GraphQL error:', err);
        return null;
    }
}

// Global Modal & Info Controller
let openModalsCount = 0;
window._animeCache = window._animeCache || {};
window._searchCache = window._searchCache || {};

function handleModalOpen(modalEl) {
    if (!modalEl) return;
    if (modalEl.classList.contains('hidden')) {
        modalEl.classList.remove('hidden');
        if (modalEl.id === 'searchPalette' || modalEl.id === 'epgChannelModal' || modalEl.id === 'epgProgramModal') {
            modalEl.classList.add('flex');
        }
        openModalsCount++;
    }
    document.body.style.overflow = 'hidden';
    try { if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop(); } catch(e){}
}

function handleModalClose(modalEl) {
    if (!modalEl) return;
    if (!modalEl.classList.contains('hidden')) {
        modalEl.classList.add('hidden');
        modalEl.classList.remove('flex');
        openModalsCount = Math.max(0, openModalsCount - 1);
    }
    if (openModalsCount === 0) {
        document.body.style.overflow = '';
        try { if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start(); } catch(e){}
    }
}

// Rich Anime Details Modal
async function openAnimeInfo(animeItem) {
    if (!animeItem) return;
    const modal = document.getElementById('detailsModal');
    if (!modal) return;

    handleModalOpen(modal);

    document.getElementById('detailBackdrop').style.opacity = '1';
    const detailsTrailerControls = document.getElementById('detailsTrailerControls');
    if (detailsTrailerControls) detailsTrailerControls.classList.add('hidden');

    const title = animeItem.title || animeItem.title_english || animeItem.name || "Untitled Anime";
    const japTitle = animeItem.japaneseTitle || animeItem.title_japanese || title;
    const score = animeItem.score || animeItem.vote_average || '8.8';
    const year = animeItem.year || (animeItem.first_air_date || animeItem.release_date || '').split('-')[0] || '2024';
    let poster = animeItem.poster;
    if (!poster && animeItem.images?.jpg?.large_image_url) poster = animeItem.images.jpg.large_image_url;
    if (!poster && animeItem.poster_path) poster = \`https://image.tmdb.org/t/p/w300\${animeItem.poster_path}\`;
    if (!poster) poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
    
    const backdrop = animeItem.backdrop || poster;
    const studio = animeItem.studio || 'Anime Studio';
    const totalEp = animeItem.episodes || animeItem.episode || 1;
    const synopsis = animeItem.synopsis || "Japanese animated series featuring immersive world-building and dynamic action.";
    const genres = animeItem.genres || ['Anime', 'Action', 'Fantasy'];

    selectedMedia = {
        id: animeItem.malId || animeItem.anilistId || animeItem.id || 99901,
        title: title,
        name: title,
        poster_path: poster,
        backdrop_path: backdrop,
        type: 'tv',
        media_type: 'tv'
    };
    selectedSeason = 1;
    selectedEpisode = 1;

    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailOverview').textContent = synopsis;
    document.getElementById('detailTagline').textContent = \`\${japTitle} • \${studio}\`;
    document.getElementById('detailYear').textContent = year;
    document.getElementById('detailRating').innerHTML = \`<i class="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline mr-1"></i> \${score} MAL/AniList Score\`;
    document.getElementById('detailRuntime').textContent = \`\${totalEp} Ep\${totalEp > 1 ? 's' : ''}\`;
    document.getElementById('detailType').textContent = "⛩️ Anime";

    const genresContainer = document.getElementById('detailGenres');
    if (genresContainer) {
        genresContainer.innerHTML = genres.map(g => \`<span class="bg-indigo-600/20 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-indigo-300">\${g}</span>\`).join('');
    }

    document.getElementById('detailPoster').src = poster;
    document.getElementById('detailBackdrop').style.backgroundImage = \`url('\${backdrop}')\`;

    const tvNav = document.getElementById('tvNavigator');
    if (tvNav) tvNav.classList.add('hidden');

    const actionContainer = document.querySelector('#detailsModal .pt-2');
    if (actionContainer) {
        let safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');
        let epButtonsHtml = '';
        if (totalEp > 1) {
            epButtonsHtml = \`
            <div class="w-full mt-4 pt-4 border-t border-white/10">
                <div class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Select Episode (1 - \${Math.min(totalEp, 50)})</span>
                    <span class="text-[10px] text-indigo-400 font-mono">\${totalEp} Total Episodes</span>
                </div>
                <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2" data-lenis-prevent="true">
            \`;
            const showEps = Math.min(totalEp, 50);
            for (let ep = 1; ep <= showEps; ep++) {
                epButtonsHtml += \`
                    <button onclick="searchAndPlayItem('\${safeTitle}', 'player1', \${ep})" class="px-3 py-1.5 bg-zinc-900 hover:bg-indigo-600 border border-white/10 text-xs font-bold text-white rounded-lg shrink-0 transition-all active:scale-95">
                        EP \${ep}
                    </button>
                \`;
            }
            epButtonsHtml += \`</div></div>\`;
        }

        actionContainer.innerHTML = \`
            <button onclick="searchAndPlayItem('\${safeTitle}', 'player1', 1)" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 transform active:scale-95">
                <i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Ep 1
            </button>
            <button onclick="searchAndPlayItem('\${safeTitle}', 'torrent', 1)" class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 transform active:scale-95">
                <i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> Torrent Stream
            </button>
            <button id="btn-watchlist-toggle" onclick="toggleWatchlist()" class="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2">
                <i data-lucide="bookmark" class="w-4 h-4"></i> Add to List
            </button>
            \${epButtonsHtml}
        \`;
    }
    updateWatchlistBtnState();
    triggerLucide();
}

// Global App State
let activeTab = 'home';
let currentSearchQuery = '';
let searchTimeout = null;
let selectedMedia = null;
let selectedSeason = 1;
let selectedEpisode = 1;

let moviesPage = 1;
let tvPage = 1;
let moviesList = [];
let tvList = [];
window.allSportsChannels = [];
window.watchlist = JSON.parse(localStorage.getItem('stalker_watchlist') || '[]');

let spotlightSlides = [];
let currentSlideIndex = 0;
let spotlightInterval = null;

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

// Preload configs and launch
async function initApp() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openSearchPalette();
        }
        if (e.key === 'Escape') {
            closeSearchPalette();
            closeDetailsModal();
            closePersonDetailsModal();
            closeEpgChannelModal();
            closeEpgProgramModal();
            closeTrailerPopup();
        }
    });

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    if (query.includes('imdb.com') || query.match(/tt\\d{7,10}/)) {
                        closeSearchPalette();
                        resolveAndPlayIMDb(query);
                    } else {
                        executeSearch();
                    }
                }
            }
        });
    }

    const loader = document.getElementById('mainLoader');
    if (loader) loader.classList.add('hidden');

    switchTab('home');

    // Load all Home shelves with staggered timing
    loadAllHomeShelves();

    setInterval(() => { refreshAllData(true); }, 15 * 60 * 1000);
}

// Master Staggered Home Loader
async function loadAllHomeShelves() {
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
        { genre: '28,878', shelf: 'marvelDcShelf', type: 'movie' },
        { genre: '878', shelf: 'scifiOdysseyShelf', type: 'movie' },
        { genre: '14', shelf: 'fantasyDragonsShelf', type: 'movie' },
        { genre: '80', shelf: 'trueCrimeShelf', type: 'movie' },
        { genre: '28', shelf: 'highOctaneActionShelf', type: 'movie' },
        { sort: 'vote_average.desc', shelf: 'oscarWinnersShelf', type: 'movie' },
        { genre: '12,878', shelf: 'blockbusterFranchiseShelf', type: 'movie' }
    ];

    map.forEach((item, idx) => {
        setTimeout(async () => {
            try {
                const params = { page: 1 };
                if (item.genre) params.with_genres = item.genre;
                if (item.sort) params.sort_by = item.sort;
                const res = await fetchTMDB(\`discover/\${item.type}\`, params);
                if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, item.type);
            } catch(e) {}
        }, idx * 100);
    });
}

// Additional Home Shelves
async function loadExtraHomeShelves() {
    const shelfMap = [
        { genre: '878', shelf: 'scifiShelf', type: 'movie' },
        { genre: '18', shelf: 'koreanShelf', type: 'tv', lang: 'ko' },
        { genre: '35', shelf: 'comedyShelf', type: 'movie' },
        { genre: '27', shelf: 'horrorShelf', type: 'movie' },
        { genre: '99', shelf: 'documentaryShelf', type: 'movie' },
        { genre: '36', shelf: 'classicShelf', type: 'movie' },
        { genre: '10751', shelf: 'kidsShelf', type: 'movie' },
        { genre: '18', shelf: 'awardShelf', type: 'movie', sort: 'vote_average.desc' }
    ];

    shelfMap.forEach((item, idx) => {
        setTimeout(async () => {
            try {
                const params = { page: 1 };
                if (item.genre) params.with_genres = item.genre;
                if (item.lang) params.with_original_language = item.lang;
                if (item.sort) params.sort_by = item.sort;
                const data = await fetchTMDB(\`discover/\${item.type}\`, params);
                if (data && data.results) {
                    renderShelfGrid(data.results.slice(0, 15), item.shelf, item.type);
                }
            } catch(e) {}
        }, idx * 100);
    });
}

async function loadHollywoodPremieres() {
    try {
        const data = await fetchTMDB('discover/movie', {
            with_original_language: 'en',
            'primary_release_date.gte': new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
            
            const card = document.createElement('div');
            card.className = "shrink-0 w-80 sm:w-[450px] aspect-[16/9] bg-zinc-950 rounded-3xl overflow-hidden cursor-pointer relative group border border-white/10 hover:border-red-500/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(239,68,68,0.3)]";
            card.onclick = () => openDetails(item.id, 'movie');
            
            card.innerHTML = \`
                <img loading="lazy" src="\${bg}" alt="\${item.title}" class="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700 md:group-hover:scale-105">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent"></div>
                
                <div class="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>
                    <span class="text-xs font-black text-white">\${item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</span>
                </div>
                
                <div class="absolute bottom-0 left-0 p-6 w-full flex flex-row items-end justify-between">
                    <div class="max-w-[75%]">
                        <span class="bg-red-600/90 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest mb-2 inline-block">New Release</span>
                        <h3 class="text-xl sm:text-2xl font-black text-white leading-tight uppercase tracking-tight line-clamp-2 drop-shadow-lg group-hover:text-red-400 transition-colors">\${item.title}</h3>
                        <p class="text-xs text-zinc-400 mt-2 font-medium line-clamp-1">\${(item.release_date || '').substring(0,4)} • Hollywood</p>
                    </div>
                    
                    <button class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center opacity-0 md:group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:bg-red-600 hover:text-white shrink-0">
                        <i data-lucide="play" class="w-5 h-5 fill-current"></i>
                    </button>
                </div>
            \`;
            shelf.appendChild(card);
        });
        triggerLucide();
    } catch(e) {}
}

async function loadRegionalHits(language, shelfId) {
    try {
        const data = await fetchTMDB('discover/movie', {
            with_original_language: language,
            sort_by: 'popularity.desc',
            page: 1
        });
        if(data && data.results) {
            renderShelfGrid(data.results, shelfId, 'movie');
        }
    } catch(e) {}
}

async function refreshAllData(silent = false) {
    await loadAllHomeShelves();
    if (silent) triggerLucide();
}

// Tab Switcher
function switchTab(tab) {
    if (typeof closeDetailsModal === 'function') closeDetailsModal();
    if (typeof closeSearchPalette === 'function') closeSearchPalette();
    if (typeof closePersonDetailsModal === 'function') closePersonDetailsModal();
    if (typeof closeTrailerPopup === 'function') closeTrailerPopup();

    document.body.style.overflow = '';
    if (window.lenis) window.lenis.start();

    activeTab = tab;
    const views = ['home', 'movies', 'tv', 'anime', 'sports', 'watchlist', 'epg', 'player'];
    views.forEach(v => {
        const el = document.getElementById(\`view-\${v}\`);
        if (el) {
            el.classList.add('hidden');
            if (v === 'player') el.classList.remove('flex', 'flex-col');
        }
        
        const tabBtn = document.getElementById(\`tab-\${v}\`);
        if (tabBtn) {
            if (v === tab) {
                tabBtn.className = "px-4 py-1.5 rounded-full text-xs font-black tracking-wide bg-white text-black shadow-lg shadow-white/10 transition-all scale-105";
            } else {
                tabBtn.className = "px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-zinc-400 hover:text-white hover:bg-white/10 transition-all";
            }
        }
        
        const mobBtn = document.getElementById(\`mob-tab-\${v}\`);
        if (mobBtn) {
            if (v === tab) {
                mobBtn.className = "flex flex-col items-center justify-center gap-1 text-white bg-white/15 px-3 py-1 rounded-full border border-white/20 shadow-md transition-all scale-105";
            } else {
                mobBtn.className = "flex flex-col items-center justify-center gap-1 text-zinc-400 hover:text-white transition-all";
            }
        }
    });

    if (tab === 'home') {
        const top10 = document.getElementById('top10Shelf');
        if (!top10 || !top10.children.length) loadAllHomeShelves();
    } else if (tab === 'sports') {
        loadSportsChannels();
    } else if (tab === 'epg') {
        if (!window.epgLoadedOnce) {
            window.epgLoadedOnce = true;
            setTimeout(() => { fetchAndParseEpg(); }, 200);
        }
    } else if (tab === 'watchlist') {
        renderWatchlist();
    } else if (tab === 'movies') {
        loadMoviesHomeData();
    } else if (tab === 'tv') {
        loadTvHomeData();
    } else if (tab === 'anime') {
        loadAnimeCatalog();
    }

    const targetView = document.getElementById(\`view-\${tab}\`);
    if (targetView) {
        targetView.classList.remove('hidden');
        if (tab === 'player') targetView.classList.add('flex', 'flex-col');
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
    triggerLucide();
}

function renderShelfGrid(items, elementId, defaultType = 'movie') {
    const shelf = document.getElementById(elementId);
    if (!shelf) return;
    shelf.innerHTML = '';
    
    items.forEach(item => {
        const title = item.title || item.name || "Untitled";
        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
        const type = item.media_type || (item.name || item.first_air_date ? 'tv' : defaultType);

        const card = document.createElement('div');
        card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform md:group-hover:-translate-y-1.5 hover:scale-105 hover:border-white/30 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-white/10";
        card.onclick = () => openDetails(item.id, type);
        
        card.innerHTML = \`
            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 md:group-hover:scale-100 transition-transform duration-300">
                        <i data-lucide="play" class="w-5 h-5 fill-black ml-0.5"></i>
                    </div>
                </div>
                <div class="absolute top-2.5 right-2.5 bg-black/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white border border-white/15 flex items-center gap-1 shadow-md">
                    <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400 text-emerald-400"></i> \${rating}
                </div>
            </div>
            <div class="p-3.5 bg-zinc-950/90 flex-grow flex flex-col justify-between border-t border-white/5">
                <h3 class="text-xs sm:text-sm font-bold text-white truncate tracking-tight" title="\${title}">\${title}</h3>
                <div class="flex items-center justify-between text-[9px] font-medium text-zinc-400 uppercase tracking-wider mt-1.5">
                    <span>\${year}</span>
                    <span class="text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">\${type === 'tv' ? 'Series' : 'Movie'}</span>
                </div>
            </div>
        \`;
        shelf.appendChild(card);
    });
    triggerLucide();
}

function scrollShelf(shelfId, direction) {
    const shelf = document.getElementById(shelfId);
    if (!shelf) return;
    const scrollAmt = direction === 'left' ? -380 : 380;
    shelf.scrollBy({ left: scrollAmt, behavior: 'smooth' });
}

function renderTop10Shelf(items, elementId, badgePrefix = 'TODAY') {
    const shelf = document.getElementById(elementId);
    if (!shelf) return;
    shelf.innerHTML = '';

    items.slice(0, 10).forEach((item, index) => {
        if (!item) return;
        const rank = index + 1;
        const title = item.title || item.name || "Untitled";
        let poster = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
        if (item.poster_path) poster = \`https://image.tmdb.org/t/p/w500\${item.poster_path}\`;
        const rating = item.vote_average ? item.vote_average.toFixed(1) : '8.8';
        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
        const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');

        const wrapper = document.createElement('div');
        wrapper.className = "flex items-center shrink-0 group cursor-pointer relative select-none pr-2 sm:pr-4";
        wrapper.onclick = () => openDetails(item.id, type);

        wrapper.innerHTML = \`
            <span class="text-8xl sm:text-9xl lg:text-[10rem] font-black text-white/25 group-hover:text-white/50 transition-all duration-300 font-mono -mr-6 sm:-mr-8 lg:-mr-10 z-0 drop-shadow-2xl tracking-tighter pointer-events-none md:group-hover:scale-105">\${rank}</span>
            <div class="relative w-44 sm:w-56 lg:w-60 aspect-[2/3] rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 group-hover:border-white/30 md:group-hover:scale-105 transition-all duration-300 shadow-2xl group-hover:shadow-white/10 z-10 flex flex-col justify-between">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500 absolute inset-0 z-0">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
                    <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 md:group-hover:scale-100 transition-transform duration-300">
                        <i data-lucide="play" class="w-5 h-5 fill-black ml-0.5"></i>
                    </div>
                </div>
                <div class="relative z-20 p-3 flex justify-between items-start">
                    <span class="bg-white text-black font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-lg uppercase tracking-wider">#\${rank} \${badgePrefix}</span>
                </div>
                <div class="relative z-10 p-3.5 bg-gradient-to-t from-black via-black/85 to-transparent border-t border-white/5">
                    <h3 class="text-xs sm:text-sm font-bold text-white truncate tracking-tight" title="\${title}">\${title}</h3>
                    <div class="flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mt-1.5">
                        <span>\${year}</span>
                        <span class="text-white/90 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">\${type === 'tv' ? 'Series' : 'Movie'}</span>
                    </div>
                </div>
            </div>
        \`;
        shelf.appendChild(wrapper);
    });
    triggerLucide();
}

async function loadTop10Today() {
    try {
        const data = await fetchTMDB('trending/all/day');
        if (data && data.results) renderTop10Shelf(data.results, 'top10Shelf');
    } catch(e) {}
}

async function loadTrendingMovies() {
    try {
        const data = await fetchTMDB('movie/popular');
        moviesList = data.results || [];
        renderShelfGrid(moviesList, 'trendingMoviesShelf', 'movie');
        renderFilterGrid(moviesList, 'moviesGrid', 'movie');
    } catch(e) {}
}

async function loadPopularSeries() {
    try {
        const data = await fetchTMDB('tv/popular');
        tvList = data.results || [];
        renderShelfGrid(tvList, 'trendingSeriesShelf', 'tv');
        renderFilterGrid(tvList, 'tvGrid', 'tv');
    } catch(e) {}
}

async function loadTopRatedMasterpieces() {
    try {
        const data = await fetchTMDB('movie/top_rated');
        if (data && data.results) renderShelfGrid(data.results.slice(0, 15), 'topRatedShelf', 'movie');
    } catch(e) {}
}

async function loadAsianDramaAndAnime() {
    try {
        const data = await fetchTMDB('discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' });
        if (data && data.results) renderShelfGrid(data.results.slice(0, 15), 'animeShelf', 'tv');
    } catch(e) {}
}

let moviesHomeLoaded = false;
async function loadMoviesHomeData() {
    if (moviesHomeLoaded) return;
    try {
        const actionData = await fetchTMDB('discover/movie', { with_genres: '28', sort_by: 'popularity.desc' });
        renderShelfGrid(actionData.results || [], 'movieActionShelf', 'movie');
        
        const sciFiData = await fetchTMDB('discover/movie', { with_genres: '878', sort_by: 'popularity.desc' });
        renderShelfGrid(sciFiData.results || [], 'movieSciFiShelf', 'movie');

        const comedyData = await fetchTMDB('discover/movie', { with_genres: '35', sort_by: 'popularity.desc' });
        renderShelfGrid(comedyData.results || [], 'movieComedyShelf', 'movie');

        const thrillerData = await fetchTMDB('discover/movie', { with_genres: '53', sort_by: 'popularity.desc' });
        renderShelfGrid(thrillerData.results || [], 'movieThrillerShelf', 'movie');

        moviesHomeLoaded = true;
    } catch(e) {}
}

let tvHomeLoaded = false;
async function loadTvHomeData() {
    if (tvHomeLoaded) return;
    try {
        const crimeData = await fetchTMDB('discover/tv', { with_genres: '80', sort_by: 'popularity.desc' });
        renderShelfGrid(crimeData.results || [], 'tvCrimeShelf', 'tv');
        
        const sciFiData = await fetchTMDB('discover/tv', { with_genres: '10765', sort_by: 'popularity.desc' });
        renderShelfGrid(sciFiData.results || [], 'tvSciFiShelf', 'tv');

        const comedyData = await fetchTMDB('discover/tv', { with_genres: '35', sort_by: 'popularity.desc' });
        renderShelfGrid(comedyData.results || [], 'tvComedyShelf', 'tv');

        const dramaData = await fetchTMDB('discover/tv', { with_genres: '18', sort_by: 'popularity.desc' });
        renderShelfGrid(dramaData.results || [], 'tvDramaShelf', 'tv');

        tvHomeLoaded = true;
    } catch(e) {}
}

async function applyFilters(type) {
    const genre = document.getElementById(\`\${type}-genre\`).value;
    const year = document.getElementById(\`\${type}-year\`).value;
    const gridId = type === 'movies' ? 'moviesGrid' : 'tvGrid';
    const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
    
    const homeLayout = document.getElementById(type === 'movies' ? 'moviesHomeLayout' : 'tvHomeLayout');
    const catalogLayout = document.getElementById(type === 'movies' ? 'moviesCatalogLayout' : 'tvCatalogLayout');

    if (!genre && !year) {
        if (homeLayout) homeLayout.classList.remove('hidden');
        if (catalogLayout) catalogLayout.classList.add('hidden');
        return;
    } else {
        if (homeLayout) homeLayout.classList.add('hidden');
        if (catalogLayout) catalogLayout.classList.remove('hidden');
    }

    try {
        const params = {};
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        const data = await fetchTMDB(endpoint, params);
        renderFilterGrid(data.results || [], gridId, type === 'movies' ? 'movie' : 'tv');
    } catch(e) {}
}

async function loadMore(type) {
    const page = type === 'movies' ? ++moviesPage : ++tvPage;
    const genre = document.getElementById(\`\${type}-genre\`).value;
    const year = document.getElementById(\`\${type}-year\`).value;
    const gridId = type === 'movies' ? 'moviesGrid' : 'tvGrid';
    const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';

    try {
        const params = { page };
        if (genre) params.with_genres = genre;
        if (year) params.primary_release_year = year;
        const data = await fetchTMDB(endpoint, params);
        appendFilterGrid(data.results || [], gridId, type === 'movies' ? 'movie' : 'tv');
    } catch(e) {}
}

function renderFilterGrid(items, gridId, defaultType) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';
    appendFilterGrid(items, gridId, defaultType);
}

function appendFilterGrid(items, gridId, defaultType) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    items.forEach(item => {
        const title = item.title || item.name || "Untitled";
        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
        const type = item.media_type || (item.name || item.first_air_date ? 'tv' : defaultType);

        const card = document.createElement('div');
        card.className = "bg-zinc-900/80 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform md:group-hover:-translate-y-1.5 hover:scale-105 hover:border-white/30 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-white/5";
        card.onclick = () => openDetails(item.id, type);
        
        card.innerHTML = \`
            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 md:group-hover:scale-100 transition-transform duration-300">
                        <i data-lucide="play" class="w-5 h-5 fill-black ml-0.5"></i>
                    </div>
                </div>
                <div class="absolute top-2.5 right-2.5 bg-black/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white border border-white/15 flex items-center gap-1 shadow-md">
                    <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400 text-emerald-400"></i> \${rating}
                </div>
            </div>
            <div class="p-3.5 bg-zinc-950/90 flex-grow flex flex-col justify-between border-t border-white/5">
                <h3 class="text-xs sm:text-sm font-bold text-white truncate tracking-tight" title="\${title}">\${title}</h3>
                <div class="flex items-center justify-between text-[9px] font-medium text-zinc-400 uppercase tracking-wider mt-1.5">
                    <span>\${year}</span>
                    <span class="text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">\${type === 'tv' ? 'Series' : 'Movie'}</span>
                </div>
            </div>
        \`;
        grid.appendChild(card);
    });
    triggerLucide();
}

// SEARCH PALETTE ENGINE
function openSearchPalette() {
    const palette = document.getElementById('searchPalette');
    if (palette) {
        handleModalOpen(palette);
        const input = document.getElementById('searchInput');
        if (input) {
            input.focus();
            if (input.value.trim()) executeSearch();
        }
    }
}

function closeSearchPalette() {
    const palette = document.getElementById('searchPalette');
    if (palette) handleModalClose(palette);
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { executeSearch(); }, 300);
}

async function executeSearch() {
    const input = document.getElementById('searchInput');
    const sourceSelect = document.getElementById('searchEngineSource');
    const resultsContainer = document.getElementById('searchResults');
    if (!input || !resultsContainer) return;
    
    const query = input.value.trim();
    const source = sourceSelect ? sourceSelect.value : 'tmdb';

    if (!query) {
        resultsContainer.innerHTML = \`<div class="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">Type a title to search...</div>\`;
        return;
    }

    resultsContainer.innerHTML = \`
        <div class="flex flex-col items-center justify-center py-12">
            <div class="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs font-bold text-zinc-400 uppercase tracking-widest">Searching \${source.toUpperCase()} Engine...</p>
        </div>
    \`;

    try {
        if (source === 'anilist') {
            const gql = \`
                query ($search: String) {
                    Page(page: 1, perPage: 20) {
                        media(search: $search, type: ANIME) {
                            id
                            title { romaji english native }
                            coverImage { large }
                            bannerImage
                            averageScore
                            episodes
                            format
                            status
                            description
                            genres
                        }
                    }
                }
            \`;
            const res = await fetchAniListGraphQL(gql, { search: query });
            const list = res?.Page?.media || [];
            renderAnimeSearchResults(list, resultsContainer);
        } else {
            try {
                const data = await fetchTMDB('search/multi', { query });
                const list = data?.results || [];
                if (list.length > 0) {
                    renderTMDBSearchResults(list, resultsContainer);
                    return;
                }
            } catch(e){}

            const backendRes = await fetch(\`/api/v1/search?q=\${encodeURIComponent(query)}\`).catch(() => null);
            if (backendRes && backendRes.ok) {
                const searchRes = await backendRes.json();
                if (searchRes.results && searchRes.results.length > 0) {
                    renderBackendSearchResults(searchRes.results, resultsContainer);
                    return;
                }
            }

            resultsContainer.innerHTML = \`<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase">No results found for "\${query}"</div>\`;
        }
    } catch(err) {
        resultsContainer.innerHTML = \`<div class="text-center py-8 text-red-400 text-xs font-bold uppercase">Search error: \${err.message}</div>\`;
    }
}

function renderTMDBSearchResults(list, container) {
    if (!list.length) {
        container.innerHTML = \`<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase">No TMDB titles found</div>\`;
        return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

    list.forEach(item => {
        if (item.media_type === 'person') return;
        const title = item.title || item.name || "Untitled";
        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
        const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');
        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
        const year = (item.release_date || item.first_air_date || '').substring(0,4) || '';

        window._searchCache[item.id] = item;

        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-white/10 hover:border-red-500/50 rounded-2xl overflow-hidden cursor-pointer group transition-all transform hover:-translate-y-1";
        card.onclick = () => {
            closeSearchPalette();
            openDetails(item.id, type);
        };

        card.innerHTML = \`
            <div class="aspect-[2/3] relative overflow-hidden bg-black">
                <img loading="lazy" src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                <div class="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                    <i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> \${rating}
                </div>
            </div>
            <div class="p-3">
                <h4 class="text-xs font-bold text-white truncate" title="\${title}">\${title}</h4>
                <div class="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase mt-1">
                    <span>\${type === 'tv' ? 'TV Series' : 'Movie'}</span>
                    <span>\${year}</span>
                </div>
            </div>
        \`;
        grid.appendChild(card);
    });

    container.appendChild(grid);
    triggerLucide();
}

function renderBackendSearchResults(list, container) {
    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-1 sm:grid-cols-2 gap-4";

    list.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-white/10 hover:border-red-500/50 p-4 rounded-2xl cursor-pointer group transition-all flex items-center justify-between gap-3";
        card.onclick = () => {
            closeSearchPalette();
            searchAndPlayItem(item.title || "Movie Stream");
        };

        card.innerHTML = \`
            <div>
                <h4 class="text-xs font-bold text-white truncate" title="\${item.title}">\${item.title}</h4>
                <div class="flex items-center gap-2 text-[9px] font-bold text-zinc-400 uppercase mt-1">
                    <span class="text-amber-400">\${item.quality || 'HD'}</span>
                    <span>•</span>
                    <span>\${item.size || 'Stream'}</span>
                    <span>•</span>
                    <span class="text-emerald-400">\${item.seeds || 10} Seeds</span>
                </div>
            </div>
            <button class="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold shrink-0">Play</button>
        \`;
        grid.appendChild(card);
    });

    container.appendChild(grid);
    triggerLucide();
}

function renderAnimeSearchResults(list, container) {
    if (!list.length) {
        container.innerHTML = \`<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase">No anime found</div>\`;
        return;
    }

    container.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4";

    list.forEach(item => {
        const title = item.title?.english || item.title?.romaji || item.title || item.name || "Untitled Anime";
        let poster = item.coverImage?.large || item.images?.jpg?.large_image_url || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
        const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : (item.score ? item.score.toFixed(1) : '8.5');
        const id = item.id || item.mal_id || Math.floor(Math.random() * 100000);

        const animeObj = {
            malId: id,
            anilistId: id,
            id: id,
            title: title,
            poster: poster,
            backdrop: item.bannerImage || poster,
            score: score,
            episodes: item.episodes || 12,
            synopsis: item.description || item.synopsis || "Anime series",
            genres: item.genres || ['Anime']
        };

        window._animeCache[id] = animeObj;
        window._searchCache[id] = animeObj;

        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-white/10 hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer group transition-all transform hover:-translate-y-1";
        card.onclick = () => {
            closeSearchPalette();
            openAnimeInfo(animeObj);
        };

        card.innerHTML = \`
            <div class="aspect-[2/3] relative overflow-hidden bg-black">
                <img loading="lazy" src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                <div class="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                    <i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> \${score}
                </div>
            </div>
            <div class="p-3">
                <h4 class="text-xs font-bold text-white truncate" title="\${title}">\${title}</h4>
                <div class="flex items-center justify-between text-[9px] font-bold text-indigo-400 uppercase mt-1">
                    <span>Anime</span>
                    <span>\${item.episodes || '?'} Ep</span>
                </div>
            </div>
        \`;
        grid.appendChild(card);
    });

    container.appendChild(grid);
    triggerLucide();
}

// DETAILS MODAL ENGINE (With Auto Fallback & Background Video Trailer)
async function openDetails(id, type = 'movie') {
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

    // Official Video Trailer Embed in Details Modal
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
}

function closeDetailsModal() {
    const modal = document.getElementById('detailsModal');
    if (modal) handleModalClose(modal);
}

function closePersonDetailsModal() {
    const modal = document.getElementById('personDetailsModal');
    if (modal) handleModalClose(modal);
}

async function loadSeasonEpisodes() {
    if (!selectedMedia || selectedMedia.media_type !== 'tv') return;
    const seasonSelect = document.getElementById('seasonSelector');
    const seasonNum = seasonSelect ? seasonSelect.value : 1;
    selectedSeason = parseInt(seasonNum);

    const grid = document.getElementById('episodesGrid');
    if (!grid) return;
    grid.innerHTML = \`<div class="col-span-full py-6 text-center text-xs font-bold text-zinc-400 uppercase">Loading Season \${seasonNum} Episodes...</div>\`;

    try {
        const data = await fetchTMDB(\`tv/\${selectedMedia.id}/season/\${seasonNum}\`);
        if (!data || !data.episodes) return;
        grid.innerHTML = '';

        data.episodes.forEach(ep => {
            const card = document.createElement('div');
            card.className = "bg-zinc-900/90 border border-white/10 hover:border-red-500/40 p-3 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group";
            card.onclick = () => {
                selectedEpisode = ep.episode_number;
                openFullscreenPlayer();
            };

            const still = ep.still_path ? \`https://image.tmdb.org/t/p/w300\${ep.still_path}\` : selectedMedia.poster_path ? \`https://image.tmdb.org/t/p/w300\${selectedMedia.poster_path}\` : '';

            card.innerHTML = \`
                <div class="aspect-video relative rounded-xl overflow-hidden mb-2 bg-black">
                    <img loading="lazy" src="\${still}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div class="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center">
                            <i data-lucide="play" class="w-4 h-4 fill-black"></i>
                        </div>
                    </div>
                    <span class="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-black text-white">EP \${ep.episode_number}</span>
                </div>
                <h4 class="text-xs font-bold text-white truncate" title="\${ep.name}">\${ep.episode_number}. \${ep.name}</h4>
                <p class="text-[9px] text-zinc-400 line-clamp-2 mt-1 font-medium">\${ep.overview || 'No description available.'}</p>
            \`;
            grid.appendChild(card);
        });
        triggerLucide();
    } catch(err) {
        grid.innerHTML = \`<div class="col-span-full py-4 text-center text-xs font-bold text-red-400">Failed to load episodes</div>\`;
    }
}

// FULLSCREEN THEATER PLAYER ENGINE
function openFullscreenPlayer(overrideItem = null) {
    const item = overrideItem || selectedMedia;
    if (!item) return;

    closeDetailsModal();
    const playerView = document.getElementById('view-player');
    if (!playerView) return;

    playerView.classList.remove('hidden');
    playerView.classList.add('flex', 'flex-col');

    const title = item.title || item.name || "Cinema Stream";
    const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');

    document.getElementById('playerTitleLabel').textContent = title;
    document.getElementById('playerSubtitleLabel').innerHTML = \`<span class="inline-flex items-center gap-1 bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-black tracking-wide text-[8px] sm:text-[9px]">&bull; 1080P HD / \${type === 'tv' ? \`S\${selectedSeason} E\${selectedEpisode}\` : 'MOVIE'}</span>\`;

    const placeholderTitle = document.getElementById('fullscreenPlaceholderMediaTitle');
    if (placeholderTitle) placeholderTitle.textContent = \`Click Play to Stream: \${title}\`;

    const placeholder = document.getElementById('fullscreenPlayerPlaceholder');
    const iframe = document.getElementById('fullscreenVideoIframe');
    if (placeholder) placeholder.classList.remove('hidden');
    if (iframe) {
        iframe.classList.add('hidden');
        iframe.src = '';
    }

    startActualFullscreenPlayback();
}

function startActualFullscreenPlayback() {
    if (!selectedMedia) return;
    const placeholder = document.getElementById('fullscreenPlayerPlaceholder');
    const iframe = document.getElementById('fullscreenVideoIframe');
    if (placeholder) placeholder.classList.add('hidden');
    if (iframe) iframe.classList.remove('hidden');

    const id = selectedMedia.id;
    const type = selectedMedia.media_type || (selectedMedia.name || selectedMedia.first_air_date ? 'tv' : 'movie');
    const s = selectedSeason || 1;
    const e = selectedEpisode || 1;
    const serverSelect = document.getElementById('playerServerSelector');
    const server = serverSelect ? serverSelect.value : 'vidlink';

    let streamUrl = '';
    if (server === 'vidlink') {
        streamUrl = type === 'tv' ? \`https://vidlink.pro/tv/\${id}/\${s}/\${e}\` : \`https://vidlink.pro/movie/\${id}\`;
    } else if (server === 'smashystream') {
        streamUrl = type === 'tv' ? \`https://embed.smashystream.com/playere.php?tmdb=\${id}&season=\${s}&episode=\${e}\` : \`https://embed.smashystream.com/playere.php?tmdb=\${id}\`;
    } else if (server === 'embedsu' || server === 'embed_su') {
        streamUrl = type === 'tv' ? \`https://embed.su/embed/tv/\${id}/\${s}/\${e}\` : \`https://embed.su/embed/movie/\${id}\`;
    } else if (server === 'vidbinge') {
        streamUrl = type === 'tv' ? \`https://vidbinge.dev/embed/tv/\${id}/\${s}/\${e}\` : \`https://vidbinge.dev/embed/movie/\${id}\`;
    } else if (server === 'vidsrc_net') {
        streamUrl = type === 'tv' ? \`https://vidsrc.net/embed/tv?tmdb=\${id}&season=\${s}&episode=\${e}\` : \`https://vidsrc.net/embed/movie/\${id}\`;
    } else {
        streamUrl = type === 'tv' ? \`https://vidsrc.to/embed/tv/\${id}/\${s}/\${e}\` : \`https://vidsrc.to/embed/movie/\${id}\`;
    }

    if (iframe) iframe.src = streamUrl;
}

function changeServerFromFullscreen() {
    startActualFullscreenPlayback();
}

function closeFullscreenPlayer() {
    const playerView = document.getElementById('view-player');
    const iframe = document.getElementById('fullscreenVideoIframe');
    if (iframe) iframe.src = '';
    if (playerView) {
        playerView.classList.add('hidden');
        playerView.classList.remove('flex', 'flex-col');
    }
}

function toggleFullscreenTheater() {
    const container = document.getElementById('cinemaPlayerWrapper');
    if (!container) return;
    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen().catch(() => {});
    }
}

function playPreviousEpisode() {
    if (selectedEpisode > 1) {
        selectedEpisode--;
        openFullscreenPlayer();
    }
}

function playNextEpisode() {
    selectedEpisode++;
    openFullscreenPlayer();
}

// Torrent Player Bridge
function openTorrentPlayer() {
    if (!selectedMedia) return;
    const title = selectedMedia.title || selectedMedia.name || "";
    showToast(\`Searching BitTorrent swarms for "\${title}"...\`);
    window.location.href = \`/?play=\${encodeURIComponent(title)}\`;
}

function searchAndPlayItem(queryTitle, mode = 'player1', ep = 1) {
    selectedMedia = {
        id: 19995,
        title: queryTitle,
        name: queryTitle,
        media_type: 'movie'
    };
    selectedEpisode = ep;
    if (mode === 'torrent') {
        openTorrentPlayer();
    } else {
        openFullscreenPlayer();
    }
}

function fetchIMDbItem() {
    const input = document.getElementById('imdbFetcherInput');
    if (!input || !input.value.trim()) return;
    resolveAndPlayIMDb(input.value.trim());
}

async function resolveAndPlayIMDb(query) {
    showToast(\`Resolving IMDb Direct Stream for "\${query}"...\`);
    const match = query.match(/tt\\d{7,10}/);
    const imdbId = match ? match[0] : null;

    if (imdbId) {
        try {
            const data = await fetchTMDB(\`find/\${imdbId}\`, { external_source: 'imdb_id' });
            const item = data?.movie_results?.[0] || data?.tv_results?.[0];
            if (item) {
                openDetails(item.id, item.title ? 'movie' : 'tv');
                return;
            }
        } catch(e) {}
    }
    openSearchPalette();
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = query;
        executeSearch();
    }
}

// WATCHLIST SYSTEM
function toggleWatchlist() {
    if (!selectedMedia) return;
    const id = selectedMedia.id;
    const idx = window.watchlist.findIndex(x => x.id === id);
    if (idx !== -1) {
        window.watchlist.splice(idx, 1);
        showToast("Removed from My List");
    } else {
        window.watchlist.push({
            id: selectedMedia.id,
            title: selectedMedia.title || selectedMedia.name,
            poster_path: selectedMedia.poster_path,
            vote_average: selectedMedia.vote_average,
            media_type: selectedMedia.media_type || 'movie'
        });
        showToast("Saved to My List");
    }
    localStorage.setItem('stalker_watchlist', JSON.stringify(window.watchlist));
    updateWatchlistBtnState();
}

function updateWatchlistBtnState() {
    const btn = document.getElementById('btn-watchlist-toggle');
    if (!btn || !selectedMedia) return;
    const exists = window.watchlist.some(x => x.id === selectedMedia.id);
    btn.innerHTML = exists ? \`<i data-lucide="check" class="w-4 h-4 text-emerald-400"></i> Saved to List\` : \`<i data-lucide="bookmark" class="w-4 h-4"></i> Add to List\`;
    triggerLucide();
}

function renderWatchlist() {
    const grid = document.getElementById('watchlistGrid');
    if (!grid) return;
    if (!window.watchlist.length) {
        grid.innerHTML = \`<div class="col-span-full py-16 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">Your watchlist is currently empty</div>\`;
        return;
    }
    renderFilterGrid(window.watchlist, 'watchlistGrid', 'movie');
}

// SPORTS & IPTV CHANNELS ENGINE
async function loadSportsChannels() {
    const sampleSports = [
        { name: "Sky Sports Main Event HD", cat: "sky", icon: "trophy", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Sky Sports Premier League", cat: "sky", icon: "circle-play", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Sky Sports F1 Racing 4K", cat: "f1", icon: "zap", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "TNT Sports 1 HD (UK)", cat: "football", icon: "activity", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "ESPN HD Live Sports", cat: "us", icon: "tv", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Sony Ten 1 HD", cat: "sony", icon: "radio", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Star Sports 1 Cricket", cat: "cricket", icon: "trophy", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Willow TV Cricket HD", cat: "cricket", icon: "radio", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "HBO HD Channel", cat: "hbo", icon: "film", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
        { name: "Cartoon Network HD", cat: "kids", icon: "smile", url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
    ];

    window.allSportsChannels = sampleSports;
    renderSportsShelves(sampleSports);
}

function renderSportsShelves(channels) {
    const map = {
        sky: 'sportsSkyShelf',
        football: 'sportsFootballShelf',
        cricket: 'sportsCricketShelf',
        f1: 'sportsF1Shelf',
        us: 'sportsUSShelf',
        sony: 'sportsSonyShelf',
        hbo: 'sportsHBOShelf',
        kids: 'sportsKidsShelf'
    };

    Object.keys(map).forEach(cat => {
        const shelf = document.getElementById(map[cat]);
        if (!shelf) return;
        shelf.innerHTML = '';
        const items = channels.filter(c => c.cat === cat);
        items.forEach(ch => {
            const card = document.createElement('div');
            card.className = "w-44 sm:w-56 shrink-0 bg-zinc-900/90 border border-white/10 hover:border-amber-500/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group shadow-xl";
            card.onclick = () => playStreamDirect(ch.url, ch.name);

            card.innerHTML = \`
                <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <i data-lucide="\${ch.icon}" class="w-5 h-5"></i>
                </div>
                <h4 class="text-xs font-bold text-white group-hover:text-amber-400 transition-colors truncate">\${ch.name}</h4>
                <div class="flex items-center justify-between text-[9px] font-bold text-zinc-400 uppercase mt-2">
                    <span class="text-emerald-400 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> LIVE</span>
                    <span>HD 1080P</span>
                </div>
            \`;
            shelf.appendChild(card);
        });
    });
    triggerLucide();
}

function filterSports() {
    const query = document.getElementById('sportsSearch').value.toLowerCase().trim();
    const catalog = document.getElementById('sportsCatalogLayout');
    const home = document.getElementById('sportsHomeLayout');
    const grid = document.getElementById('sportsGrid');

    if (!query) {
        if (catalog) catalog.classList.add('hidden');
        if (home) home.classList.remove('hidden');
        return;
    }

    if (home) home.classList.add('hidden');
    if (catalog) catalog.classList.remove('hidden');

    const filtered = window.allSportsChannels.filter(c => c.name.toLowerCase().includes(query));
    if (!grid) return;
    grid.innerHTML = '';
    filtered.forEach(ch => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-white/10 hover:border-amber-500/50 p-3 rounded-2xl cursor-pointer transition-all";
        card.onclick = () => playStreamDirect(ch.url, ch.name);
        card.innerHTML = \`
            <h4 class="text-xs font-bold text-white truncate">\${ch.name}</h4>
            <p class="text-[9px] text-amber-400 font-bold uppercase mt-1">Live Stream</p>
        \`;
        grid.appendChild(card);
    });
}

function filterSportsCategory(cat) {
    const catalog = document.getElementById('sportsCatalogLayout');
    const home = document.getElementById('sportsHomeLayout');
    const grid = document.getElementById('sportsGrid');

    if (cat === 'all') {
        if (catalog) catalog.classList.add('hidden');
        if (home) home.classList.remove('hidden');
        return;
    }

    if (home) home.classList.add('hidden');
    if (catalog) catalog.classList.remove('hidden');

    const filtered = window.allSportsChannels.filter(c => c.cat === cat);
    if (!grid) return;
    grid.innerHTML = '';
    filtered.forEach(ch => {
        const card = document.createElement('div');
        card.className = "bg-zinc-900 border border-white/10 hover:border-amber-500/50 p-3 rounded-2xl cursor-pointer transition-all";
        card.onclick = () => playStreamDirect(ch.url, ch.name);
        card.innerHTML = \`
            <h4 class="text-xs font-bold text-white truncate">\${ch.name}</h4>
            <p class="text-[9px] text-amber-400 font-bold uppercase mt-1">Live Stream</p>
        \`;
        grid.appendChild(card);
    });
}

function playCustomM3uStream() {
    const nameInput = document.getElementById('customM3uNameInput');
    const urlInput = document.getElementById('customM3uUrlInput');
    const url = urlInput ? urlInput.value.trim() : '';
    const name = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'Custom Live Channel';

    if (!url) {
        showToast("Please enter a valid stream URL");
        return;
    }

    playStreamDirect(url, name);
}

function playStreamDirect(streamUrl, channelName) {
    selectedMedia = {
        id: 99999,
        title: channelName,
        name: channelName,
        media_type: 'movie'
    };

    closeDetailsModal();
    const playerView = document.getElementById('view-player');
    if (playerView) {
        playerView.classList.remove('hidden');
        playerView.classList.add('flex', 'flex-col');
    }

    document.getElementById('playerTitleLabel').textContent = channelName;
    document.getElementById('playerSubtitleLabel').innerHTML = \`<span class="inline-flex items-center gap-1 bg-emerald-600/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-black tracking-wide text-[8px] sm:text-[9px]">&bull; LIVE BROADCAST</span>\`;

    const placeholder = document.getElementById('fullscreenPlayerPlaceholder');
    const iframe = document.getElementById('fullscreenVideoIframe');
    const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
    const nativeVideo = document.getElementById('fullscreenNativePlayer');

    if (placeholder) placeholder.classList.add('hidden');
    if (iframe) {
        iframe.classList.add('hidden');
        iframe.src = '';
    }

    if (nativeContainer && nativeVideo) {
        nativeContainer.classList.remove('hidden');
        if (typeof Hls !== 'undefined' && Hls.isSupported() && streamUrl.includes('.m3u8')) {
            const hls = new Hls();
            hls.loadSource(streamUrl);
            hls.attachMedia(nativeVideo);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                nativeVideo.play().catch(() => {});
            });
        } else {
            nativeVideo.src = streamUrl;
            nativeVideo.play().catch(() => {});
        }
    }
}

// ANIME CATALOG & SPOTLIGHT ENGINE
let animeSpotlightSlides = [];
let currentAnimeSlideIndex = 0;
let animeSpotlightInterval = null;

function renderAnimeSpotlightSlider(index = 0) {
    const container = document.getElementById('animeHeroSliderContainer');
    if (!container || !animeSpotlightSlides.length) return;
    currentAnimeSlideIndex = index;
    const item = animeSpotlightSlides[index];
    const rank = index + 1;
    const title = item.title?.english || item.title?.romaji || item.title || item.name || "Featured Anime";
    const backdrop = item.bannerImage || item.coverImage?.large || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560';
    const overview = item.description || item.synopsis || "Japanese animated masterpiece with high-budget animation.";
    const score = item.averageScore ? (item.averageScore / 10).toFixed(1) : (item.score ? item.score.toFixed(1) : '8.8');
    const epCount = item.episodes || 12;

    const dotsHtml = animeSpotlightSlides.map((_, i) => \`
        <button onclick="renderAnimeSpotlightSlider(\${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 \${i === index ? 'bg-indigo-500 w-8 shadow-lg shadow-indigo-500/50' : 'bg-white/30 hover:bg-white/60'}" title="Anime \${i+1}"></button>
    \`).join('');

    container.innerHTML = \`
        <div class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('\${backdrop}')"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>

        <div class="absolute top-6 right-6 z-20 flex items-center gap-2">
            <span class="bg-indigo-600/90 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg uppercase tracking-wider border border-indigo-500/30">#\${rank} ANIME SPOTLIGHT TOP 10</span>
            <div class="hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                \${dotsHtml}
            </div>
        </div>

        <div class="absolute bottom-8 left-6 sm:left-12 right-6 z-20 max-w-2xl space-y-4">
            <div class="flex items-center gap-3">
                <span class="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-black uppercase tracking-wider">最高 SAIKOU TOP 10</span>
                <span class="text-xs font-bold text-zinc-300 flex items-center gap-1"><i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i> \${score}</span>
                <span class="text-xs font-bold text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">\${epCount} Episodes</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight leading-none drop-shadow-2xl">\${title}</h1>
            <p class="text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed font-medium">\${overview}</p>
            <div class="flex flex-wrap items-center gap-4 pt-2">
                <button onclick="searchAndPlayItem('\${title.replace(/'/g, "\\\\'")}', 'player1', 1)" class="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Ep 1
                </button>
                <button onclick="openAnimeInfo(window._animeCache['\${item.id}'] || { title: '\${title.replace(/'/g, "\\\\'")}', poster: '\${item.coverImage?.large || ''}', score: '\${score}' })" class="px-6 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i> Anime Details
                </button>
            </div>
        </div>
    \`;
    triggerLucide();
}

async function loadAnimeCatalog() {
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
        let animeList = [];
        const data = await fetchAniListGraphQL(gql);
        if (data && data.Page && data.Page.media && data.Page.media.length > 0) {
            animeList = data.Page.media;
        } else {
            const tmdbAnime = await fetchTMDB('discover/tv', { with_genres: '16', with_original_language: 'ja', sort_by: 'popularity.desc' });
            if (tmdbAnime && tmdbAnime.results) {
                animeList = tmdbAnime.results.map(item => ({
                    id: item.id,
                    title: { english: item.name, romaji: item.name },
                    coverImage: { large: item.poster_path ? \`https://image.tmdb.org/t/p/w500\${item.poster_path}\` : '' },
                    bannerImage: item.backdrop_path ? \`https://image.tmdb.org/t/p/original\${item.backdrop_path}\` : '',
                    averageScore: item.vote_average ? item.vote_average * 10 : 85,
                    episodes: item.number_of_episodes || 12,
                    description: item.overview || 'Japanese animated series.',
                    genres: ['Anime']
                }));
            }
        }

        if (!animeList.length) return;

        animeSpotlightSlides = animeList.slice(0, 10);
        renderAnimeSpotlightSlider(0);
        if (animeSpotlightInterval) clearInterval(animeSpotlightInterval);
        animeSpotlightInterval = setInterval(() => {
            if (activeTab === 'anime' && animeSpotlightSlides.length > 0) {
                currentAnimeSlideIndex = (currentAnimeSlideIndex + 1) % animeSpotlightSlides.length;
                renderAnimeSpotlightSlider(currentAnimeSlideIndex);
            }
        }, 7000);

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
            title: a.title?.english || a.title?.romaji || 'Untitled Anime',
            poster_path: a.coverImage?.large,
            vote_average: a.averageScore ? a.averageScore / 10 : 8.5,
            media_type: 'tv'
        })), 'animeTop10Shelf', 'ANIME');

        switchAnimeScheduleDay('today');
    } catch(e) {}
}

function renderAnimeShelf(list, shelfId) {
    const shelf = document.getElementById(shelfId);
    if (!shelf) return;
    shelf.innerHTML = '';

    list.forEach(a => {
        const title = a.title?.english || a.title?.romaji || a.name || "Untitled Anime";
        const poster = a.coverImage?.large || a.poster || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
        const score = a.averageScore ? (a.averageScore / 10).toFixed(1) : '8.5';
        const id = a.id || a.malId || Math.floor(Math.random() * 100000);

        const animeObj = {
            malId: id,
            anilistId: id,
            id: id,
            title: title,
            poster: poster,
            backdrop: a.bannerImage || poster,
            score: score,
            episodes: a.episodes || 12,
            synopsis: a.description || a.synopsis || "Japanese animated series.",
            genres: a.genres || ['Anime']
        };

        window._animeCache[id] = animeObj;

        const card = document.createElement('div');
        card.className = "w-40 sm:w-48 shrink-0 bg-zinc-900/80 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-indigo-500/50 transition-all duration-300 transform hover:scale-105 relative flex flex-col group shadow-xl";
        card.onclick = () => openAnimeInfo(animeObj);

        card.innerHTML = \`
            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                <div class="absolute top-2.5 right-2.5 bg-black/60 px-2.5 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/15 flex items-center gap-1">
                    <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400"></i> \${score}
                </div>
            </div>
            <div class="p-3 bg-zinc-950/90 flex-grow flex flex-col justify-between border-t border-white/5">
                <h3 class="text-xs sm:text-sm font-bold text-white truncate tracking-tight" title="\${title}">\${title}</h3>
                <div class="flex items-center justify-between text-[9px] font-medium text-indigo-400 uppercase tracking-wider mt-1.5">
                    <span>\${a.episodes || '?'} EPS</span>
                    <span class="text-white/80 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">ANIME</span>
                </div>
            </div>
        \`;
        shelf.appendChild(card);
    });
    triggerLucide();
}

async function switchAnimeScheduleDay(day = 'today') {
    document.querySelectorAll('.sched-tab-btn').forEach(btn => {
        btn.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0";
    });
    const activeBtn = document.getElementById(\`schedTab-\${day}\`);
    if (activeBtn) activeBtn.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0";

    const grid = document.getElementById('animeScheduleGrid');
    if (!grid) return;
    grid.innerHTML = \`<div class="col-span-full py-8 text-center text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center justify-center gap-2"><div class="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div> Loading \${day.toUpperCase()} Broadcast Schedule...</div>\`;

    try {
        const now = Math.floor(Date.now() / 1000);
        let dayOffset = 0;
        const dayMap = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };
        if (day !== 'today' && dayMap[day] !== undefined) {
            const currentDay = new Date().getDay();
            dayOffset = (dayMap[day] - currentDay + 7) % 7;
        }
        
        const dayStart = now - (now % 86400) + (dayOffset * 86400);
        const dayEnd = dayStart + 86400;

        const query = \`
            query ($dayStart: Int, $dayEnd: Int) {
                Page(page: 1, perPage: 12) {
                    airingSchedules(airingAt_greater: $dayStart, airingAt_lesser: $dayEnd, sort: TIME_DESC) {
                        airingAt
                        episode
                        media {
                            id
                            title { romaji english }
                            coverImage { large }
                            averageScore
                            episodes
                            genres
                        }
                    }
                }
            }
        \`;
        const res = await fetchAniListGraphQL(query, { dayStart, dayEnd });
        const list = res?.Page?.airingSchedules || [];

        if (!list.length) {
            grid.innerHTML = \`<div class="col-span-full py-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">No scheduled broadcasts for this day</div>\`;
            return;
        }

        grid.innerHTML = '';
        list.forEach(item => {
            const media = item.media;
            if (!media) return;
            const title = media.title?.english || media.title?.romaji || "Airing Anime";
            const poster = media.coverImage?.large || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300';
            const epNum = item.episode || 1;
            const score = media.averageScore ? (media.averageScore / 10).toFixed(1) : '8.5';
            const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');

            const card = document.createElement('div');
            card.className = "bg-zinc-950 border border-white/10 hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer group transition-all transform hover:-translate-y-1 shadow-lg";
            card.onclick = () => searchAndPlayItem(title, 'player1', epNum);

            card.innerHTML = \`
                <div class="aspect-[2/3] relative overflow-hidden bg-black">
                    <img loading="lazy" src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                    <span class="absolute top-2 left-2 bg-indigo-600/90 text-white px-2 py-0.5 rounded text-[8px] font-black uppercase">EP \${epNum} AIRING</span>
                    <div class="absolute top-2 right-2 bg-black/70 px-2 py-0.5 rounded-full text-[9px] font-bold text-amber-400 border border-white/10 flex items-center gap-1">
                        <i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> \${score}
                    </div>
                </div>
                <div class="p-3">
                    <h4 class="text-xs font-bold text-white truncate" title="\${title}">\${title}</h4>
                    <p class="text-[9px] text-indigo-400 font-bold uppercase mt-1">Episode \${epNum} Broadcast</p>
                </div>
            \`;
            grid.appendChild(card);
        });
        triggerLucide();
    } catch(err) {
        grid.innerHTML = \`<div class="col-span-full py-8 text-center text-red-400 text-xs font-bold uppercase">Schedule Error: \${err.message}</div>\`;
    }
}

// ELECTRONIC PROGRAM GUIDE (EPG) ENGINE
async function fetchAndParseEpg() {
    const loadingState = document.getElementById('epgLoadingState');
    const emptyState = document.getElementById('epgEmptyState');
    const guideContainer = document.getElementById('epgGuideContainer');

    if (loadingState) loadingState.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (guideContainer) guideContainer.classList.add('hidden');

    setTimeout(() => {
        renderDemoEpgData();
        if (loadingState) loadingState.classList.add('hidden');
        if (guideContainer) guideContainer.classList.remove('hidden');
    }, 600);
}

function handleEpgProviderChange() {
    fetchAndParseEpg();
}

function renderDemoEpgData() {
    const demoChannels = [
        { id: "ch1", name: "HBO HD", logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150", show: "House of the Dragon", cat: "Movies", time: "8:00 PM - 9:00 PM" },
        { id: "ch2", name: "Sky Sports Main", logo: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=150", show: "Premier League Live", cat: "Sports", time: "8:30 PM - 10:30 PM" },
        { id: "ch3", name: "Discovery HD", logo: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=150", show: "Planet Earth III", cat: "Documentary", time: "9:00 PM - 10:00 PM" },
        { id: "ch4", name: "Anime Central", logo: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=150", show: "Demon Slayer S4", cat: "Anime", time: "9:30 PM - 10:00 PM" }
    ];

    const sidebar = document.getElementById('epgSidebarChannels');
    const body = document.getElementById('epgTimelineBody');
    const badge = document.getElementById('epgChannelsCountBadge');
    const textCount = document.getElementById('epgChannelCountText');

    if (badge) badge.textContent = \`\${demoChannels.length} Live Channels Loaded\`;
    if (textCount) textCount.textContent = demoChannels.length;

    if (sidebar) {
        sidebar.innerHTML = demoChannels.map(c => \`
            <div class="h-16 px-4 flex items-center gap-3 border-b border-white/5 bg-zinc-950/80">
                <div class="w-8 h-8 rounded-lg bg-black border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <img src="\${c.logo}" class="w-full h-full object-cover">
                </div>
                <span class="text-xs font-bold text-white truncate">\${c.name}</span>
            </div>
        \`).join('');
    }

    if (body) {
        body.innerHTML = demoChannels.map(c => \`
            <div class="h-16 flex items-center px-4 border-b border-white/5 relative">
                <div onclick="openEpgProgramModal('\${c.show}', '\${c.name}', '\${c.time}', '\${c.cat}')" class="bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-2">
                    <i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>\${c.show} (\${c.time})</span>
                </div>
            </div>
        \`).join('');
    }

    const cardsGrid = document.getElementById('epgCardsGrid');
    if (cardsGrid) {
        cardsGrid.innerHTML = demoChannels.map(c => \`
            <div class="bg-zinc-950 border border-white/10 p-5 rounded-3xl space-y-3">
                <div class="flex items-center gap-3">
                    <img src="\${c.logo}" class="w-10 h-10 rounded-xl object-cover">
                    <div>
                        <h4 class="text-sm font-bold text-white">\${c.name}</h4>
                        <span class="text-[10px] text-amber-400 font-bold uppercase">\${c.cat}</span>
                    </div>
                </div>
                <div class="bg-white/5 p-3 rounded-2xl border border-white/5">
                    <p class="text-xs font-bold text-white">\${c.show}</p>
                    <p class="text-[10px] text-zinc-400 mt-1 font-mono">\${c.time}</p>
                </div>
                <button onclick="openEpgProgramModal('\${c.show}', '\${c.name}', '\${c.time}', '\${c.cat}')" class="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 text-xs font-bold rounded-xl transition-all">
                    Program Details
                </button>
            </div>
        \`).join('');
    }
    triggerLucide();
}

function toggleEpgView(view) {
    const timeline = document.getElementById('epgTimelineViewContainer');
    const cards = document.getElementById('epgCardsGrid');
    const btnTimeline = document.getElementById('epgViewBtnTimeline');
    const btnCards = document.getElementById('epgViewBtnCards');

    if (view === 'timeline') {
        if (timeline) timeline.classList.remove('hidden');
        if (cards) cards.classList.add('hidden');
        if (btnTimeline) btnTimeline.className = "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-white shadow-lg transition-all flex items-center gap-1.5";
        if (btnCards) btnCards.className = "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all flex items-center gap-1.5";
    } else {
        if (timeline) timeline.classList.add('hidden');
        if (cards) cards.classList.remove('hidden');
        if (btnTimeline) btnTimeline.className = "px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition-all flex items-center gap-1.5";
        if (btnCards) btnCards.className = "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-black bg-white shadow-lg transition-all flex items-center gap-1.5";
    }
}

function openEpgProgramModal(title, chName, time, cat) {
    const modal = document.getElementById('epgProgramModal');
    if (!modal) return;

    document.getElementById('epgModalTitle').textContent = title;
    document.getElementById('epgModalChannel').innerHTML = \`<i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400"></i> \${chName}\`;
    document.getElementById('epgModalTime').textContent = time;
    document.getElementById('epgModalCategory').textContent = cat;
    document.getElementById('epgModalDesc').textContent = \`Live program broadcast on \${chName}.\`;

    const playBtnContainer = document.getElementById('epgModalPlayBtnContainer');
    if (playBtnContainer) {
        playBtnContainer.innerHTML = \`
            <button onclick="closeEpgProgramModal(); searchAndPlayItem('\${title}', 'player1')" class="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2">
                <i data-lucide="play" class="w-4 h-4 fill-black"></i> Tune to Channel
            </button>
        \`;
    }

    handleModalOpen(modal);
    triggerLucide();
}

function closeEpgProgramModal() {
    const modal = document.getElementById('epgProgramModal');
    if (modal) handleModalClose(modal);
}

function closeEpgChannelModal() {
    const modal = document.getElementById('epgChannelModal');
    if (modal) handleModalClose(modal);
}

function closeTrailerPopup() {
    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    if (iframe) iframe.src = '';
    if (modal) handleModalClose(modal);
}

function playSelectedTrailer() {
    if (!selectedMedia) return;
    const modal = document.getElementById('trailerModal');
    const iframe = document.getElementById('trailerIframe');
    const title = selectedMedia.title || selectedMedia.name || "";
    if (iframe) iframe.src = \`https://www.youtube.com/embed?listType=search&list=\${encodeURIComponent(title + " official trailer")}&autoplay=1\`;
    if (modal) handleModalOpen(modal);
}

window.addEventListener('DOMContentLoaded', () => {
    initApp();
});
</script>
</body>
</html>`;

const finalCompleteCode = htmlContent + '\n' + masterJsEngine;
const targetPath = path.join(__dirname, '..', 'consumet.html');
fs.writeFileSync(targetPath, finalCompleteCode, 'utf8');
console.log('Successfully rebuilt consumet.html with complete features, file size:', finalCompleteCode.length);
