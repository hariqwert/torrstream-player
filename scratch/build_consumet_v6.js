const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Ensure logo uses /stalker_pro_logo.png
html = html.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
html = html.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');

// 1. RE-ORDER HOME VIEW (#view-home): Place Top 10 Today Shelf directly UNDER #heroSliderContainer
const homeViewStart = html.indexOf('<section id="view-home"');
const homeViewEnd = html.indexOf('</section>', homeViewStart);

if (homeViewStart !== -1 && homeViewEnd !== -1) {
    let homeHtml = html.substring(homeViewStart, homeViewEnd);

    // Extract Top 10 block if found
    const top10Start = homeHtml.indexOf('<!-- Top 10 Today Shelf -->');
    let top10Block = '';
    if (top10Start !== -1) {
        const top10End = homeHtml.indexOf('<!-- Continue Watching Shelf -->', top10Start);
        if (top10End !== -1) {
            top10Block = homeHtml.substring(top10Start, top10End);
            // Remove from original location
            homeHtml = homeHtml.substring(0, top10Start) + homeHtml.substring(top10End);
        }
    }

    // Insert Top 10 block right after heroSliderContainer
    const heroSliderEnd = homeHtml.indexOf('</div>', homeHtml.indexOf('id="heroSliderContainer"')) + 6;
    if (heroSliderEnd !== -1 && top10Block) {
        homeHtml = homeHtml.substring(0, heroSliderEnd) + '\n\n' + top10Block + '\n\n' + homeHtml.substring(heroSliderEnd);
        html = html.substring(0, homeViewStart) + homeHtml + html.substring(homeViewEnd);
    }
}

// 2. UPDATE SPOTLIGHT RENDERERS TO INCLUDE "Watch Trailer", "Watch Now", and "View Info" BUTTONS
const updatedSpotlightRenderers = `
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

    selectedMedia = item;
    selectedMedia.media_type = type;

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
            <div class="flex flex-wrap items-center gap-3 pt-2">
                <button onclick="openDetails('\${item.id}', '\${type}')" class="px-7 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-red-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="play" class="w-4 h-4 fill-white"></i> Watch Now
                </button>
                <button onclick="playSelectedTrailer()" class="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="film" class="w-4 h-4 text-white"></i> Watch Trailer
                </button>
                <button onclick="openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="download-cloud" class="w-4 h-4 text-white"></i> ⚡ Torrent Stream
                </button>
                <button onclick="openDetails('\${item.id}', '\${type}')" class="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-amber-400"></i> View Info
                </button>
            </div>
        </div>
    \`;
    triggerLucide();
    updateSpotlightBackgroundTrailer('heroSliderContainer', item, type);
}

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

    selectedMedia = { id: item.id || 99901, title: title, name: title, media_type: 'tv' };

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
            <div class="flex flex-wrap items-center gap-3 pt-2">
                <button onclick="searchAndPlayItem('\${title.replace(/'/g, "\\\\'")}', 'player1', 1)" class="px-7 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-indigo-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Ep 1
                </button>
                <button onclick="playSelectedTrailer()" class="px-6 py-3.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-purple-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="film" class="w-4 h-4 text-white"></i> Watch Trailer
                </button>
                <button onclick="openTorrentPlayerForItem('\${title.replace(/'/g, "\\\\'")}')" class="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 transform active:scale-95 transition-all">
                    <i data-lucide="download-cloud" class="w-4 h-4 text-white"></i> ⚡ Torrent Stream
                </button>
                <button onclick="openAnimeInfo(window._animeCache['\${item.id}'] || { title: '\${title.replace(/'/g, "\\\\'")}', poster: '\${item.coverImage?.large || ''}', score: '\${score}' })" class="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2">
                    <i data-lucide="info" class="w-4 h-4 text-indigo-400"></i> Anime Details
                </button>
            </div>
        </div>
    \`;
    triggerLucide();
}

function openTorrentPlayerForItem(title) {
    showToast("Opening BitTorrent Swarm Stream for " + title + "...");
    window.location.href = "/?play=" + encodeURIComponent(title);
}
`;

const origSpotlightStart = html.indexOf('function renderSpotlightSlider(index = 0) {');
const origSpotlightEnd = html.indexOf('// Preload configs and launch', origSpotlightStart);
if (origSpotlightStart !== -1 && origSpotlightEnd !== -1) {
    html = html.substring(0, origSpotlightStart) + updatedSpotlightRenderers + '\n\n' + html.substring(origSpotlightEnd);
}

// 3. UPDATE renderShelfGrid TO INCLUDE A QUICK ⚡ TORRENT STREAM BUTTON ON THUMBNAIL HOVER
const updatedRenderShelfGrid = `
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
        const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');

        const card = document.createElement('div');
        card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform md:group-hover:-translate-y-1.5 hover:scale-105 hover:border-white/30 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-white/10";
        card.onclick = () => openDetails(item.id, type);
        
        card.innerHTML = \`
            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                <img loading="lazy" src="\${poster}" alt="\${title}" class="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500">
                
                <!-- Quick Torrent Stream Button Badge on Hover -->
                <button onclick="event.stopPropagation(); openTorrentPlayerForItem('\${safeTitle}')" title="Stream via BitTorrent P2P Engine" class="absolute top-2.5 left-2.5 z-20 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white px-2 py-0.5 rounded-full border border-emerald-400/40 shadow-xl flex items-center gap-1 backdrop-blur-md transition-all duration-200 hover:scale-105">
                    <i data-lucide="download-cloud" class="w-3 h-3 text-white"></i>
                    <span class="text-[8px] font-black uppercase tracking-wider text-white">⚡ Torrent</span>
                </button>

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
`;

const origShelfGridStart = html.indexOf('function renderShelfGrid(items, elementId, defaultType = \'movie\') {');
const origShelfGridEnd = html.indexOf('function scrollShelf(', origShelfGridStart);
if (origShelfGridStart !== -1 && origShelfGridEnd !== -1) {
    html = html.substring(0, origShelfGridStart) + updatedRenderShelfGrid + '\n\n' + html.substring(origShelfGridEnd);
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Successfully updated consumet.html v6 with Top 10 order, Spotlight Trailer buttons, and Torrent Stream Engine triggers');
