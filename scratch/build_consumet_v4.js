const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Ensure logo uses /stalker_pro_logo.png
html = html.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
html = html.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');

// 1. HOME SPOTLIGHT SLIDER WITH TOP 10 CONTENTS & CAROUSEL DOTS
const homeSpotlightCode = `
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
        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent"></div>

        <!-- Top 10 Spotlight Badge & Carousel Dots -->
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
}
`;

// Replace old loadHomeSpotlight and renderSpotlightSlider
const startSpotlightIdx = html.indexOf('let spotlightSlides = [];');
const endSpotlightIdx = html.indexOf('function renderShelfGrid', startSpotlightIdx);
if (startSpotlightIdx !== -1 && endSpotlightIdx !== -1) {
    html = html.substring(0, startSpotlightIdx) + homeSpotlightCode + '\n\n' + html.substring(endSpotlightIdx);
}

// 2. ANIME SPOTLIGHT SLIDER WITH TOP 10 CONTENTS & ANIME SCHEDULE ENGINE
const animeSpotlightAndScheduleCode = `
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

// Anime Release Radar Scheduler Engine
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
`;

// Replace loadAnimeCatalog to set animeSpotlightSlides Top 10 and trigger switchAnimeScheduleDay('today')
const animeCatalogCode = `
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

        // Top 10 Anime Spotlight Slider
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

        // Load today's release schedule
        switchAnimeScheduleDay('today');
    } catch(e) {}
}
`;

const animeFnStart = html.indexOf('async function loadAnimeCatalog()');
const animeFnEnd = html.indexOf('function renderAnimeShelf', animeFnStart);
if (animeFnStart !== -1 && animeFnEnd !== -1) {
    html = html.substring(0, animeFnStart) + animeSpotlightAndScheduleCode + '\n\n' + animeCatalogCode + '\n\n' + html.substring(animeFnEnd);
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated consumet.html v4 with Top 10 Spotlights and Anime Scheduler');
