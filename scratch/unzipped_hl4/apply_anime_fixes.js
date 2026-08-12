const fs = require('fs');

let html = fs.readFileSync('consumet.html', 'utf8');

// 1. New loadAnimeTop10 and updated loadAnimeHomeData
const newAnimeHomeCode = `        async function loadAnimeHomeData() {
            try {
                // 1. Load Broadcast Schedule
                loadAnimeSchedule('today');

                // 2. Load Top 10 Anime Today
                loadAnimeTop10();

                // 3. Load Live Anime Channels
                if (typeof loadLiveAnimeChannels === 'function') {
                    loadLiveAnimeChannels();
                }

                // 4. Trending Anime
                const trendingData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                const trending = trendingData.results || [];
                
                // Render Spotlight
                renderAnimeSpotlight(trending.slice(0, 5));
                
                // Render Trending Shelf
                renderAnimeShelf(trending, 'animeTrendingShelf');
                
                // Render Timelines
                if (typeof renderTimelines === 'function') {
                    renderTimelines('animeTimelinesContainer', animeTimelines);
                    renderTimelines('homeTimelinesContainer', homeTimelines);
                }

                // 5. Shonen / Action Anime
                const shonenData = await fetchTMDB('discover/tv', {
                    with_genres: '16,10759',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(shonenData.results || [], 'animeShonenShelf');
                
                // 6. Top Rated Anime Masterpieces
                const topRatedData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 100,
                    page: 1
                });
                renderAnimeShelf(topRatedData.results || [], 'animeTopRatedShelf');

                // 7. Sci-Fi & Cyberpunk Mecha Anime
                const sciFiData = await fetchTMDB('discover/tv', {
                    with_genres: '16,10765',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(sciFiData.results || [], 'animeSciFiShelf');

                // 8. Slice of Life & Comedy Anime
                const comedyData = await fetchTMDB('discover/tv', {
                    with_genres: '16,35',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(comedyData.results || [], 'animeComedyShelf');

                // 9. Legendary Anime Movies
                const moviesData = await fetchTMDB('discover/movie', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(moviesData.results || [], 'animeMoviesShelf', 'movie');
                
                // 10. Dark Fantasy & Supernatural Anime
                const darkFantasyData = await fetchTMDB('discover/tv', {
                    with_genres: '16,9648',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(darkFantasyData.results || [], 'animeDarkFantasyShelf');

                // 11. Romance & Drama Masterpieces
                const romanceData = await fetchTMDB('discover/tv', {
                    with_genres: '16,18',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(romanceData.results || [], 'animeRomanceShelf');

                // 12. Classic Retro Masterpieces
                const retroData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'first_air_date.lte': '2010-12-31',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(retroData.results || [], 'animeRetroShelf');
                
            } catch(e) {
                console.error("Anime Home fetch failed", e);
            }
        }

        async function loadAnimeTop10() {
            const shelf = document.getElementById('animeTop10Shelf');
            if (!shelf) return;
            shelf.innerHTML = '<div class="py-8 w-full text-center text-zinc-400 font-bold text-xs"><i data-lucide="loader-2" class="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400"></i>Loading Top 10 Anime...</div>';
            if (window.lucide) lucide.createIcons();

            try {
                const res = await fetch('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        renderAnimeTop10Grid(data.data);
                        return;
                    }
                }
            } catch(e) {
                console.warn("Jikan Top 10 fetch failed, using fallback", e);
            }

            // Fallback TMDB
            try {
                const data = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeTop10Grid((data.results || []).slice(0, 10));
            } catch(e) {
                shelf.innerHTML = '<div class="py-4 text-xs text-zinc-500 uppercase">Top 10 Unavailable</div>';
            }
        }

        function renderAnimeTop10Grid(items) {
            const shelf = document.getElementById('animeTop10Shelf');
            if (!shelf) return;
            shelf.innerHTML = '';
            
            items.slice(0, 10).forEach((item, index) => {
                const rank = index + 1;
                const title = item.title_english || item.title || item.name || "Top Anime";
                let poster = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url;
                if (!poster && item.poster_path) poster = \`https://image.tmdb.org/t/p/w300\${item.poster_path}\`;
                if (!poster) poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
                
                const score = item.score ? item.score.toFixed(1) : (item.vote_average ? item.vote_average.toFixed(1) : '8.8');
                const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');

                const card = document.createElement('div');
                card.className = "relative w-48 sm:w-56 shrink-0 bg-zinc-900/90 rounded-2xl overflow-hidden cursor-pointer border border-white/10 group hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-1.5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col";
                
                if (item.poster_path && item.id && typeof item.id === 'number') {
                    card.onclick = () => openDetails(item.id, 'tv');
                } else {
                    card.onclick = () => searchAndPlayItem(title);
                }
                
                card.innerHTML = \`
                    <div class="relative aspect-[16/10] overflow-hidden bg-black">
                        <img src="\${poster}" alt="\${safeTitle}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90">
                        <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>
                        <div class="absolute bottom-1 left-2 text-5xl font-black italic text-white/90 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tighter z-10 flex items-baseline">
                            <span class="text-indigo-500 text-2xl not-italic mr-0.5">#</span>\${rank}
                        </div>
                        <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-black text-amber-400 border border-white/10 flex items-center gap-1">
                            <i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-400"></i> \${score}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <h3 class="text-xs font-bold text-white truncate" title="\${safeTitle}">\${title}</h3>
                        <p class="text-[10px] text-zinc-400 mt-1 flex items-center justify-between">
                            <span class="text-indigo-400 font-extrabold uppercase">🔥 Top #\${rank} Today</span>
                            <span class="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.5 rounded text-[8px]">Airing</span>
                        </p>
                    </div>
                \`;
                shelf.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }`;

// Replace old loadAnimeHomeData
html = html.replace(/async function loadAnimeHomeData\(\) \{[\s\S]*?\}\n\n        window\.animeSpotlightTrailerPlaying/, newAnimeHomeCode + "\n\n        window.animeSpotlightTrailerPlaying");

fs.writeFileSync('consumet.html', html);
console.log("Updated loadAnimeHomeData and loadAnimeTop10!");
