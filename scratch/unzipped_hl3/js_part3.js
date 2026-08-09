    <script>
        // Global App State
        let TMDB_KEY = "844dba0bfd8f3a231a957b6e07a10be8";
        let activeTab = 'home';
        let currentSearchQuery = '';
        let searchTimeout = null;
        let selectedMedia = null;
        let selectedSeason = 1;
        let selectedEpisode = 1;
        let currentServer = 'vidlink';
        
        let moviesPage = 1;
        let tvPage = 1;
        let moviesList = [];
        let tvList = [];
        window.allSportsChannels = [];

        // 4K Anime backgrounds for rotation every 30s
        const animeBackgrounds = [
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2560", // Anime store neon
            "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=2560", // Cyberpunk anime city
            "https://images.unsplash.com/photo-1541562232579-512a21360020?q=80&w=2560", // Japan street sunset
            "https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2560", // Pagoda Mt Fuji night
            "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?q=80&w=2560", // Tokyo neon night
            "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=2560", // Kyoto traditional alley
            "https://images.unsplash.com/photo-1571757767119-68b8dbed8c97?q=80&w=2560", // Shinto shrine cherry blossoms
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2560"  // Stars night sky fantasy
        ];
        let currentAnimeBgIndex = 0;
        let animeBgInterval = null;

        // Preload configs and launch
        async function initApp() {
            try {
                // Fetch optional TMDB key from backend configs if set up
                const configRes = await fetch('/api/consumet/config').catch(() => null);
                if (configRes && configRes.ok) {
                    const data = await configRes.json();
                    if (data.TMDB_API_KEY) TMDB_KEY = data.TMDB_API_KEY;
                }
            } catch(e){}

            // Register Hotkey (Cmd+K / Ctrl+K)
            document.addEventListener('keydown', (e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                    e.preventDefault();
                    openSearchPalette();
                }
                if (e.key === 'Escape') {
                    closeSearchPalette();
                    closeDetailsModal();
                }
            });

            // Enter key search handler on searchInput
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const query = searchInput.value.trim();
                        if (query) {
                            if (query.includes('imdb.com') || query.match(/tt\d{7,10}/)) {
                                closeSearchPalette();
                                resolveAndPlayIMDb(query);
                            } else {
                                closeSearchPalette();
                                launchTabSearch(query);
                            }
                        }
                    }
                });
            }

            // Load all sections
            // Hide loader instantly
            document.getElementById('mainLoader').classList.add('hidden');
            switchTab('home');
            initAutoTrailerDetection();

            // Load EVERYTHING in background concurrently for blazing fast feel
            // Load in a cascading manner to prevent TMDB API rate-limiting
            loadHomeSpotlight().then(() => {
                setTimeout(() => loadTrendingMovies(), 200);
                setTimeout(() => loadPopularSeries(), 400);
                setTimeout(() => loadTopRatedMasterpieces(), 600);
                setTimeout(() => loadAsianDramaAndAnime(), 800);
                setTimeout(() => loadSportsChannels(), 1000);
                setTimeout(() => {
                    loadAnimeCatalog().then(() => lucide.createIcons());
                }, 1200);
            });

            setInterval(() => { refreshAllData(true); }, 15 * 60 * 1000);
        }

        async function refreshAllData(silent = false) {
            await Promise.all([
                loadHomeSpotlight(),
                loadTrendingMovies(),
                loadPopularSeries(),
                loadTopRatedMasterpieces(),
                loadAsianDramaAndAnime(),
                loadSportsChannels(),
                loadAnimeCatalog()
            ]);
            if (silent) lucide.createIcons();
        }

        function startAnimeBgRotation() {
            if (animeBgInterval) clearInterval(animeBgInterval);
            animeBgInterval = setInterval(() => {
                if (activeTab === 'anime') {
                    currentAnimeBgIndex = (currentAnimeBgIndex + 1) % animeBackgrounds.length;
                    const nextBg = animeBackgrounds[currentAnimeBgIndex];
                    document.body.style.transition = "background-image 1.5s ease-in-out";
                    document.body.style.backgroundImage = `radial-gradient(circle at center, rgba(5, 7, 10, 0.45), rgba(5, 7, 10, 1)), url('${nextBg}')`;
                }
            }, 30000); // 30 seconds
        }

        // Automatic Detection and Pause for Spotlight Trailers
        function stopSpotlightTrailers() {
            if (typeof spotlightSlides !== 'undefined' && Array.isArray(spotlightSlides)) {
                spotlightSlides.forEach(item => {
                    const trailerEl = document.getElementById(`spotlightTrailerBg-${item.id}`);
                    const staticBg = document.getElementById(`spotlightStaticBg-${item.id}`);
                    const muteBtn = document.getElementById(`spotlightMuteBtn-${item.id}`);
                    if (trailerEl) {
                        trailerEl.innerHTML = '';
                        trailerEl.classList.add('opacity-0');
                        trailerEl.classList.remove('opacity-100');
                        if (staticBg) staticBg.classList.remove('opacity-0');
                        if (muteBtn) muteBtn.classList.add('hidden');
                    }
                });
            }
            if (typeof animeSpotlightSlides !== 'undefined' && Array.isArray(animeSpotlightSlides)) {
                animeSpotlightSlides.forEach(item => {
                    const trailerEl = document.getElementById(`animeSpotlightTrailerBg-${item.id}`);
                    const staticBg = document.getElementById(`animeStaticBg-${item.id}`);
                    const muteBtn = document.getElementById(`animeSpotlightMuteBtn-${item.id}`);
                    if (trailerEl) {
                        trailerEl.innerHTML = '';
                        trailerEl.classList.add('opacity-0');
                        trailerEl.classList.remove('opacity-100');
                        if (staticBg) staticBg.classList.remove('opacity-0');
                        if (muteBtn) muteBtn.classList.add('hidden');
                    }
                });
            }
            window.spotlightTrailerPlaying = false;
            window.animeSpotlightTrailerPlaying = false;
        }

        function pauseSpotlightTrailer() {
            if (typeof spotlightSlides !== 'undefined' && Array.isArray(spotlightSlides)) {
                spotlightSlides.forEach(item => {
                    const iframe = document.getElementById(`spotlightIframe-${item.id}`);
                    if (iframe && iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'pauseVideo',
                                args: []
                            }), '*');
                        } catch(e){}
                    }
                });
            }
            if (typeof animeSpotlightSlides !== 'undefined' && Array.isArray(animeSpotlightSlides)) {
                animeSpotlightSlides.forEach(item => {
                    const iframe = document.getElementById(`animeSpotlightIframe-${item.id}`);
                    if (iframe && iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'pauseVideo',
                                args: []
                            }), '*');
                        } catch(e){}
                    }
                });
            }
        }

        function playSpotlightTrailer() {
            if (typeof spotlightSlides !== 'undefined' && Array.isArray(spotlightSlides)) {
                spotlightSlides.forEach(item => {
                    const iframe = document.getElementById(`spotlightIframe-${item.id}`);
                    if (iframe && iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'playVideo',
                                args: []
                            }), '*');
                        } catch(e){}
                    }
                });
            }
            if (typeof animeSpotlightSlides !== 'undefined' && Array.isArray(animeSpotlightSlides)) {
                animeSpotlightSlides.forEach(item => {
                    const iframe = document.getElementById(`animeSpotlightIframe-${item.id}`);
                    if (iframe && iframe.contentWindow) {
                        try {
                            iframe.contentWindow.postMessage(JSON.stringify({
                                event: 'command',
                                func: 'playVideo',
                                args: []
                            }), '*');
                        } catch(e){}
                    }
                });
            }
        }

        // Visibility Change Handler (Pause on Tab Switch / Unfocus)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseSpotlightTrailer();
                const detailsIframe = document.getElementById('trailerBgIframe');
                if (detailsIframe && detailsIframe.contentWindow) {
                    try {
                        detailsIframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func: 'pauseVideo',
                            args: []
                        }), '*');
                    } catch(e){}
                }
            } else {
                if (activeTab === 'home') {
                    playSpotlightTrailer();
                }
            }
        });

        // Scroll Detector (Pause Spotlight Trailer when Scrolled Out)
        function initAutoTrailerDetection() {
            const heroSlider = document.getElementById('heroSliderContainer');
            if (heroSlider && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (!entry.isIntersecting) {
                            pauseSpotlightTrailer();
                        } else {
                            if (activeTab === 'home' && window.spotlightTrailerPlaying) {
                                playSpotlightTrailer();
                            }
                        }
                    });
                }, { threshold: 0.15 });
                observer.observe(heroSlider);
            }
        }

        // Tab Switcher
        function switchTab(tab) {
            // Automatically close open details modals and stop trailers when switching tabs/pages
            if (typeof closeDetailsModal === 'function') {
                closeDetailsModal();
            }

            activeTab = tab;
            const views = ['home', 'movies', 'tv', 'anime', 'sports', 'channels', 'watchlist', 'search', 'player', 'epg'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (el) el.classList.add('hidden');
                
                // Desktop styling
                const tabBtn = document.getElementById(`tab-${v}`);
                if (tabBtn) {
                    if (v === 'epg') {
                        tabBtn.className = "hover:text-white transition-all pb-1 border-b-2 " + (v === tab ? "text-white border-amber-500 font-extrabold" : "text-slate-400 border-transparent");
                    } else if (v === 'channels') {
                        tabBtn.className = "hover:text-white transition-all pb-1 border-b-2 " + (v === tab ? "text-white border-emerald-500 font-extrabold" : "text-slate-400 border-transparent");
                    } else {
                        tabBtn.className = "hover:text-white transition-all pb-1 border-b-2 " + (v === tab ? "text-white border-red-600 font-extrabold" : "text-slate-400 border-transparent");
                    }
                }
                
                // Mobile styling
                const mobBtn = document.getElementById(`mob-tab-${v}`);
                if (mobBtn) {
                    if (v === 'epg') {
                        mobBtn.className = "flex flex-col items-center justify-center gap-1 " + (v === tab ? "text-amber-500 scale-105" : "text-slate-400");
                    } else if (v === 'channels') {
                        mobBtn.className = "flex flex-col items-center justify-center gap-1 " + (v === tab ? "text-emerald-500 scale-105" : "text-slate-400");
                    } else {
                        mobBtn.className = "flex flex-col items-center justify-center gap-1 " + (v === tab ? "text-red-500 scale-105" : "text-slate-400");
                    }
                }
            });

            // Handle Dynamic Background for Anime, Channels, and Home Sections
            if (tab === 'anime') {
                const currentBg = animeBackgrounds[currentAnimeBgIndex];
                document.body.style.transition = "background-image 1.5s ease-in-out";
                document.body.style.backgroundImage = `radial-gradient(circle at center, rgba(5, 7, 10, 0.45), rgba(5, 7, 10, 1)), url('${currentBg}')`;
                document.body.style.backgroundAttachment = "fixed";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
                startAnimeBgRotation();
            } else if (tab === 'sports') {
                loadSportsChannels();
                if (typeof renderUserCustomSportsChips === 'function') renderUserCustomSportsChips();
            } else if (tab === 'channels') {
                if (typeof loadAllChannelsDirectory === 'function') loadAllChannelsDirectory();
                document.body.style.transition = "background-image 1.5s ease-in-out";
                document.body.style.backgroundImage = `radial-gradient(circle at top center, rgba(16, 185, 129, 0.20), rgba(5, 7, 10, 0.95) 75%), url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000')`;
                document.body.style.backgroundAttachment = "fixed";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            } else if (tab === 'epg') {
                if (!window.epgLoadedOnce) {
                    window.epgLoadedOnce = true;
                    setTimeout(() => {
                        fetchAndParseEpg();
                    }, 200);
                }
                document.body.style.transition = "background-image 1.5s ease-in-out";
                document.body.style.backgroundImage = `radial-gradient(circle at top center, rgba(245, 158, 11, 0.15), rgba(5, 7, 10, 0.95) 75%), url('https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=2000')`;
                document.body.style.backgroundAttachment = "fixed";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            } else if (tab === 'home' && typeof spotlightSlides !== 'undefined' && spotlightSlides.length > 0) {
                const item = spotlightSlides[currentSlideIndex];
                if (item && item.backdrop_path) {
                    const backdrop = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;
                    document.body.style.transition = "background-image 1.5s ease-in-out";
                    document.body.style.backgroundImage = `radial-gradient(circle at center, rgba(5, 7, 10, 0.75), rgba(5, 7, 10, 1)), url('${backdrop}')`;
                    document.body.style.backgroundAttachment = "fixed";
                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                }
                if (animeBgInterval) {
                    clearInterval(animeBgInterval);
                    animeBgInterval = null;
                }
            } else {
                document.body.style.backgroundImage = "none";
                if (animeBgInterval) {
                    clearInterval(animeBgInterval);
                    animeBgInterval = null;
                }
            }

            // Automatic spotlight trailer cleanup when navigating away from home
            if (tab !== 'home') {
                stopSpotlightTrailers();
            }

            const targetView = document.getElementById(`view-${tab}`);
            if (targetView) targetView.classList.remove('hidden');
            if (tab === 'watchlist') renderWatchlist();
            if (tab === 'movies') loadMoviesHomeData();
            if (tab === 'tv') loadTvHomeData();
            if (tab === 'anime') loadAnimeCatalog();
            lucide.createIcons();
        }

        // Helpers for dynamic API requests
        async function fetchTMDB(endpoint, params = {}) {
            try {
                const query = new URLSearchParams({ api_key: TMDB_KEY, ...params }).toString();
                const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${query}`);
                if (!res.ok) throw new Error("TMDB call failed");
                return await res.json();
            } catch (err) {
                console.warn("TMDB Fetch Failed, using fallback data for " + endpoint);
                // Return dummy placeholder data so the UI doesn't break
                return {
                    results: [
                        {
                            id: 99991,
                            title: "Network Error: Anime Catalog Unavailable",
                            name: "Network Error: Anime Catalog Unavailable",
                            poster_path: null,
                            vote_average: 0,
                            release_date: "2024-01-01",
                            first_air_date: "2024-01-01",
                            media_type: "tv"
                        },
                        {
                            id: 99992,
                            title: "Please check your TMDB API Key",
                            name: "Please check your TMDB API Key",
                            poster_path: null,
                            vote_average: 0,
                            release_date: "2024-01-01",
                            first_air_date: "2024-01-01",
                            media_type: "tv"
                        }
                    ]
                };
            }
        }

        // Shelf Rendering Helper
        function renderShelfGrid(items, elementId, defaultType = 'movie') {
            const shelf = document.getElementById(elementId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            items.forEach(item => {
                const title = item.title || item.name || "Untitled";
                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                const type = item.media_type || defaultType;

                const card = document.createElement('div');
                card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group";
                card.onclick = () => openDetails(item.id, type);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            <span>${year}</span>
                            <span class="text-indigo-400 font-extrabold">${type === 'tv' ? 'Series' : 'Movie'}</span>
                        </div>
                    </div>
                `;
                shelf.appendChild(card);
            });
            
            // Check continue watching shelf state
            if (elementId === 'continueWatchGrid') {
                const shelfContainer = document.getElementById('continueWatchShelf');
                if (items.length > 0) shelfContainer.classList.remove('hidden');
                else shelfContainer.classList.add('hidden');
            }
        }

        // Horizontal scrolling for carousels
        function scrollShelf(shelfId, direction) {
            const shelf = document.getElementById(shelfId);
            if (!shelf) return;
            const scrollAmt = direction === 'left' ? -350 : 350;
            shelf.scrollBy({ left: scrollAmt, behavior: 'smooth' });
        }

        // Fetch multiple specific movie IDs in parallel
        async function fetchMultipleMovies(ids) {
            const promises = ids.map(async (id) => {
                try {
                    return await fetchTMDB(`movie/${id}`);
                } catch (err) {
                    console.warn(`Failed to fetch TMDB movie ${id}`, err);
                    return null;
                }
            });
            const results = await Promise.all(promises);
            return results.filter(item => item !== null);
        }

        // Premium Shelf Rendering Helper (Larger cards and stunning glows!)
        function renderPremiumShelfGrid(items, elementId, defaultType = 'movie', theme = 'marvel') {
            const shelf = document.getElementById(elementId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            // Define theme specific glow, border and colors
            let borderClass = "hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]";
            let starColor = "text-red-500 fill-red-500";
            if (theme === 'dc') {
                borderClass = "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)]";
                starColor = "text-blue-500 fill-blue-500";
            } else if (theme === 'potter') {
                borderClass = "hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.25)]";
                starColor = "text-violet-500 fill-violet-500";
            }

            items.forEach(item => {
                if (!item) return;
                const title = item.title || item.name || "Untitled";
                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w400${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                const type = item.media_type || defaultType;

                const card = document.createElement('div');
                // Made slightly bigger with w-40 sm:w-52 to make them highly attractive!
                card.className = `w-40 sm:w-52 shrink-0 bg-zinc-950/90 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-all duration-500 transform hover:scale-105 active:scale-95 relative flex flex-col group ${borderClass} shadow-xl`;
                card.onclick = () => openDetails(item.id, type);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
                        <div class="absolute top-3 right-3 bg-black/85 px-2 py-0.5 rounded-lg text-[10px] font-black border border-white/15 flex items-center gap-0.5 shadow-md text-white">
                            <i data-lucide="star" class="w-3 h-3 ${starColor}"></i> <span>${rating}</span>
                        </div>
                    </div>
                    <div class="p-3.5 bg-zinc-950/95 flex-grow flex flex-col justify-between border-t border-white/5">
                        <h3 class="text-xs sm:text-sm font-black text-white group-hover:text-white transition-colors truncate uppercase tracking-tight" title="${title}">${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1.5">
                            <span>${year}</span>
                            <span class="text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded-md border border-indigo-500/15">${type === 'tv' ? 'Series' : 'Movie'}</span>
                        </div>
                    </div>
                `;
                shelf.appendChild(card);
            });
            lucide.createIcons();
        }

        async function loadTrendingMovies() {
            try {
                const data = await fetchTMDB('movie/popular');
                moviesList = data.results;
                renderShelfGrid(moviesList, 'trendingMoviesShelf', 'movie');
                renderFilterGrid(moviesList, 'moviesGrid', 'movie');
            } catch(e) {}
        }

        async function loadPopularSeries() {
            try {
                const data = await fetchTMDB('tv/popular');
                tvList = data.results;
                renderShelfGrid(tvList, 'trendingSeriesShelf', 'tv');
                renderFilterGrid(tvList, 'tvGrid', 'tv');
            } catch(e) {}
        }

        async function loadTopRatedMasterpieces() {
            try {
                const data = await fetchTMDB('movie/top_rated');
                renderShelfGrid(data.results.slice(0, 15), 'topRatedShelf', 'movie');
            } catch(e) {}
        }

        async function loadAsianDramaAndAnime() {
            try {
                // Fetch animations & drama mixed
                const data = await fetchTMDB('discover/movie', { with_genres: '16', sort_by: 'popularity.desc' });
                renderShelfGrid(data.results.slice(0, 15), 'animeShelf', 'movie');
            } catch(e) {}
        }

        let moviesHomeLoaded = false;
        async function loadMoviesHomeData() {
            if (moviesHomeLoaded) return;
            try {
                // 1. Action Blockbusters
                const actionData = await fetchTMDB('discover/movie', { with_genres: '28', sort_by: 'popularity.desc' });
                renderShelfGrid(actionData.results || [], 'movieActionShelf', 'movie');
                
                // 2. Sci-Fi & Fantasy
                const sciFiData = await fetchTMDB('discover/movie', { with_genres: '878', sort_by: 'popularity.desc' });
                renderShelfGrid(sciFiData.results || [], 'movieSciFiShelf', 'movie');

                // 3. Comedies
                const comedyData = await fetchTMDB('discover/movie', { with_genres: '35', sort_by: 'popularity.desc' });
                renderShelfGrid(comedyData.results || [], 'movieComedyShelf', 'movie');

                // 4. Thrillers
                const thrillerData = await fetchTMDB('discover/movie', { with_genres: '53', sort_by: 'popularity.desc' });
                renderShelfGrid(thrillerData.results || [], 'movieThrillerShelf', 'movie');

                moviesHomeLoaded = true;
            } catch(e) {
                console.error("Failed to load movies home data", e);
            }
        }

        let tvHomeLoaded = false;
        async function loadTvHomeData() {
            if (tvHomeLoaded) return;
            try {
                // 1. Crime & Suspense
                const crimeData = await fetchTMDB('discover/tv', { with_genres: '80', sort_by: 'popularity.desc' });
                renderShelfGrid(crimeData.results || [], 'tvCrimeShelf', 'tv');
                
                // 2. Sci-Fi & Fantasy TV
                const sciFiData = await fetchTMDB('discover/tv', { with_genres: '10765', sort_by: 'popularity.desc' });
                renderShelfGrid(sciFiData.results || [], 'tvSciFiShelf', 'tv');

                // 3. TV Comedies
                const comedyData = await fetchTMDB('discover/tv', { with_genres: '35', sort_by: 'popularity.desc' });
                renderShelfGrid(comedyData.results || [], 'tvComedyShelf', 'tv');

                // 4. TV Dramas
                const dramaData = await fetchTMDB('discover/tv', { with_genres: '18', sort_by: 'popularity.desc' });
                renderShelfGrid(dramaData.results || [], 'tvDramaShelf', 'tv');

                tvHomeLoaded = true;
            } catch(e) {
                console.error("Failed to load TV home data", e);
            }
        }

        // 2. Movies & TV Filters Engine
        async function applyFilters(type) {
            const genre = document.getElementById(`${type}-genre`).value;
            const year = document.getElementById(`${type}-year`).value;
            const gridId = type === 'movies' ? 'moviesGrid' : 'tvGrid';
            const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';
            
            const homeLayoutId = type === 'movies' ? 'moviesHomeLayout' : 'tvHomeLayout';
            const catalogLayoutId = type === 'movies' ? 'moviesCatalogLayout' : 'tvCatalogLayout';
            const homeLayout = document.getElementById(homeLayoutId);
            const catalogLayout = document.getElementById(catalogLayoutId);

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
                if (year) {
                    if (year.endsWith('s')) {
                        const startDecade = year.replace('s', '');
                        params['primary_release_date.gte'] = `${startDecade}-01-01`;
                        params['primary_release_date.lte'] = `${parseInt(startDecade) + 9}-12-31`;
                    } else {
                        params.primary_release_year = year;
                        params.first_air_date_year = year;
                    }
                }
                const data = await fetchTMDB(endpoint, params);
                renderFilterGrid(data.results, gridId, type === 'movies' ? 'movie' : 'tv');
            } catch(e) {}
        }

        async function loadMore(type) {
            const page = type === 'movies' ? ++moviesPage : ++tvPage;
            const genre = document.getElementById(`${type}-genre`).value;
            const year = document.getElementById(`${type}-year`).value;
            const gridId = type === 'movies' ? 'moviesGrid' : 'tvGrid';
            const endpoint = type === 'movies' ? 'discover/movie' : 'discover/tv';

            try {
                const params = { page };
                if (genre) params.with_genres = genre;
                if (year) {
                    if (year.endsWith('s')) {
                        const startDecade = year.replace('s', '');
                        params['primary_release_date.gte'] = `${startDecade}-01-01`;
                    } else {
                        params.primary_release_year = year;
                    }
                }
                const data = await fetchTMDB(endpoint, params);
                appendFilterGrid(data.results, gridId, type === 'movies' ? 'movie' : 'tv');
            } catch(e) {}
        }

        function renderFilterGrid(items, gridId, defaultType) {
            const grid = document.getElementById(gridId);
            grid.innerHTML = '';
            appendFilterGrid(items, gridId, defaultType);
        }

        function appendFilterGrid(items, gridId, defaultType) {
            const grid = document.getElementById(gridId);
            items.forEach(item => {
                const title = item.title || item.name || "Untitled";
                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';

                const card = document.createElement('div');
                card.className = "bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group";
                card.onclick = () => openDetails(item.id, item.media_type || defaultType);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            <span>${year}</span>
                            <span class="text-indigo-400 font-extrabold">${defaultType === 'tv' ? 'Series' : 'Movie'}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        // 3. SPORTS CHANNELS ENGINE
        async function loadSportsChannels() {
            try {
                // 1. Fetch custom sports channels from admin API
                let customSports = [];
                try {
                    const adminRes = await fetch('/api/sports');
                    const adminData = await adminRes.json();
                    if (adminData && Array.isArray(adminData)) {
                        customSports = adminData.map(s => ({
                            name: '💎 ' + s.title,
                            url: s.url,
                            logo: s.icon && s.icon.startsWith('http') ? s.icon : ''
                        }));
                    }
                } catch(e) {
                    console.warn('Failed to fetch admin sports', e);
                }

                const response = await fetch('/sports.m3u?nocache=' + Date.now());
                const text = await response.text();
                const lines = text.split('\n');
                let current = {};
                let tempChannels = [];
                
                for(let line of lines) {
                    line = line.trim();
                    if (line.startsWith('#EXTINF')) {
                        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                        if (logoMatch) current.logo = logoMatch[1];
                        const nameParts = line.split(',');
                        current.name = nameParts.length > 1 ? nameParts[1].trim() : "Sports Channel";
                    } else if (line.startsWith('http')) {
                        current.url = line;
                        if (current.name) tempChannels.push(Object.assign({}, current));
                        current = {};
                    }
                }
                
                
                let liveEvents = [];
                try {
                    const leRes = await fetch('/api/live_events');
                    const leData = await leRes.json();
                    if (leData && Array.isArray(leData)) {
                        liveEvents = leData.map(s => ({
                            name: '🔴 ' + s.title,
                            url: s.url,
                            logo: s.icon && s.icon.startsWith('http') ? s.icon : ''
                        }));
                    }
                } catch(e) {
                    console.warn('Failed to fetch admin live events', e);
                }

                // Add user custom M3U channels and presets
                const userCustomFeeds = getUserCustomSportsM3u().map(c => ({
                    name: '⚡ ' + c.name,
                    url: c.url,
                    logo: c.logo
                }));
                const presets = [];
                window.allSportsChannels = userCustomFeeds.concat(liveEvents).concat(customSports).concat(presets).concat(tempChannels);
                renderSportsHome();
                renderUserCustomSportsChips();
            } catch (err) {
                console.warn(err);
            }
        }

        // 4. CHANNELS DIRECTORY ENGINE
        window.allChannelsData = [];
        window.activeChannelsGenre = 'all';

        async function loadAllChannelsDirectory() {
            const badge = document.getElementById('channelsCountBadge');
            
            if (window.allChannelsData && window.allChannelsData.length > 0) {
                renderChannelsDirectoryGrid();
                return;
            }

            try {
                if (badge) badge.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 text-emerald-400 animate-spin inline mr-1"></i> Loading 249+ channels...`;
                const res = await fetch('/api/sports/channels');
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    window.allChannelsData = data;
                } else if (window.allSportsChannels && window.allSportsChannels.length > 0) {
                    window.allChannelsData = window.allSportsChannels;
                }
            } catch(e) {
                console.warn('Fallback to allSportsChannels for channels directory', e);
                if (window.allSportsChannels && window.allSportsChannels.length > 0) {
                    window.allChannelsData = window.allSportsChannels;
                }
            }

            renderChannelsDirectoryGrid();
        }

        function setChannelsGenre(genre) {
            window.activeChannelsGenre = genre;
            const genres = ['all', 'sky', 'football', 'bein', 'f1', 'cricket', 'us', 'entertainment', 'regional', '4k'];
            genres.forEach(g => {
                const btn = document.getElementById(`btn-chan-${g}`);
                if (btn) {
                    if (g === genre) {
                        btn.className = "px-4 py-2 rounded-xl transition-all shrink-0 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30 font-black";
                    } else {
                        btn.className = "px-4 py-2 rounded-xl transition-all shrink-0 bg-zinc-900 text-slate-400 hover:text-white border border-white/10 font-bold";
                    }
                }
            });
            renderChannelsDirectoryGrid();
        }

        function filterChannelsView() {
            renderChannelsDirectoryGrid();
        }

        function renderChannelsDirectoryGrid() {
            const grid = document.getElementById('channelsDirectoryGrid');
            const badge = document.getElementById('channelsCountBadge');
            if (!grid) return;

            let channels = (window.allChannelsData && window.allChannelsData.length > 0) 
                ? window.allChannelsData 
                : (window.allSportsChannels || []);

            // Search Filter
            const searchInput = document.getElementById('channelsSearchInput');
            const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
            if (query) {
                channels = channels.filter(ch => {
                    const name = (ch.name || ch.Name || '').toLowerCase();
                    const genre = (ch.genre || '').toLowerCase();
                    const source = (ch.source || '').toLowerCase();
                    const idStr = (ch.id || '').toString().toLowerCase();
                    return name.includes(query) || genre.includes(query) || source.includes(query) || idStr.includes(query);
                });
            }

            // Source Filter
            const sourceSelect = document.getElementById('channelsSourceSelect');
            const sourceVal = sourceSelect ? sourceSelect.value : 'all';
            if (sourceVal !== 'all') {
                channels = channels.filter(ch => (ch.source || '').toLowerCase() === sourceVal.toLowerCase());
            }

            // Genre Filter
            const genre = window.activeChannelsGenre || 'all';
            if (genre !== 'all') {
                channels = channels.filter(ch => {
                    const name = (ch.name || ch.Name || '').toLowerCase();
                    const g = (ch.genre || '').toLowerCase();
                    if (genre === 'sky') return name.includes('sky');
                    if (genre === 'football') return name.includes('football') || name.includes('soccer') || name.includes('premier') || name.includes('laliga') || name.includes('serie') || name.includes('tnt') || name.includes('mutv') || name.includes('barca') || name.includes('real madrid') || name.includes('joj');
                    if (genre === 'bein') return name.includes('bein');
                    if (genre === 'f1') return name.includes('f1') || name.includes('racing') || name.includes('grand prix') || name.includes('moto') || name.includes('nascar') || name.includes('speed') || name.includes('v sport');
                    if (genre === 'cricket') return name.includes('cricket') || name.includes('willow') || name.includes('ipl') || name.includes('icc') || name.includes('star sports') || name.includes('astro cricket');
                    if (genre === 'us') return name.includes('espn') || name.includes('fox') || name.includes('cbs') || name.includes('nbc') || name.includes('abc') || name.includes('usa') || name.includes('fanduel') || name.includes('tsn');
                    if (genre === 'entertainment') return g.includes('entertainment') || g.includes('movies') || name.includes('hbo') || name.includes('starz') || name.includes('cinemax') || name.includes('mgm') || name.includes('showtime') || name.includes('bet') || name.includes('ctv') || name.includes('a&e') || name.includes('reelz');
                    if (genre === 'regional') return g.includes('malayalam') || name.includes('asianet') || name.includes('manorama') || name.includes('mathrubhumi') || name.includes('24') || name.includes('kairali') || name.includes('reporter');
                    if (genre === '4k') return g.includes('4k') || name.includes('4k') || name.includes('uhd');
                    return true;
                });
            }

            if (badge) {
                badge.innerHTML = `<i data-lucide="tv" class="w-3.5 h-3.5 text-emerald-400 inline mr-1"></i> ${channels.length} Live Channels`;
            }

            if (channels.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-16 text-center space-y-4 bg-zinc-950/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
                        <div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                            <i data-lucide="tv-2" class="w-8 h-8"></i>
                        </div>
                        <h3 class="text-base font-black text-white uppercase tracking-wider">No matching channels found</h3>
                        <p class="text-xs text-zinc-400 max-w-sm mx-auto">Try clearing search filters or picking another channel genre above.</p>
                        <button onclick="document.getElementById('channelsSearchInput').value=''; setChannelsGenre('all');" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-600/20">Reset Filters</button>
                    </div>
                `;
                if (window.lucide) lucide.createIcons();
                return;
            }

            grid.innerHTML = channels.map(ch => {
                const title = (ch.name || ch.Name || '').replace(/⭐️/g, '').trim() || "Live Channel";
                const rawUrl = ch.url || ch.stream_url || (`/api/play_stream/` + (ch.id || ''));
                const poster = getSportsLogo(ch);
                const sourceTag = ch.source || (ch.id ? 'DLHD' : 'TimStreams');
                const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
                const isSaved = getSavedSports().some(s => s.url === rawUrl);

                return `
                    <div class="bg-zinc-950/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 relative group flex flex-col justify-between p-3.5" onclick="openFullscreenPlayer('${rawUrl}', '${title.replace(/'/g, "\\'")}')">
                        
                        <div class="flex items-center justify-between gap-1 mb-2.5">
                            <span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black rounded uppercase tracking-wider truncate max-w-[90px]">
                                ${ch.genre || sourceTag}
                            </span>
                            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                                <button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(title).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(rawUrl).replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 text-amber-400" title="View Channel EPG">
                                    <i data-lucide="list" class="w-3.5 h-3.5"></i>
                                </button>
                                <button onclick="toggleSavedSport(event, '${encodeURIComponent(title).replace(/'/g, "%27")}', '${encodeURIComponent(rawUrl).replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90">
                                    <i data-lucide="heart" class="w-3.5 h-3.5 ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-zinc-500'}"></i>
                                </button>
                            </div>
                        </div>

                        <div class="relative aspect-[16/10] bg-gradient-to-b from-zinc-900 to-black/80 rounded-xl p-2.5 flex items-center justify-center border border-white/5 mb-3 group-hover:border-emerald-500/30 transition-all overflow-hidden">
                            <img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">
                            
                            <!-- Hover Play Overlay -->
                            <div class="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px]  transition-opacity flex items-center justify-center">
                                <div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                                    <i data-lucide="play" class="w-5 h-5 fill-white ml-0.5"></i>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-1">
                            <h4 class="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate" title="${title}">${title}</h4>
                            <div class="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
                                <span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE HD</span>
                                <span class="text-zinc-400 font-mono">${sourceTag}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            if (window.lucide) lucide.createIcons();
        }

        function getUserCustomSportsM3u() {
            try {
                return JSON.parse(localStorage.getItem('user_custom_sports_m3u_list') || '[]');
            } catch(e) {
                return [];
            }
        }

        function saveUserCustomSportsM3u(name, url, logo = '') {
            if (!url) return;
            const list = getUserCustomSportsM3u();
            const existingIdx = list.findIndex(item => item.url === url);
            const newItem = {
                name: name || "Custom Sports Channel",
                url: url,
                logo: logo || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=300"
            };
            if (existingIdx >= 0) {
                list[existingIdx] = newItem;
            } else {
                list.unshift(newItem);
            }
            localStorage.setItem('user_custom_sports_m3u_list', JSON.stringify(list));
            renderUserCustomSportsChips();
        }

        function deleteUserCustomSportsM3u(url) {
            let list = getUserCustomSportsM3u();
            list = list.filter(item => item.url !== url);
            localStorage.setItem('user_custom_sports_m3u_list', JSON.stringify(list));
            renderUserCustomSportsChips();
            if (typeof loadSportsChannels === 'function') loadSportsChannels();
        }

        function renderUserCustomSportsChips() {
            const container = document.getElementById('userCustomM3uChips');
            if (!container) return;
            const list = getUserCustomSportsM3u();
            if (list.length === 0) {
                container.classList.add('hidden');
                container.innerHTML = '';
                return;
            }
            container.classList.remove('hidden');
            container.innerHTML = `
                <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider self-center mr-1">Saved Links:</span>
                ${list.map(item => `
                    <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-white/10 text-xs text-slate-200 hover:border-emerald-500/40 transition-all">
                        <button onclick="playCustomM3uDirect('${encodeURIComponent(item.url)}', '${encodeURIComponent(item.name)}')" class="font-bold hover:text-emerald-400 transition-colors flex items-center gap-1 truncate max-w-[150px]">
                            <i data-lucide="play" class="w-3 h-3 text-emerald-400 fill-emerald-400"></i> ${item.name}
                        </button>
                        <button onclick="deleteUserCustomSportsM3u('${item.url}')" class="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors" title="Remove link">
                            <i data-lucide="x" class="w-3 h-3"></i>
                        </button>
                    </div>
                `).join('')}
            `;
            if (window.lucide) lucide.createIcons();
        }

        function playCustomM3uDirect(encUrl, encName) {
            const url = decodeURIComponent(encUrl);
            const name = decodeURIComponent(encName) || "Custom Sports Channel";
            window.location.href = `play_consumet.php?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&source=consumet.html`;
        }

        function playCustomM3uStream() {
            const urlInput = document.getElementById('customM3uUrlInput');
            const nameInput = document.getElementById('customM3uNameInput');
            const url = (urlInput ? urlInput.value : '').trim();
            const name = (nameInput ? nameInput.value : '').trim() || "Custom Sports Channel";

            if (!url) {
                if (typeof showToast === 'function') {
                    showToast("Please enter a valid M3U or stream URL");
                } else {
                    alert("Please enter a valid M3U or stream URL");
                }
                return;
            }

            saveUserCustomSportsM3u(name, url);
            window.location.href = `play_consumet.php?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&source=consumet.html`;
        }

        
        function getSavedSports() {
            return JSON.parse(localStorage.getItem('stalker_saved_sports') || '[]');
        }

        function toggleSavedSport(event, encName, encUrl, encLogo) {
            const name = decodeURIComponent(encName);
            const url = decodeURIComponent(encUrl);
            const logo = decodeURIComponent(encLogo);
            event.stopPropagation();
            event.preventDefault();
            let saved = getSavedSports();
            const index = saved.findIndex(s => s.url === url);
            if (index >= 0) {
                saved.splice(index, 1);
                showToast("Removed from Saved Sports");
            } else {
                saved.push({ name, url, logo: logo === 'null' ? null : logo });
                showToast("Added to Saved Sports");
            }
            localStorage.setItem('stalker_saved_sports', JSON.stringify(saved));
            
            // Re-render
            if (window.activeSportsCategory === 'saved') {
                renderSportsGrid(getSavedSports());
            } else if (window.activeSportsCategory === 'all') {
                renderSportsHome();
            } else {
                filterSports();
            }
            lucide.createIcons();
        }

                let sportsSpotlightSlides = [];
        let currentSportsSlideIndex = 0;
        let sportsSpotlightInterval = null;

        function renderSportsSpotlight(slides) {
            sportsSpotlightSlides = slides;
            if (slides.length === 0) return;
            renderSportsSpotlightSlide(0);
            
            if (sportsSpotlightInterval) clearInterval(sportsSpotlightInterval);
            sportsSpotlightInterval = setInterval(() => {
                nextSportsSpotlightSlide();
            }, 6500);
        }

        function nextSportsSpotlightSlide() {
            if (sportsSpotlightSlides.length === 0) return;
            const nextIdx = (currentSportsSlideIndex + 1) % sportsSpotlightSlides.length;
            renderSportsSpotlightSlide(nextIdx);
        }
        
        window.selectSportsSpotlightSlide = function(index) {
            if (sportsSpotlightInterval) clearInterval(sportsSpotlightInterval);
            renderSportsSpotlightSlide(index);
            sportsSpotlightInterval = setInterval(() => {
                nextSportsSpotlightSlide();
            }, 6500);
        }

        function renderSportsSpotlightSlide(index) {
            if (sportsSpotlightSlides.length === 0) return;
            currentSportsSlideIndex = index;
            const container = document.getElementById('sportsHeroSliderContainer');
            if (!container) return;
            const item = sportsSpotlightSlides[index];
            const title = item.name || "Live Sports Showcase";
            const backdrop = item.logo && item.logo.startsWith('http') ? item.logo : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2560';

            container.innerHTML = `
                <div class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('${backdrop}')"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/50 to-transparent z-10"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#05070a]/90 via-transparent to-transparent z-10"></div>
                
                <div class="absolute bottom-6 right-6 flex items-center gap-2 z-20">
                    ${sportsSpotlightSlides.map((_, i) => `
                        <button onclick="selectSportsSpotlightSlide(${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-emerald-500 w-6' : 'bg-white/30 hover:bg-white/50'}"></button>
                    `).join('')}
                </div>

                <div class="absolute bottom-0 left-0 p-8 sm:p-14 max-w-2xl z-20 animate-slide-up">
                    <div class="flex items-center gap-3 mb-4">
                        <span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white rounded border border-emerald-500/50 shadow-lg shadow-emerald-500/20 animate-pulse">🔴 LIVE</span>
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-widest">Premium Broadcast</span>
                    </div>
                    <h2 class="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-[1.1] drop-shadow-2xl mb-4">${title}</h2>
                    <p class="text-sm text-slate-300 font-medium leading-relaxed mb-8 max-w-xl line-clamp-3">
                        Stream live sports networks, main events, Formula 1 broadcasts, and Champions League qualifiers without ad-interruptions.
                    </p>
                    <div class="flex flex-wrap items-center gap-4">
                        <button onclick="openFullscreenPlayer('${item.url}', '${title.replace(/'/g, "\\'")}')" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 flex items-center gap-2 transform active:scale-95">
                            <i data-lucide="play" class="w-5 h-5 fill-white"></i> Play Stream
                        </button>
                        <button onclick="toggleSavedSport(event, '${encodeURIComponent(title)}', '${item.url}', '${item.logo || ""}')" class="w-14 h-14 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 flex items-center justify-center transition-all hover:border-emerald-500/30 transform active:scale-95">
                            <i data-lucide="heart" class="w-6 h-6 ${getSavedSports().some(s => s.url === item.url) ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}"></i>
                        </button>
                    </div>
                </div>
            `;
            lucide.createIcons();
        }

        function analyzeStream(url) {
            const lower = (url || '').toLowerCase();
            let type = 'Native HLS';
            let res = '1080p HD';
            if (lower.includes('/play/') || lower.includes('.ts') || lower.includes('transcode=1')) {
                type = 'MPEG-TS';
            } else if (lower.includes('.ism') || lower.includes('fmp4')) {
                type = 'fMP4 HLS';
            }
            if (lower.includes('4k') || lower.includes('uhd') || lower.includes('3840')) {
                res = '4K UHD';
            } else if (lower.includes('720')) {
                res = '720p HD';
            }
            return { type, res };
        }

        function renderSportsHome() {
            const list = window.allSportsChannels || [];
            
            const skyChannels = list.filter(ch => ch.name.toLowerCase().includes('sky'));
            const footballChannels = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('laliga') || ch.name.toLowerCase().includes('premier') || ch.name.toLowerCase().includes('serie') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
            const f1Channels = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
            const cricketChannels = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric') || ch.name.toLowerCase().includes('unite8'));
            const usChannels = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
            const sonyChannels = list.filter(ch => ch.name.toLowerCase().includes('sony'));
            const hboChannels = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
            
            const fourKChannels = list.filter(ch => ch.genre === '4K Ultra HD' || ch.name.toLowerCase().includes('4k') || ch.name.toLowerCase().includes('uhd'));
            const malayalamNewsChannels = list.filter(ch => ch.genre === 'Malayalam News' || ch.name.toLowerCase().includes('news') && (ch.name.toLowerCase().includes('24') || ch.name.toLowerCase().includes('asianet') || ch.name.toLowerCase().includes('manorama') || ch.name.toLowerCase().includes('mathrubhumi') || ch.name.toLowerCase().includes('kairali') || ch.name.toLowerCase().includes('janam') || ch.name.toLowerCase().includes('media one') || ch.name.toLowerCase().includes('news18') || ch.name.toLowerCase().includes('reporter') || ch.name.toLowerCase().includes('zee')));
            const malayalamEntChannels = list.filter(ch => ch.genre === 'Malayalam Entertainment' || ch.name.toLowerCase().includes('amrita') || ch.name.toLowerCase().includes('dd malayalam') || ch.name.toLowerCase().includes('mazhavil') || ch.name.toLowerCase().includes('flowers') || ch.name.toLowerCase().includes('jeevan'));
            const malayalamMoviesChannels = list.filter(ch => ch.genre === 'Malayalam Movies' || ch.genre === 'Malayalam Music' || ch.genre === 'Malayalam Education' || ch.name.toLowerCase().includes('kappa') || ch.name.toLowerCase().includes('victers') || ch.name.toLowerCase().includes('we'));
            const kidsChannels = list.filter(ch => ch.genre === 'Kids' || ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('bean') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
            
            const customChannels = list.filter(ch => ch.name.startsWith('💎 '));

            const savedChannels = getSavedSports();
            const savedContainer = document.getElementById('sportsSavedShelfContainer');
            if (savedChannels.length > 0) {
                if (savedContainer) savedContainer.style.display = 'block';
                renderSportsShelf(savedChannels, 'sportsSavedShelf');
            } else {
                if (savedContainer) savedContainer.style.display = 'none';
            }
            
            const liveEventsChannels = list.filter(ch => ch.name.startsWith('🔴 '));
            const liveEventsContainer = document.getElementById('sportsLiveEventsShelfContainer');
            if (liveEventsChannels.length > 0) {
                if (liveEventsContainer) liveEventsContainer.style.display = 'block';
                renderSportsShelf(liveEventsChannels, 'sportsLiveEventsShelf');
            } else {
                if (liveEventsContainer) liveEventsContainer.style.display = 'none';
            }

            const customContainer = document.getElementById('sportsCustomShelfContainer');
            if (customChannels.length > 0) {
                if (customContainer) customContainer.style.display = 'block';
                renderSportsShelf(customChannels, 'sportsCustomShelf');
            } else {
                if (customContainer) customContainer.style.display = 'none';
            }
            
            // Pick 5 random channels for the spotlight
            const spotlightChannels = [...list].sort(() => 0.5 - Math.random()).slice(0, 5);
            renderSportsSpotlight(spotlightChannels);
            
            renderSportsShelf(skyChannels, 'sportsSkyShelf');
            renderSportsShelf(footballChannels, 'sportsFootballShelf');
            renderSportsShelf(cricketChannels, 'sportsCricketShelf');
            renderSportsShelf(f1Channels, 'sportsF1Shelf');
            renderSportsShelf(usChannels, 'sportsUSShelf');
            renderSportsShelf(sonyChannels, 'sportsSonyShelf');
            renderSportsShelf(hboChannels, 'sportsHBOShelf');
            renderSportsShelf(fourKChannels, 'sports4kShelf');
            renderSportsShelf(malayalamNewsChannels, 'sportsMalayalamNewsShelf');
            renderSportsShelf(malayalamEntChannels, 'sportsMalayalamEntShelf');
            renderSportsShelf(malayalamMoviesChannels, 'sportsMalayalamMoviesShelf');
            renderSportsShelf(kidsChannels, 'sportsKidsShelf');
            lucide.createIcons();
        }

        function getSportsLogo(ch) {
            if (!ch) return 'https://ui-avatars.com/api/?name=Sports&background=05070a&color=10b981&size=256&bold=true';
            const title = (ch.name || ch.Name || '').replace(/⭐️/g, '').trim() || "Live Sports";
            const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
            let logo = ch.logo || ch.Logo || '';

            const name = title.toLowerCase();

            if (name.includes('abc ny') || name.includes('abc usa') || name === 'abc') return '/assets/logos/abc_usa.svg';
            if (name.includes('a&e') || name.includes('a & e')) return '/assets/logos/a_and_e_usa.svg';
            if (name.includes('bein sports 1 fr')) return '/assets/logos/bein_sports_1_france.svg';
            if (name.includes('bein sports 2 fr')) return '/assets/logos/bein_sports_2_france.svg';
            if (name.includes('bein sports 3 fr')) return '/assets/logos/bein_sports_3_france.svg';
            if (name.includes('bein sports 1 tr') || name.includes('bein sports 1 turkey')) return '/assets/logos/bein_sports_1_turkey.svg';
            if (name.includes('bein sports 2 tr') || name.includes('bein sports 2 turkey')) return '/assets/logos/bein_sports_2_turkey.svg';
            if (name.includes('bein sports 3 tr') || name.includes('bein sports 3 turkey')) return '/assets/logos/bein_sports_3_turkey.svg';
            if (name.includes('bein sports 4 tr') || name.includes('bein sports 4 turkey')) return '/assets/logos/bein_sports_4_turkey.svg';
            if (name.includes('bein')) return '/assets/logos/bein_sports_mena_english_2.svg';
            if (name.includes('astro supersport 3')) return '/assets/logos/astro_supersport_3.svg';
            if (name.includes('astro supersport 4')) return '/assets/logos/astro_supersport_4.svg';
            if (name.includes('astro cricket')) return '/assets/logos/astro_cricket.svg';
            if (name.includes('dazn')) return '/assets/logos/dazn_2_spain.svg';
            if (name.includes('arena sport 2 cro')) return '/assets/logos/arena_sport_2_croatia.svg';
            if (name.includes('arena sport')) return '/assets/logos/arena_sport_2_serbia.svg';
            if (name.includes('espn brasil')) return '/assets/logos/espn_brasil.svg';
            if (name.includes('fox sports 2')) return '/assets/logos/fox_sports_2_usa.svg';
            if (name.includes('fox sports 503')) return '/assets/logos/fox_sports_503_au.svg';
            if (name.includes('fanduel')) return '/assets/logos/fanduel_sports_network_midwest.svg';
            if (name.includes('sportsnet one')) return '/assets/logos/sportsnet_one.svg';
            if (name.includes('sportsnet 360')) return '/assets/logos/sportsnet_360.svg';
            if (name.includes('supersport variety')) return '/assets/logos/supersport_variety_1.svg';
            if (name.includes('tsn5') || name.includes('tsn 5')) return '/assets/logos/tsn5.svg';
            if (name.includes('tnt usa') || name === 'tnt') return '/assets/logos/tnt_usa.svg';
            if (name.includes('starz')) return '/assets/logos/starz.svg';
            if (name.includes('cinemax')) return '/assets/logos/cinemax_usa.svg';
            if (name.includes('mgm+') || name.includes('epix')) return '/assets/logos/mgm_plus_usa_epix.svg';
            if (name.includes('showtime')) return '/assets/logos/showtime_showcase_usa.svg';
            if (name.includes('bbc america') || name.includes('bbca')) return '/assets/logos/bbc_america_bbca.svg';
            if (name.includes('bet usa') || name === 'bet') return '/assets/logos/bet_usa.svg';
            if (name.includes('cnbc')) return '/assets/logos/cnbc_usa.svg';
            if (name.includes('ctv canada') || name === 'ctv') return '/assets/logos/ctv_canada.svg';
            if (name.includes('cbsny') || name.includes('cbs ny') || name === 'cbs') return '/assets/logos/cbsny_usa.svg';
            if (name.includes('canal 5') || name.includes('canal5')) return '/assets/logos/canal5_mx.svg';
            if (name.includes('sport 1 cz') || name.includes('sport 1')) return '/assets/logos/sport_1_cz.svg';
            if (name.includes('joj')) return '/assets/logos/joj_sport_sk.svg';
            if (name.includes('discovery life')) return '/assets/logos/discovery_life_channel.svg';
            if (name.includes('disney xd')) return '/assets/logos/disney_xd.svg';
            if (name.includes('racer tv')) return '/assets/logos/racer_tv_usa.svg';
            if (name.includes('nbc sports')) return '/assets/logos/nbc_sports_philadelphia.svg';
            if (name.includes('nat geo wild')) return '/assets/logos/nat_geo_wild_usa.svg';
            if (name.includes('reelz')) return '/assets/logos/reelz_channel.svg';
            if (name.includes('sport 5 plus')) return '/assets/logos/sport_5_plus_israel.svg';
            if (name.includes('sport 5 live')) return '/assets/logos/sport_5_live_israel.svg';
            if (name.includes('sport 5 star') || name.includes('sport 5')) return '/assets/logos/sport_5_star_israel.svg';
            if (name.includes('tv4 sport')) return '/assets/logos/tv4_sport_live_3.svg';
            if (name.includes('v sport motor') || name.includes('v sport')) return '/assets/logos/v_sport_motor_sweden.svg';
            if (name.includes('fox weather')) return '/assets/logos/fox_weather_channel.svg';
            if (name.includes('eurosport 1') || name.includes('eurosport')) return '/assets/logos/eurosport_1_spain.svg';

            if (!logo || logo.includes('generic.png')) return fallbackLogo;
            return logo;
        }

        function renderSportsShelf(channels, containerId) {
            const grid = document.getElementById(containerId);
            if (!grid) return;
            grid.innerHTML = '';
            
            // Limit to max 25 items per shelf
            const itemsToRender = channels.slice(0, 25);
            
            if (itemsToRender.length === 0) {
                grid.innerHTML = '<div class="py-6 px-4 text-xs text-zinc-600 uppercase tracking-widest font-black">No feeds active in this shelf</div>';
                return;
            }

            itemsToRender.forEach(ch => {
                const title = ch.name.replace(/⭐️/g, '').trim() || "Live Sports";
                const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
                const poster = getSportsLogo(ch);
                const analysis = analyzeStream(ch.url || ch.stream_url);
                
                const card = document.createElement('div');
                card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-emerald-500/30 shadow-md";
                card.onclick = () => openFullscreenPlayer(ch.url || ch.stream_url, title);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
                        <img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                            <button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 text-amber-400" title="View Channel EPG">
                                <i data-lucide="list" class="w-3 h-3"></i>
                            </button>
                            <button onclick="toggleSavedSport(event, '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90">
                                <i data-lucide="heart" class="w-3 h-3 ${getSavedSports().some(s => s.url === (ch.url || ch.stream_url)) ? 'fill-pink-500 text-pink-500' : 'text-zinc-500'}"></i>
                            </button>
                        </div>
                        <div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-emerald-400 border border-white/5 flex items-center gap-1 shadow-md backdrop-blur-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="text-xs font-black text-white truncate w-full uppercase tracking-tight" title="${title}">${title}</h3>
                            <div class="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>${analysis.type}</span>
                                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span class="text-emerald-400">${analysis.res}</span>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }


        function renderSportsGrid(channels) {
            const grid = document.getElementById('sportsGrid');
            if (!grid) return;
            grid.innerHTML = '';
            
            if (channels.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <i data-lucide="info" class="w-10 h-10 text-zinc-600"></i>
                        <p class="text-sm font-extrabold text-zinc-400 uppercase tracking-wider">No matching feeds found</p>
                        <p class="text-xs text-zinc-600 max-w-xs">Try adjusting your keywords or switching back to the Hub Arena.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            channels.forEach(ch => {
                const title = ch.name.replace(/⭐️/g, '').trim() || "Live Sports";
                const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
                const poster = getSportsLogo(ch);
                
                const card = document.createElement('div');
                card.className = "bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-emerald-500/30 shadow-md";
                card.onclick = () => openFullscreenPlayer(ch.url, title);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
                        <img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                            <button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90  text-amber-400" title="View Channel EPG">
                                <i data-lucide="list" class="w-3 h-3"></i>
                            </button>
                            <button onclick="toggleSavedSport(event, '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url).replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 ">
                                <i data-lucide="heart" class="w-3 h-3 ${getSavedSports().some(s => s.url === ch.url) ? 'fill-pink-500 text-pink-500' : 'text-zinc-500'}"></i>
                            </button>
                        </div>
                        <div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-emerald-400 border border-white/5 flex items-center gap-0.5 shadow-md backdrop-blur-sm">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <div>
                            <h3 class="text-xs font-black text-white truncate w-full uppercase tracking-tight" title="${title}">${title}</h3>
                            <div class="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                <span>SPORTS</span>
                                <span class="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>LIVE HD</span>
                            </div>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        function filterSports() {
            const query = (document.getElementById('sportsSearch')?.value || '').toLowerCase().trim();
            const homeLayout = document.getElementById('sportsHomeLayout');
            const catalogLayout = document.getElementById('sportsCatalogLayout');

            if (query === '') {
                if (window.activeSportsCategory === 'all') {
                    if (homeLayout) homeLayout.classList.remove('hidden');
                    if (catalogLayout) catalogLayout.classList.add('hidden');
                } else {
                    if (homeLayout) homeLayout.classList.add('hidden');
                    if (catalogLayout) catalogLayout.classList.remove('hidden');
                    filterSportsCategory(window.activeSportsCategory);
                }
            } else {
                if (homeLayout) homeLayout.classList.add('hidden');
                if (catalogLayout) catalogLayout.classList.remove('hidden');
                
                let list = window.activeSportsCategory === 'saved' ? getSavedSports() : (window.allSportsChannels || []);
                if (window.activeSportsCategory !== 'all' && window.activeSportsCategory !== 'saved') {
                    if (window.activeSportsCategory === 'sky') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('sky'));
                    } else if (window.activeSportsCategory === 'football') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('sports 1') || ch.name.toLowerCase().includes('sports 2') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
                    } else if (window.activeSportsCategory === 'cricket') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric'));
                    } else if (window.activeSportsCategory === 'f1') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
                    } else if (window.activeSportsCategory === 'us') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
                    } else if (window.activeSportsCategory === 'sony') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('sony'));
                    } else if (window.activeSportsCategory === 'hbo') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
                    } else if (window.activeSportsCategory === 'kids') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
                    }
                }
                const filtered = list.filter(c => c.name.toLowerCase().includes(query));
                renderSportsGrid(filtered);
            }
        }

        // 4. DETAIL PANEL ENGINE (MODAL)
        async function openDetails(mediaId, type, startSeason = null, startEpisode = null) {
            const modal = document.getElementById('detailsModal');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; if(window.lenis) window.lenis.stop();

            // Reset trailer state
            document.getElementById('detailBackdrop').style.opacity = '1';
            const detailsTrailerControls = document.getElementById('detailsTrailerControls');
            if (detailsTrailerControls) detailsTrailerControls.classList.add('hidden');

            // Loading state
            document.getElementById('detailTitle').textContent = "Preloading Details...";
            document.getElementById('detailOverview').textContent = "";
            document.getElementById('detailTagline').textContent = "";
            document.getElementById('detailCast').innerHTML = "";

            try {
                const data = await fetchTMDB(`${type}/${mediaId}`, { append_to_response: 'credits,external_ids,videos,release_dates,content_ratings' });
                selectedMedia = data;
                selectedMedia.type = type;

                let cert = '';
                if (type === 'movie' && data.release_dates && data.release_dates.results) {
                    const usRelease = data.release_dates.results.find(r => r.iso_3166_1 === 'US') || data.release_dates.results[0];
                    if (usRelease && usRelease.release_dates.length > 0) {
                        cert = usRelease.release_dates.find(r => r.certification)?.certification || '';
                    }
                } else if (type === 'tv' && data.content_ratings && data.content_ratings.results) {
                    const usRating = data.content_ratings.results.find(r => r.iso_3166_1 === 'US') || data.content_ratings.results[0];
                    if (usRating) cert = usRating.rating;
                }

                // Bind elements
                document.getElementById('detailTitle').textContent = data.title || data.name;
                document.getElementById('detailOverview').textContent = data.overview || "No synopsis recorded.";
                document.getElementById('detailTagline').textContent = data.tagline ? `"${data.tagline}"` : "";
                document.getElementById('detailYear').textContent = (data.release_date || data.first_air_date || '').split('-')[0] || '2024';
                document.getElementById('detailRating').innerHTML = `<i class="w-3.5 h-3.5 fill-red-500 text-red-500 inline mr-1"></i> ${data.vote_average ? data.vote_average.toFixed(1) : 'NR'}`;
                document.getElementById('detailRuntime').textContent = type === 'movie' ? `${data.runtime || 120} min` : `${data.number_of_seasons || 1} Seasons`;
                document.getElementById('detailType').textContent = type === 'tv' ? 'Series' : 'Movie';

                const genresContainer = document.getElementById('detailGenres');
                genresContainer.innerHTML = (data.genres || []).map(g => `<span class="bg-zinc-800 border border-white/5 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-300">${g.name}</span>`).join('');
                
                const extraInfoContainer = document.getElementById('detailExtraInfo');
                let extraHtml = [];
                if (cert) extraHtml.push(`<span class="bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-widest">${cert}</span>`);
                if (data.status) extraHtml.push(`<span>Status: <span class="text-white">${data.status}</span></span>`);
                if (data.budget > 0) extraHtml.push(`<span>Budget: <span class="text-white">$${(data.budget/1000000).toFixed(1)}M</span></span>`);
                if (data.revenue > 0) extraHtml.push(`<span>Revenue: <span class="text-white">$${(data.revenue/1000000).toFixed(1)}M</span></span>`);
                if (data.production_companies && data.production_companies.length > 0) {
                    extraHtml.push(`<span>Studio: <span class="text-white">${data.production_companies[0].name}</span></span>`);
                }
                extraInfoContainer.innerHTML = extraHtml.join('<span class="text-white/20">•</span>');

                // Poster & backdrop
                document.getElementById('detailPoster').src = data.poster_path ? `https://image.tmdb.org/t/p/w300${data.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                document.getElementById('detailBackdrop').style.backgroundImage = `url('https://image.tmdb.org/t/p/original${data.backdrop_path}')`;

                // Background Trailer setup
                const videosList = data.videos?.results || [];
                const trailer = videosList.find(v => v.type === 'Trailer' && v.site === 'YouTube') || videosList.find(v => v.site === 'YouTube');
                const trailerBgContainer = document.getElementById('trailerBgContainer');
                const trailerBgIframe = document.getElementById('trailerBgIframe');
                const btnPlayTrailer = document.getElementById('btn-play-trailer');
                
                if (trailer) {
                    btnPlayTrailer.classList.remove('hidden');
                    window.currentTrailerKey = trailer.key;
                    trailerBgIframe.src = '';
                    trailerBgContainer.classList.add('opacity-0');
                    
                    if (window.detailsTrailerTimeout) clearTimeout(window.detailsTrailerTimeout);
                    window.detailsTrailerTimeout = setTimeout(() => {
                        const detailsModal = document.getElementById('detailsModal');
                        if (detailsModal && !detailsModal.classList.contains('hidden') && window.currentTrailerKey === trailer.key) {
                            trailerBgIframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&vq=medium`;
                            trailerBgContainer.style.opacity = '1';
                            trailerBgContainer.classList.remove('opacity-0');
                            document.getElementById('detailBackdrop').style.opacity = '0';
                            if (detailsTrailerControls) {
                                detailsTrailerControls.classList.remove('hidden');
                                window.isDetailsTrailerMuted = true;
                                window.isDetailsTrailerPlaying = true;
                                const muteIcon = document.getElementById('detailsTrailerMuteIcon');
                                const playIcon = document.getElementById('detailsTrailerPlayIcon');
                                if (muteIcon) muteIcon.setAttribute('data-lucide', 'volume-x');
                                if (playIcon) {
                                    playIcon.setAttribute('data-lucide', 'pause');
                                    playIcon.classList.add('fill-white');
                                }
                                lucide.createIcons();
                            }
                        }
                    }, 2000);
                } else {
                    btnPlayTrailer.classList.add('hidden');
                    window.currentTrailerKey = null;
                    trailerBgIframe.src = '';
                    trailerBgContainer.classList.add('opacity-0');
                }

                // IMDb rating fetcher
                const imdbBadge = document.getElementById('imdbBadge');
                const imdbRatingVal = document.getElementById('imdbRatingVal');
                const imdbId = data.external_ids?.imdb_id;
                
                if (imdbId) {
                    imdbBadge.href = `https://www.imdb.com/title/${imdbId}`;
                    imdbBadge.classList.remove('hidden');
                    imdbRatingVal.textContent = "Loading...";
                    
                    fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=7f34be62`)
                        .then(res => {
                            if (!res.ok) throw new Error();
                            return res.json();
                        })
                        .then(omdbData => {
                            if (omdbData && omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
                                imdbRatingVal.textContent = omdbData.imdbRating;
                            } else {
                                imdbRatingVal.textContent = data.vote_average ? data.vote_average.toFixed(1) : '--';
                            }
                        })
                        .catch(() => {
                            imdbRatingVal.textContent = data.vote_average ? data.vote_average.toFixed(1) : '--';
                        });
                } else {
                    imdbBadge.classList.add('hidden');
                }

                // Render Cast
                const castContainer = document.getElementById('detailCast');
                const cast = (data.credits?.cast || []).slice(0, 15);
                castContainer.innerHTML = '';
                cast.forEach(member => {
                    const profile = member.profile_path ? `https://image.tmdb.org/t/p/w185${member.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150';
                    const div = document.createElement('div');
                    div.className = "text-center w-20 shrink-0 space-y-1.5 cursor-pointer hover:scale-105 transition-transform duration-300 group";
                    div.onclick = () => openPersonDetails(member.id);
                    div.innerHTML = `
                        <img src="${profile}" alt="${member.name}" class="w-16 h-16 rounded-full object-cover mx-auto border border-white/10 group-hover:border-red-500/50 shadow-md">
                        <div class="text-[10px] font-extrabold text-white truncate max-w-full leading-tight group-hover:text-red-400">${member.name}</div>
                        <div class="text-[8px] text-zinc-500 truncate max-w-full uppercase tracking-wider">${member.character || 'Actor'}</div>
                    `;
                    castContainer.appendChild(div);
                });

                // Set watchlist btn state
                updateWatchlistBtnState();

                // Setup TV Series Season Navigator if Series
                const tvNav = document.getElementById('tvNavigator');
                if (type === 'tv') {
                    tvNav.classList.remove('hidden');
                    const select = document.getElementById('seasonSelector');
                    select.innerHTML = '';
                    if (data.seasons && data.seasons.length > 0) {
                        data.seasons.forEach(season => {
                            if (season.season_number > 0) {
                                const opt = document.createElement('option');
                                opt.value = season.season_number;
                                opt.textContent = season.name || `Season ${season.season_number}`;
                                select.appendChild(opt);
                            }
                        });
                        if (select.options.length === 0) {
                            const opt = document.createElement('option');
                            opt.value = 1;
                            opt.textContent = `Season 1`;
                            select.appendChild(opt);
                        }
                    } else {
                        const seasonsCount = data.number_of_seasons || 1;
                        for (let s = 1; s <= seasonsCount; s++) {
                            const opt = document.createElement('option');
                            opt.value = s;
                            opt.textContent = `Season ${s}`;
                            select.appendChild(opt);
                        }
                    }
                    selectedSeason = startSeason || 1;
                    select.value = selectedSeason;
                    selectedEpisode = startEpisode || 1;
                    await loadSeasonEpisodes();
                } else {
                    tvNav.classList.add('hidden');
                }

                lucide.createIcons();
            } catch(e) {
                console.error(e);
            }
        }

        async function loadSeasonEpisodes() {
            if (!selectedMedia) return;
            const select = document.getElementById('seasonSelector');
            selectedSeason = parseInt(select.value) || 1;
            const grid = document.getElementById('episodesGrid');
            grid.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-zinc-500 font-bold uppercase">Loading episodes...</div>';

            try {
                const data = await fetchTMDB(`tv/${selectedMedia.id}/season/${selectedSeason}`);
                grid.innerHTML = '';
                const eps = data.episodes || [];
                eps.forEach(ep => {
                    const fallbackThumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&h=169&q=80';
                    const thumb = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : fallbackThumb;
                    
                    const card = document.createElement('div');
                    card.className = "bg-zinc-950/60 border border-white/5 rounded-xl overflow-hidden cursor-pointer p-2.5 flex gap-3 hover:border-red-500/40 transition-all transform active:scale-[0.98]";
                    card.onclick = () => {
                        selectedEpisode = ep.episode_number;
                        openFullscreenPlayer();
                    };

                    card.innerHTML = `
                        <img src="${thumb}" onerror="this.src='${fallbackThumb}'" alt="Ep" class="w-24 aspect-video rounded-lg object-cover shrink-0 bg-zinc-900 border border-white/5">
                        <div class="min-w-0 text-left flex flex-col justify-center">
                            <div class="text-[10px] font-black text-red-500 uppercase tracking-widest">Episode ${ep.episode_number}</div>
                            <div class="text-xs font-extrabold text-white truncate max-w-full mt-0.5" title="${ep.name}">${ep.name}</div>
                            <div class="text-[9px] text-zinc-500 line-clamp-2 mt-1 leading-normal">${ep.overview || 'No description recorded.'}</div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            } catch(e) {
                console.error(e);
                grid.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-red-500 font-bold uppercase">Failed to load episodes</div>';
            }
        }

        function closeDetailsModal() {
            document.getElementById('detailsModal').classList.add('hidden');
            document.body.style.overflow = ''; if(window.lenis) window.lenis.start();
            if (window.detailsTrailerTimeout) clearTimeout(window.detailsTrailerTimeout);

            // stop background trailer
            document.getElementById('trailerBgIframe').src = '';
            document.getElementById('trailerBgContainer').classList.add('opacity-0');
        }
        
        function closePersonDetailsModal() {
            document.getElementById('personDetailsModal').classList.add('hidden');
        }

        async function openPersonDetails(personId) {
            const modal = document.getElementById('personDetailsModal');
            modal.classList.remove('hidden');
            
            document.getElementById('personName').textContent = "Loading...";
            document.getElementById('personBiography').textContent = "";
            document.getElementById('personKnownForGrid').innerHTML = "";
            document.getElementById('personTags').innerHTML = "";
            
            try {
                const data = await fetchTMDB(`person/${personId}`, { append_to_response: 'combined_credits' });
                
                document.getElementById('personName').textContent = data.name;
                document.getElementById('personBiography').textContent = data.biography || "No biography available.";
                
                const profile = data.profile_path ? `https://image.tmdb.org/t/p/w500${data.profile_path}` : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&h=500';
                document.getElementById('personProfileImage').src = profile;
                
                let tags = [];
                if (data.known_for_department) tags.push(data.known_for_department);
                if (data.place_of_birth) tags.push(data.place_of_birth);
                if (data.birthday) tags.push(data.birthday);
                
                document.getElementById('personTags').innerHTML = tags.map(t => `<span class="bg-white/5 border border-white/10 px-2 py-0.5 rounded">${t}</span>`).join('');
                
                // Known For Grid
                let credits = data.combined_credits?.cast || [];
                // Sort by popularity and vote_count
                credits.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
                credits = credits.slice(0, 15);
                
                const grid = document.getElementById('personKnownForGrid');
                grid.innerHTML = '';
                
                credits.forEach(item => {
                    const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
                    const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                    const title = item.title || item.name;
                    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                    const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
                    
                    const card = document.createElement('div');
                    card.className = "w-32 shrink-0 group cursor-pointer space-y-2 hover:scale-105 transition-transform duration-300";
                    card.onclick = () => {
                        closePersonDetailsModal();
                        openDetails(item.id, type);
                    };
                    card.innerHTML = `
                        <div class="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:border-red-500/50 transition-colors">
                            <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
                            <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 shadow-xl">
                                <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                            </div>
                        </div>
                        <h4 class="text-[10px] font-black text-white uppercase tracking-wider truncate leading-tight group-hover:text-red-400">${title}</h4>
                        <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">${year} • ${type === 'tv' ? 'Series' : 'Movie'}</p>
                        <p class="text-[8px] font-bold text-red-500/80 uppercase tracking-widest truncate">${item.character ? 'as ' + item.character : ''}</p>
                    `;
                    grid.appendChild(card);
                });
                lucide.createIcons();
                
            } catch(e) {
                console.error("Error loading person:", e);
                document.getElementById('personName').textContent = "Failed to load details.";
            }
        }

        function scrollToPlayerStage() {
            document.getElementById('playerStage').scrollIntoView({ behavior: 'smooth' });
        }

        // SERVER / RESOLVER CONTROLLER
        // Standalone Fullscreen Theater Player Engine
        function changeServerFromFullscreen() {
            startActualFullscreenPlayback();
        }

        function toggleFullscreenTheater() {
            const playerWrapper = document.getElementById('cinemaPlayerWrapper');
            if (!playerWrapper) return;
            if (!document.fullscreenElement) {
                playerWrapper.requestFullscreen().catch(err => {
                    showToast("Error entering fullscreen: " + err.message);
                });
            } else {
                document.exitFullscreen();
            }
        }

        function closeDummyPlayer() {
            document.getElementById('dummyPlayContainer').classList.add('hidden');
            const video = document.getElementById('dummyVideoPlayer');
            video.pause();
            video.src = '';
            if (window.dummyHlsInstance) {
                window.dummyHlsInstance.destroy();
                window.dummyHlsInstance = null;
            }
        }

        async function openFullscreenPlayer(sportsUrl = null, sportsName = null) {
            closeDetailsModal();
            
            // 1. Check if Sports (live channel stream)
            if (sportsUrl) {
                window.location.href = `play_consumet.php?url=${encodeURIComponent(sportsUrl)}&name=${encodeURIComponent(sportsName || "Live Channel")}&source=consumet.html`;
                return;
            }

            const frame = document.getElementById('fullscreenVideoIframe');
            const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
            const nativePlayer = document.getElementById('fullscreenNativePlayer');
            const epNavigator = document.getElementById('playerUpNextContainer');
            const serverNav = document.getElementById('playerServerSelector');
            
            // Show player view
            switchTab('player');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // 2. Movie or Series Playback
            if (!selectedMedia) return;
            
            const title = selectedMedia.title || selectedMedia.name;
            document.getElementById('playerTitleLabel').textContent = title;
            document.getElementById('playerSubtitleLabel').textContent = selectedMedia.type === 'tv' ? `Season ${selectedSeason} • Episode ${selectedEpisode}` : `Feature Film (${(selectedMedia.release_date || '').split('-')[0]})`;
            
            if (serverNav) {
                serverNav.classList.remove('hidden');
                serverNav.value = currentServer || 'smashystream';
            }
            
            // Set up placeholder bg image
            const placeholder = document.getElementById('fullscreenPlayerPlaceholder');
            const placeholderMediaTitle = document.getElementById('fullscreenPlaceholderMediaTitle');
            if (placeholder) {
                const backdrop = selectedMedia.backdrop_path ? `https://image.tmdb.org/t/p/original${selectedMedia.backdrop_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=1280';
                placeholder.style.backgroundImage = `url('${backdrop}')`;
                placeholder.classList.remove('hidden'); // Show overlay and click-to-play placeholder
            }
            if (placeholderMediaTitle) {
                placeholderMediaTitle.textContent = title;
            }

            if (selectedMedia.type === 'tv') {
                const controls = document.getElementById('tvEpisodeControls');
                if (controls) controls.classList.remove('hidden');
                if (epNavigator) epNavigator.classList.remove('hidden');
                renderPlayerEpisodesList();
            } else {
                if (epNavigator) epNavigator.classList.add('hidden');
                const controls = document.getElementById('tvEpisodeControls');
                if (controls) controls.classList.add('hidden');
            }

            // Hide iframe initially, show placeholder overlay
            frame.classList.add('hidden');
            nativeContainer.classList.add('hidden');
            frame.src = '';

            // Save to Watch History
            saveToWatchHistory();
            
            // Load Recommendations
            fetchRecommendations(selectedMedia.id, selectedMedia.type);
        }

        async function fetchRecommendations(mediaId, type) {
            const container = document.getElementById("playerRecommendationsContainer");
            const grid = document.getElementById("playerRecommendationsGrid");
            grid.innerHTML = "<div class=\"text-xs font-bold text-zinc-500 uppercase\">Loading...</div>";
            container.classList.remove("hidden");
            
            try {
                const data = await fetchTMDB(`${type}/${mediaId}/recommendations`);
                if (data && data.results && data.results.length > 0) {
                    grid.innerHTML = "";
                    data.results.slice(0, 15).forEach(item => {
                        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop";
                        const title = item.title || item.name;
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : "NR";
                        const year = (item.release_date || item.first_air_date || "").split("-")[0] || "";
                        
                        const card = document.createElement("div");
                        card.className = "w-32 shrink-0 group cursor-pointer space-y-2 hover:scale-105 transition-transform duration-300";
                        card.onclick = () => {
                            switchTab("home");
                            openDetails(item.id, type);
                        };
                        card.innerHTML = `
                            <div class="relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg border border-white/10 group-hover:border-red-500/50 transition-colors">
                                <img src="${poster}" alt="${title}" class="w-full h-full object-cover">
                                <div class="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 border border-white/10 shadow-xl">
                                    <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                                </div>
                            </div>
                            <h4 class="text-[10px] font-black text-white uppercase tracking-wider truncate leading-tight group-hover:text-red-400">${title}</h4>
                            <p class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">${year}</p>
                        `;
                        grid.appendChild(card);
                    });
                    lucide.createIcons();
                } else {
                    container.classList.add("hidden");
                }
            } catch(e) {
                container.classList.add("hidden");
            }
        }
        
        function playNextEpisode() {
            if (!selectedMedia || selectedMedia.type !== 'tv') return;
            selectedEpisode++;
            // We should re-render or re-open the player for the new episode
            openFullscreenPlayer();
        }

        function playPreviousEpisode() {
            if (!selectedMedia || selectedMedia.type !== 'tv') return;
            if (selectedEpisode > 1) {
                selectedEpisode--;
                openFullscreenPlayer();
            }
        }

        function closeFullscreenPlayer() {
            const frame = document.getElementById('fullscreenVideoIframe');
            const nativePlayer = document.getElementById('fullscreenNativePlayer');
            frame.src = '';
            nativePlayer.src = '';
            nativePlayer.innerHTML = '';
            
            // Switch back to home
            switchTab('home');
        }

        async function startActualFullscreenPlayback() {
            const select = document.getElementById('playerServerSelector');
            if (select) {
                currentServer = select.value || 'vidlink';
            } else {
                currentServer = 'vidlink';
            }

            const imdbId = selectedMedia.external_ids?.imdb_id || selectedMedia.id;
            const tmdbId = selectedMedia.id;
            const type = selectedMedia.type;

            const frame = document.getElementById('fullscreenVideoIframe');
            const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
            const nativePlayer = document.getElementById('fullscreenNativePlayer');
            const placeholder = document.getElementById('fullscreenPlayerPlaceholder');

            if (placeholder) {
                placeholder.classList.add('hidden');
            }

            frame.classList.remove('hidden');
            nativeContainer.classList.add('hidden');
            frame.src = '';
            nativePlayer.src = '';
            nativePlayer.innerHTML = '';

            // Handle server switching options
            let url = '';
            if (currentServer === 'vidsrc_to') {
                url = type === 'movie' ? `https://vidsrc.to/embed/movie/${imdbId}` : `https://vidsrc.to/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidapi') {
                url = type === 'movie' ? `https://vaplayer.ru/embed/movie/${tmdbId}` : `https://vaplayer.ru/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc2_ru') {
                url = type === 'movie' ? `https://vidsrc2.ru/embed/movie/${imdbId}` : `https://vidsrc2.ru/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_su') {
                url = type === 'movie' ? `https://vidsrc.su/embed/movie/${imdbId}` : `https://vidsrc.su/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_vip') {
                url = type === 'movie' ? `https://vidsrc.vip/embed/movie/${imdbId}` : `https://vidsrc.vip/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_rip') {
                url = type === 'movie' ? `https://vidsrc.rip/embed/movie/${imdbId}` : `https://vidsrc.rip/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_net') {
                url = type === 'movie' ? `https://vidsrc.net/embed/movie/${imdbId}` : `https://vidsrc.net/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_me') {
                url = type === 'movie' ? `https://vidsrc.me/embed/movie?imdb=${imdbId}` : `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${selectedSeason}&episode=${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_pro') {
                url = type === 'movie' ? `https://vidsrc.pro/embed/movie/${imdbId}` : `https://vidsrc.pro/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_in') {
                url = type === 'movie' ? `https://vidsrc.in/embed/movie/${imdbId}` : `https://vidsrc.in/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_pm') {
                url = type === 'movie' ? `https://vidsrc.pm/embed/movie/${imdbId}` : `https://vidsrc.pm/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'nova') {
                url = type === 'movie' ? `https://novastream.to/embed/movie/${imdbId}` : `https://novastream.to/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidsrc_cc') {
                url = type === 'movie' ? `https://vidsrc.cc/v2/embed/movie/${imdbId}` : `https://vidsrc.cc/v2/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'embed_su') {
                url = type === 'movie' ? `https://embedsu.top/embed/movie/${tmdbId}` : `https://embedsu.top/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'multiembed_mov') {
                url = type === 'movie' ? `https://multiembed.mov/get.php?video_id=${imdbId}` : `https://multiembed.mov/get.php?video_id=${imdbId}&s=${selectedSeason}&e=${selectedEpisode}`;
            } else if (currentServer === 'superembed') {
                url = type === 'movie' ? `https://multiembed.to/get.php?video_id=${imdbId}` : `https://multiembed.to/get.php?video_id=${imdbId}&s=${selectedSeason}&e=${selectedEpisode}`;
            } else if (currentServer === 'embedsu') {
                url = type === 'movie' ? `https://embed.su/embed/movie/${tmdbId}` : `https://embed.su/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidbinge') {
                url = type === 'movie' ? `https://vidbinge.dev/embed/movie/${tmdbId}` : `https://vidbinge.dev/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'smashystream') {
                url = type === 'movie' ? `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}` : `https://embed.smashystream.com/playere.php?tmdb=${tmdbId}&season=${selectedSeason}&episode=${selectedEpisode}`;
            } else if (currentServer === 'autoembed') {
                url = type === 'movie' ? `https://player.autoembed.to/movie/${tmdbId}` : `https://player.autoembed.to/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'vidlink') {
                url = type === 'movie' ? `https://vidlink.pro/movie/${tmdbId}?autoplay=true` : `https://vidlink.pro/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}?autoplay=true`;
            } else if (currentServer === 'twoembed') {
                url = type === 'movie' ? `https://www.2embed.cc/embed/${tmdbId}` : `https://www.2embed.cc/embedtv/${tmdbId}&s=${selectedSeason}&e=${selectedEpisode}`;
            } else if (currentServer === 'movieapi') {
                url = type === 'movie' ? `https://vidsrc.pm/embed/movie/${imdbId || tmdbId}` : `https://vidsrc.pm/embed/tv/${imdbId || tmdbId}/${selectedSeason}/${selectedEpisode}`;
            } else if (currentServer === 'consumet_direct') {
                frame.classList.add('hidden');
                nativeContainer.classList.remove('hidden');
                nativePlayer.innerHTML = `<source src="" type="application/x-mpegURL">`;
                
                try {
                    const searchRes = await fetch(`/api/consumet/search?q=${encodeURIComponent(selectedMedia.title || selectedMedia.name)}`);
                    const searchData = await searchRes.json();
                    if (searchData?.results?.length > 0) {
                        const match = searchData.results[0];
                        const provider = searchData.provider || 'FlixHQ';
                        const infoRes = await fetch(`/api/consumet/info?id=${encodeURIComponent(match.id)}&provider=${encodeURIComponent(provider)}`);
                        const infoData = await infoRes.json();
                        
                        let targetEp = infoData.episodes?.[0];
                        if (type === 'tv') {
                            targetEp = infoData.episodes?.find(ep => ep.number == selectedEpisode && ep.season == selectedSeason) || targetEp;
                        }
                        
                        if (targetEp) {
                            const srcRes = await fetch(`/api/consumet/sources?episodeId=${encodeURIComponent(targetEp.id)}&mediaId=${encodeURIComponent(infoData.id)}&provider=${encodeURIComponent(provider)}`);
                            const srcData = await srcRes.json();
                            const bestSource = srcData.sources?.find(s => s.isM3U8 || s.url.includes('.m3u8')) || srcData.sources?.[0];
                            if (bestSource) {
                                playFullscreenM3U8(bestSource.url);
                                return;
                            }
                        }
                    }
                } catch(e){}
                
                showToast("Direct stream failed, falling back to VidSrc.to");
                select.value = "vidsrc_to";
                currentServer = "vidsrc_to";
                frame.classList.remove('hidden');
                nativeContainer.classList.add('hidden');
                url = type === 'movie' ? `https://vidsrc.to/embed/movie/${imdbId}` : `https://vidsrc.to/embed/tv/${imdbId}/${selectedSeason}/${selectedEpisode}`;
            }

            // Automatically append high quality parameters to stream provider URLs
            if (url && url.startsWith('http')) {
                const hasQuery = url.includes('?');
                url += (hasQuery ? '&' : '?') + 'quality=1080&hd=1&vq=hd1080';
            }

            frame.src = url;
        }

        function playFullscreenM3U8(url) {
            const frame = document.getElementById('fullscreenVideoIframe');
            const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
            const video = document.getElementById('fullscreenNativePlayer');
            
            // Stop native player if playing
            try { video.pause(); video.removeAttribute('src'); video.load(); } catch(e){}
            
            // Show iframe
            frame.classList.remove('hidden');
            nativeContainer.classList.add('hidden');
            
            let streamName = selectedMedia ? (selectedMedia.title || selectedMedia.name) : 'Consumet Stream';
            frame.src = `/play_consumet.php?url=${encodeURIComponent(url)}&name=${encodeURIComponent(streamName)}`;
        }

        function changeFullscreenServer() {
            startActualFullscreenPlayback();
        }

        async function renderPlayerEpisodesList() {
            const grid = document.getElementById('playerEpisodesList');
            if (!grid) return;
            grid.innerHTML = '<div class="shrink-0 py-4 text-center text-xs text-zinc-500 font-bold uppercase">Loading up next episodes...</div>';

            try {
                const data = await fetchTMDB(`tv/${selectedMedia.id}/season/${selectedSeason}`);
                grid.innerHTML = '';
                const eps = data.episodes || [];
                eps.forEach(ep => {
                    const fallbackThumb = 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=300&h=169&q=80';
                    const thumb = ep.still_path ? `https://image.tmdb.org/t/p/w300${ep.still_path}` : fallbackThumb;
                    
                    const card = document.createElement('div');
                    const isActive = ep.episode_number === selectedEpisode;
                    
                    card.className = "shrink-0 w-52 xs:w-64 bg-zinc-950/60 border rounded-xl overflow-hidden cursor-pointer p-2 xs:p-2.5 flex gap-2.5 xs:gap-3 hover:border-red-500/40 transition-all transform active:scale-[0.98] " + (isActive ? "border-red-600/80 bg-red-600/5 glow-red-sm" : "border-white/5");
                    card.onclick = () => {
                        selectedEpisode = ep.episode_number;
                        openFullscreenPlayer();
                    };

                    card.innerHTML = `
                        <img src="${thumb}" onerror="this.src='${fallbackThumb}'" alt="Ep" class="w-16 xs:w-20 aspect-video rounded-lg object-cover shrink-0 bg-zinc-900 border border-white/5">
                        <div class="min-w-0 text-left flex flex-col justify-center">
                            <div class="text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-red-500 animate-pulse' : 'text-zinc-400'}">Episode ${ep.episode_number} ${isActive ? '• Playing' : ''}</div>
                            <div class="text-[11px] xs:text-xs font-extrabold text-white truncate max-w-full mt-0.5" title="${ep.name}">${ep.name}</div>
                        </div>
                    `;
                    grid.appendChild(card);
                });
            } catch(e) {
                console.error(e);
                grid.innerHTML = '<div class="shrink-0 py-4 text-center text-xs text-red-500 font-bold uppercase">Failed to load episodes</div>';
            }
        }

        // 5. LOCAL STORAGE STORAGE STATE ENGINE
        
        function toggleCardWatchlist(event, itemJsonStr) {
            event.stopPropagation();
            event.preventDefault();
            const item = JSON.parse(decodeURIComponent(itemJsonStr));
            const list = getWatchlist();
            const exists = list.some(w => w.id == item.id);
            
            if (exists) {
                const updated = list.filter(w => w.id != item.id);
                localStorage.setItem('stalker_my_list', JSON.stringify(updated));
                showToast("Removed from Watchlist");
            } else {
                list.push({
                    id: item.id,
                    title: item.title || item.name,
                    poster_path: item.poster_path,
                    vote_average: item.vote_average,
                    release_date: item.release_date || item.first_air_date,
                    media_type: item.media_type
                });
                localStorage.setItem('stalker_my_list', JSON.stringify(list));
                showToast("Added to Watchlist!");
            }
            
            // Re-render based on active tab
            if (activeTab === 'watchlist') {
                renderWatchlist();
            } else {
                // If we are in movies/series/search, we might need to re-render the specific grid to update the heart icon.
                // For simplicity, we just rebuild the lucide icons, but to change the color we need a full re-render.
                // We can find the button and toggle its class.
                const btn = event.currentTarget;
                const icon = btn.querySelector('i');
                if (exists) {
                    icon.classList.remove('fill-pink-500', 'text-pink-500');
                    icon.classList.add('text-zinc-500');
                } else {
                    icon.classList.add('fill-pink-500', 'text-pink-500');
                    icon.classList.remove('text-zinc-500');
                }
            }
        }

        function getWatchlist() {
            return JSON.parse(localStorage.getItem('stalker_my_list') || '[]');
        }

        function toggleWatchlist() {
            if (!selectedMedia) return;
            const list = getWatchlist();
            const exists = list.some(item => item.id == selectedMedia.id);
            
            if (exists) {
                const updated = list.filter(item => item.id != selectedMedia.id);
                localStorage.setItem('stalker_my_list', JSON.stringify(updated));
                showToast("Removed from Watchlist");
            } else {
                list.push({
                    id: selectedMedia.id,
                    title: selectedMedia.title || selectedMedia.name,
                    poster_path: selectedMedia.poster_path,
                    vote_average: selectedMedia.vote_average,
                    release_date: selectedMedia.release_date || selectedMedia.first_air_date,
                    media_type: selectedMedia.type
                });
                localStorage.setItem('stalker_my_list', JSON.stringify(list));
                showToast("Added to Watchlist!");
            }
            updateWatchlistBtnState();
            if (activeTab === 'watchlist') renderWatchlist();
        }

        function updateWatchlistBtnState() {
            if (!selectedMedia) return;
            const btn = document.getElementById('btn-watchlist-toggle');
            const list = getWatchlist();
            const exists = list.some(item => item.id == selectedMedia.id);
            
            if (exists) {
                btn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-red-500"></i> Saved to List`;
            } else {
                btn.innerHTML = `<i data-lucide="bookmark" class="w-4 h-4"></i> Add to List`;
            }
            lucide.createIcons();
        }

        function renderWatchlist() {
            const grid = document.getElementById('watchlistGrid');
            const list = getWatchlist();
            grid.innerHTML = '';
            
            if (list.length === 0) {
                grid.innerHTML = `
                    <div class="col-span-full py-20 text-center text-zinc-500 bg-zinc-950/40 border border-white/5 rounded-3xl p-6">
                        <i data-lucide="bookmark-x" class="w-12 h-12 text-zinc-600 mx-auto mb-3"></i>
                        <p class="text-sm font-extrabold uppercase tracking-wider">Your watchlist is empty</p>
                        <p class="text-xs text-zinc-600 mt-1">Bookmark movies and series to quickly find them later.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }
            renderFilterGrid(list, 'watchlistGrid', 'movie');
        }

        // Continue Watching Engine
        function saveToWatchHistory(imdbId) {
            if (!selectedMedia) return;
            const list = JSON.parse(localStorage.getItem('stalker_continue_watching') || '[]');
            const fresh = {
                id: selectedMedia.id,
                title: selectedMedia.title || selectedMedia.name,
                poster_path: selectedMedia.poster_path,
                vote_average: selectedMedia.vote_average,
                release_date: selectedMedia.release_date || selectedMedia.first_air_date,
                media_type: selectedMedia.type,
                season: selectedMedia.type === 'tv' ? selectedSeason : null,
                episode: selectedMedia.type === 'tv' ? selectedEpisode : null,
                timestamp: Date.now()
            };
            const updated = [fresh].concat(list.filter(item => item.id != selectedMedia.id)).slice(0, 15);
            localStorage.setItem('stalker_continue_watching', JSON.stringify(updated));
            renderContinueWatchingHistory();
        }

        function renderContinueWatchingHistory() {
            const list = JSON.parse(localStorage.getItem('stalker_continue_watching') || '[]');
            const grid = document.getElementById('continueWatchGrid');
            const shelf = document.getElementById('continueWatchShelf');
            const shelfTitle = document.getElementById('continueWatchShelfTitle');
            grid.innerHTML = '';

            let itemsToRender = list;
            let isDummy = false;

            if (list.length === 0) {
                isDummy = true;
                if (shelfTitle) {
                    shelfTitle.innerHTML = `Continue Watching <span class="text-xs text-indigo-400 font-black uppercase tracking-widest ml-3 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-md">&bull; Suggested Picks</span>`;
                }
                itemsToRender = [
                    { id: 693134, title: "Dune: Part Two", poster_path: "/czembb078i6vY7GgOEEv6vg.jpg", fallback_poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=300&h=450&fit=crop", media_type: "movie", label: "Special Pick" },
                    { id: 119051, title: "Wednesday", poster_path: "/9gD75vP0h8vU6vghCu9Xm4V9c.jpg", fallback_poster: "https://images.unsplash.com/photo-1509248961158-e54f6934749c?q=80&w=300&h=450&fit=crop", media_type: "tv", label: "Highly Rated", season: 1, episode: 1 },
                    { id: 157336, title: "Interstellar", poster_path: "/gEU2v646vU6m67362gSgDvdSg6A.jpg", fallback_poster: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=300&h=450&fit=crop", media_type: "movie", label: "Sci-Fi Epic" },
                    { id: 1396, title: "Breaking Bad", poster_path: "/ztkUQv6vG7mASvXvghCu9Xm4V9c.jpg", fallback_poster: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=300&h=450&fit=crop", media_type: "tv", label: "All-Time Masterpiece", season: 1, episode: 1 },
                    { id: 1434, title: "Stranger Things", poster_path: "/49Yg65S7GgOEEv6vghCu9Xm4V9c.jpg", fallback_poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=300&h=450&fit=crop", media_type: "tv", label: "Pop Culture Hit", season: 1, episode: 1 }
                ];
            } else {
                if (shelfTitle) {
                    shelfTitle.innerHTML = `Continue Watching`;
                }
            }

            shelf.classList.remove('hidden');

            itemsToRender.forEach(item => {
                const title = item.title;
                const poster = (isDummy && item.fallback_poster) ? item.fallback_poster : (item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop');
                const label = isDummy ? item.label : (item.media_type === 'tv' ? `S${item.season} Ep${item.episode}` : 'Movie');

                const card = document.createElement('div');
                card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group";
                card.onclick = () => {
                    if (item.media_type === 'tv') {
                        openDetails(item.id, item.media_type, item.season || 1, item.episode || 1);
                    } else {
                        openDetails(item.id, item.media_type);
                    }
                };

                const actionBtnHtml = isDummy 
                    ? `<button onclick="event.stopPropagation(); showToast('Added ${title.replace(/'/g, "\\'")} to Watchlist!');" class="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 border border-white/10 flex items-center justify-center text-white transition-all shadow-md active:scale-90 ">
                           <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                       </button>`
                    : `<button onclick="event.stopPropagation(); removeHistoryItem('${item.id}');" class="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-md active:scale-90 ">
                           <i data-lucide="x" class="w-3.5 h-3.5"></i>
                       </button>`;

                const tagBgColor = isDummy ? "bg-indigo-600/90 border-indigo-500/20" : "bg-red-600/90 border-red-500/20";
                const labelPrefix = isDummy ? "" : "Resume: ";

                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        ${actionBtnHtml}
                        <div class="absolute bottom-2 left-2 ${tagBgColor} text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-md border border-white/5">
                            ${labelPrefix}${label}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow">
                        <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        // 6. COMMAND PALETTE SEARCH ENGINE
        function openSearchPalette() {
            const palette = document.getElementById('searchPalette');
            palette.classList.remove('hidden');
            document.getElementById('searchInput').focus();
            document.body.style.overflow = 'hidden'; if(window.lenis) window.lenis.stop();
            lucide.createIcons();
        }

        function closeSearchPalette() {
            document.getElementById('searchPalette').classList.add('hidden');
            document.body.style.overflow = ''; if(window.lenis) window.lenis.start();
        }

        async function resolveAndPlayIMDb(queryOrUrl) {
            const match = queryOrUrl.match(/tt\d{7,10}/);
            if (!match) {
                showToast("Invalid IMDb ID or link format!");
                return false;
            }
            const imdbId = match[0];
            showToast(`Fetching IMDb ID: ${imdbId}...`);
            try {
                const data = await fetchTMDB(`find/${imdbId}`, { external_source: 'imdb_id' });
                if (data.movie_results && data.movie_results.length > 0) {
                    const movie = data.movie_results[0];
                    showToast(`Found Movie: ${movie.title || movie.original_title}`);
                    openDetails(movie.id, 'movie');
                    return true;
                } else if (data.tv_results && data.tv_results.length > 0) {
                    const tv = data.tv_results[0];
                    showToast(`Found TV Show: ${tv.name || tv.original_name}`);
                    openDetails(tv.id, 'tv');
                    return true;
                } else {
                    showToast("No TMDB matches found for this IMDb ID!");
                    return false;
                }
            } catch(e) {
                console.error(e);
                showToast("Error connecting to TMDB to resolve IMDb!");
                return false;
            }
        }

        async function fetchIMDbItem() {
            const input = document.getElementById('imdbFetcherInput');
            if (!input) return;
            const val = input.value.trim();
            if (!val) {
                showToast("Please paste an IMDb link or ID!");
                return;
            }
            const success = await resolveAndPlayIMDb(val);
            if (success) {
                input.value = '';
            }
        }

        function debounceSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(executeSearch, 400);
        }

        async function executeSearch() {
            const query = document.getElementById('searchInput').value.trim();
            const resultsDiv = document.getElementById('searchResults');
            
            if (!query) {
                resultsDiv.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">Type a title to search...</div>';
                return;
            }

            if (query.includes('imdb.com') || query.match(/tt\d{7,10}/)) {
                resultsDiv.innerHTML = `
                    <div class="flex flex-col items-center justify-center py-10 space-y-4">
                        <div class="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
                            <i data-lucide="link" class="w-6 h-6 text-yellow-500"></i>
                            <span class="text-xs font-black text-white uppercase tracking-wider">Detected IMDb Link/ID</span>
                        </div>
                        <p class="text-xs text-zinc-400 text-center max-w-sm">Press Enter or click below to resolve and play this title directly.</p>
                        <button onclick="resolveAndPlayIMDb('${query}'); closeSearchPalette();" class="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 shadow-lg active:scale-95">
                            <i data-lucide="play" class="w-4 h-4 fill-black text-black"></i> Resolve & Play
                        </button>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            resultsDiv.innerHTML = '<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Searching Catalogs & EPG...</div>';

            try {
                let htmlOutput = '';
                
                let epgMatches = [];
                if (window.allSportsChannels) {
                    const q = query.toLowerCase();
                    const normalizeName = (name) => name.replace(/\[.*?\]|\(.*?\)|\|.*/g, '').replace(/\b(hd|fhd|4k|sd)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();

                    for (const ch of window.allSportsChannels) {
                        let matchTitle = null;
                        let matchType = null;
                        
                        // Check channel name
                        if (ch.name.toLowerCase().includes(q)) {
                            matchTitle = ch.name;
                            matchType = 'channel';
                        } else {
                            // Try EPG lookup
                            if (window.epgChannels && window.epgProgrammesByChannel) {
                                const cleanName = normalizeName(ch.name);
                                const matchedEpgChan = window.epgChannels.find(c => {
                                    const cName = normalizeName(c.name);
                                    if (!cName || !cleanName) return false;
                                    if (cName === cleanName) return true;
                                    if (cName.length > 4 && cleanName.includes(cName)) return true;
                                    if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                    return false;
                                });
                                
                                if (matchedEpgChan) {
                                    const progs = window.epgProgrammesByChannel[matchedEpgChan.id] || [];
                                    const progMatch = progs.find(p => p.title && p.title.toLowerCase().includes(q));
                                    if (progMatch) {
                                        matchTitle = progMatch.title;
                                        matchType = 'program';
                                    }
                                }
                            }
                        }
                        
                        if (matchTitle) {
                            epgMatches.push({ type: matchType, title: matchTitle, channel: ch });
                        }
                        if (epgMatches.length >= 10) break;
                    }
                }

                if (epgMatches.length > 0) {
                    htmlOutput += '<div class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 px-1">Live Channels & Events</div>';
                    htmlOutput += '<div class="grid grid-cols-1 gap-2 mb-4">';
                    
                    epgMatches.forEach(match => {
                        const subTitle = match.type === 'program' ? 'On: ' + match.channel.name : 'Live Channel';
                        const logo = (typeof getSportsLogo === 'function') ? getSportsLogo(match.channel) : (match.channel.logo || '');
                        const url = match.channel.url || match.channel.stream_url;
                        const titleSafe = match.title.replace(/'/g, "\\&apos;").replace(/"/g, '&quot;');
                        
                        htmlOutput += `
                        <div class="flex items-center gap-3 p-3 bg-amber-950/20 hover:bg-amber-900/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all transform active:scale-[0.99] group" 
                             onclick="closeSearchPalette(); openFullscreenPlayer('${url}', '${titleSafe}');">
                            <div class="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <img src="${logo}" class="max-w-full max-h-full object-contain" onerror="this.outerHTML='<i data-lucide=\'play\' class=\'w-5 h-5 text-amber-500\'></i>'">
                            </div>
                            <div class="min-w-0 flex-grow text-left">
                                <div class="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> ${subTitle}</div>
                                <div class="text-sm font-extrabold text-white truncate mt-0.5" title="${match.title}">${match.title}</div>
                            </div>
                            <i data-lucide="play" class="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors shrink-0"></i>
                        </div>`;
                    });
                    htmlOutput += '</div>';
                }

                const data = await fetchTMDB('search/multi', { query });
                const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 12);
                
                if (filtered.length > 0) {
                    htmlOutput += '<div class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2 px-1 mt-2">Movies & Series</div>';
                    htmlOutput += '<div class="grid grid-cols-1 gap-2">';
                    filtered.forEach(item => {
                        const title = item.title || item.name || "Untitled";
                        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=90&h=135&fit=crop';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                        const label = item.media_type === 'tv' ? 'Series' : 'Movie';
                        
                        htmlOutput += `
                            <div class="flex items-center gap-4 p-3 bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 hover:border-red-500/20 rounded-2xl cursor-pointer transition-all transform active:scale-[0.99] group" onclick="closeSearchPalette(); openDetails(${item.id}, '${item.media_type}')">
                                <img src="${poster}" alt="Poster" class="w-12 h-18 rounded-lg object-cover shrink-0 bg-zinc-900 border border-white/5">
                                <div class="min-w-0 text-left flex-grow">
                                    <div class="text-xs font-black text-red-500 uppercase tracking-widest">${label} &bull; ${year}</div>
                                    <div class="text-sm font-extrabold text-white truncate group-hover:text-red-500 transition-colors mt-0.5" title="${title.replace(/"/g, '&quot;')}">${title}</div>
                                    <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><i data-lucide="star" class="w-3 h-3 fill-red-500 text-red-500"></i> ${rating} TMDB User Score</div>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors shrink-0"></i>
                            </div>`;
                    });
                    htmlOutput += '</div>';
                }

                if (htmlOutput === '') {
                    resultsDiv.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">No matching cinema or live events found</div>';
                } else {
                    resultsDiv.innerHTML = htmlOutput;
                    if (window.lucide) lucide.createIcons();
                }

            } catch(e) {
                console.error(e);
                resultsDiv.innerHTML = '<div class="text-center py-10 text-red-500 text-xs font-bold uppercase tracking-widest">Search failed</div>';
            }
        }

        function launchTabSearch(query) {
            document.getElementById('searchQueryLabel').textContent = `"${query}"`;
            switchTab('search');
            
            const grid = document.getElementById('searchGrid');
            grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-zinc-500 font-bold uppercase animate-pulse">Running advanced catalog lookup...</div>';
            
            fetchTMDB('search/multi', { query: query, page: 1 })
                .then(data => {
                    grid.innerHTML = '';
                    const results = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
                    if (results.length === 0) {
                        grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-zinc-500 font-bold uppercase">No matching titles found in the global index</div>';
                        return;
                    }
                    results.forEach(item => {
                        const title = item.title || item.name || "Untitled";
                        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                        const type = item.media_type;
                        
                        const card = document.createElement('div');
                        card.className = "w-full bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-red-500/30 transition-card relative flex flex-col group shadow-lg";
                        card.onclick = () => openDetails(item.id, type);
                        
                        card.innerHTML = `
                            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                                <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                <div class="absolute top-2 right-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md">
                                    <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                                </div>
                            </div>
                            <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                                <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                                <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                    <span>${year}</span>
                                    <span class="text-red-500 font-extrabold">${type === 'tv' ? 'Series' : 'Movie'}</span>
                                </div>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                    lucide.createIcons();
                })
                .catch(err => {
                    console.error(err);
                    grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-red-500 font-bold uppercase">Search connection failed</div>';
                });
        }

        function removeHistoryItem(id) {
            let list = JSON.parse(localStorage.getItem('stalker_continue_watching') || '[]');
            list = list.filter(item => item.id != id);
            localStorage.setItem('stalker_continue_watching', JSON.stringify(list));
            renderContinueWatchingHistory();
            showToast("Removed from continue watching");
        }

        // Toast notifications
        function showToast(msg) {
            const toast = document.getElementById('toast');
            document.getElementById('toastText').textContent = msg;
            toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
            toast.classList.add('opacity-100', 'translate-y-0');
            setTimeout(() => {
                toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-2');
                toast.classList.remove('opacity-100', 'translate-y-0');
            }, 3000);
            lucide.createIcons();
        }

        // Spotlight Slider Functions
        let spotlightSlides = [];
        let currentSlideIndex = 0;
        let spotlightInterval = null;

        async function loadHomeSpotlight() {
            try {
                const data = await fetchTMDB('trending/all/week');
                spotlightSlides = (data.results || []).slice(0, 8);
                if (spotlightSlides.length === 0) return;
                
                renderSpotlightSlide(0);
                
                if (spotlightInterval) clearInterval(spotlightInterval);
                spotlightInterval = setInterval(() => {
                    nextSpotlightSlide();
                }, 6000);
            } catch(e) {
                console.error(e);
            }
        }

        window.spotlightTrailerPlaying = false;
        window.isSpotlightMuted = true;

        window.isDetailsTrailerMuted = true;
        window.isDetailsTrailerPlaying = true;

        window.toggleDetailsTrailerMute = function() {
            const iframe = document.getElementById('trailerBgIframe');
            const icon = document.getElementById('detailsTrailerMuteIcon');
            if (!iframe) return;

            window.isDetailsTrailerMuted = !window.isDetailsTrailerMuted;
            const command = window.isDetailsTrailerMuted ? 'mute' : 'unMute';
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');

            if (icon) {
                icon.setAttribute('data-lucide', window.isDetailsTrailerMuted ? 'volume-x' : 'volume-2');
                lucide.createIcons();
            }
        };

        window.toggleDetailsTrailerPlay = function() {
            const iframe = document.getElementById('trailerBgIframe');
            const icon = document.getElementById('detailsTrailerPlayIcon');
            if (!iframe) return;

            window.isDetailsTrailerPlaying = !window.isDetailsTrailerPlaying;
            const command = window.isDetailsTrailerPlaying ? 'playVideo' : 'pauseVideo';
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');

            if (icon) {
                icon.setAttribute('data-lucide', window.isDetailsTrailerPlaying ? 'pause' : 'play');
                if (window.isDetailsTrailerPlaying) {
                    icon.classList.add('fill-white');
                } else {
                    icon.classList.remove('fill-white');
                }
                lucide.createIcons();
            }
        };

        window.toggleSpotlightMute = function(itemId) {
            const iframe = document.getElementById(`spotlightIframe-${itemId}`);
            const icon = document.getElementById(`spotlightMuteIcon-${itemId}`);
            if (!iframe) return;

            window.isSpotlightMuted = !window.isSpotlightMuted;
            const command = window.isSpotlightMuted ? 'mute' : 'unMute';
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');

            if (icon) {
                if (window.isSpotlightMuted) {
                    icon.setAttribute('data-lucide', 'volume-x');
                } else {
                    icon.setAttribute('data-lucide', 'volume-2');
                }
                lucide.createIcons();
            }
        };

        async function renderSpotlightSlide(index) {
            if (spotlightSlides.length === 0) return;
            currentSlideIndex = index;
            window.spotlightTrailerPlaying = false; // Reset on slide load
            const container = document.getElementById('heroSliderContainer');
            const item = spotlightSlides[index];
            const backdrop = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;
            const title = item.title || item.name || "Cinema Showcase";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
            const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
            const type = item.media_type === 'tv' ? 'Series' : 'Movie';
            const overview = item.overview || "Stream high definition ad-free blockbusters direct from multiple secure cloud backup mirrors.";

            // Dynamically update page backdrop on home tab to match current spotlight
            if (activeTab === 'home' && item.backdrop_path) {
                document.body.style.transition = "background-image 1.5s ease-in-out";
                document.body.style.backgroundImage = `radial-gradient(circle at center, rgba(5, 7, 10, 0.75), rgba(5, 7, 10, 1)), url('${backdrop}')`;
                document.body.style.backgroundAttachment = "fixed";
                document.body.style.backgroundSize = "cover";
                document.body.style.backgroundPosition = "center";
            }

            let trailerBtnHtml = '';
            let trailerKey = null;
            try {
                const vidData = await fetchTMDB(`${item.media_type || 'movie'}/${item.id}/videos`);
                const trailer = vidData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vidData.results?.find(v => v.site === 'YouTube');
                if (trailer) {
                    trailerKey = trailer.key;
                    trailerBtnHtml = `
                        <button onclick="playTrailerPopup('${trailer.key}', '${encodeURIComponent(title)}')" class="px-5 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 transform active:scale-95">
                            <i data-lucide="play" class="w-4 h-4 text-red-500"></i> Watch Trailer
                        </button>
                    `;
                }
            } catch (err) {
                console.warn("Failed to fetch spotlight trailer", err);
            }

            container.innerHTML = `
                <div id="spotlightStaticBg-${item.id}" class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('${backdrop}')"></div>
                <!-- YouTube Trailer Background (Delayed Autoplay) -->
                <div id="spotlightTrailerBg-${item.id}" class="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-1000 z-[1] overflow-hidden"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/50 to-transparent z-10"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#05070a]/90 via-transparent to-transparent z-10"></div>
                
                <div class="absolute bottom-6 right-6 flex items-center gap-2 z-20">
                    ${spotlightSlides.map((_, i) => `
                        <button onclick="selectSpotlightSlide(${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-red-600 w-6' : 'bg-white/30 hover:bg-white/50'}"></button>
                    `).join('')}
                </div>

                <!-- Floating Mute Button for Spotlight Background Trailer -->
                <button id="spotlightMuteBtn-${item.id}" onclick="toggleSpotlightMute('${item.id}')" class="hidden absolute bottom-6 right-32 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black border border-white/10 flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95">
                    <i id="spotlightMuteIcon-${item.id}" data-lucide="volume-x" class="w-4 h-4 text-white"></i>
                </button>

                <button onclick="prevSpotlightSlide()" class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 border border-white/5 flex items-center justify-center text-white/70 hover:text-white transition-all transform active:scale-95 hidden sm:flex">
                    <i data-lucide="chevron-left" class="w-5 h-5"></i>
                </button>
                <button onclick="nextSpotlightSlide()" class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/80 border border-white/5 flex items-center justify-center text-white/70 hover:text-white transition-all transform active:scale-95 hidden sm:flex">
                    <i data-lucide="chevron-right" class="w-5 h-5"></i>
                </button>

                <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">
                    <div class="flex flex-wrap items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <span class="bg-red-600 text-white px-2.5 py-0.5 rounded-md glow-red animate-pulse">Featured Spotlight</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-white/5"><i data-lucide="star" class="w-3 h-3 fill-red-500 text-red-500"></i> ${rating}</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md border border-white/5">${year}</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md border border-white/5 text-indigo-400">${type}</span>
                    </div>
                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">${title}</h1>
                    <p class="text-sm text-slate-300 leading-relaxed max-w-lg line-clamp-3">${overview}</p>
                    <div class="flex flex-wrap items-center gap-3 pt-4">
                        <button onclick="openDetails('${item.id}', '${item.media_type || 'movie'}')" class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 transform active:scale-95"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Now</button>
                        ${trailerBtnHtml}
                        <button onclick="openDetails('${item.id}', '${item.media_type || 'movie'}')" class="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"><i data-lucide="info" class="w-4 h-4"></i> Info</button>
                    </div>
                </div>
            `;
            lucide.createIcons();

            // Background trailer delayed autoplay
            if (trailerKey) {
                setTimeout(() => {
                    if (currentSlideIndex === index && activeTab === 'home') {
                        const trailerEl = document.getElementById(`spotlightTrailerBg-${item.id}`);
                        const staticBg = document.getElementById(`spotlightStaticBg-${item.id}`);
                        const muteBtn = document.getElementById(`spotlightMuteBtn-${item.id}`);
                        if (trailerEl) {
                            trailerEl.innerHTML = `<iframe id="spotlightIframe-${item.id}" class="w-full h-[140%] -translate-y-[10%] scale-110 pointer-events-none" src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&vq=medium" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
                            trailerEl.classList.remove('opacity-0');
                            trailerEl.classList.add('opacity-100');
                            if (staticBg) {
                                staticBg.classList.add('opacity-0'); // No image of movie when trailer plays
                            }
                            window.spotlightTrailerPlaying = true; // Stay on this slide while trailer plays
                            if (muteBtn) {
                                muteBtn.classList.remove('hidden');
                            }
                        }
                    }
                }, 2000);
            }
        }

        function nextSpotlightSlide() {
            if (spotlightSlides.length === 0) return;
            const nextIdx = (currentSlideIndex + 1) % spotlightSlides.length;
            renderSpotlightSlide(nextIdx);
        }

        function prevSpotlightSlide() {
            if (spotlightSlides.length === 0) return;
            const prevIdx = (currentSlideIndex - 1 + spotlightSlides.length) % spotlightSlides.length;
            renderSpotlightSlide(prevIdx);
        }

        function selectSpotlightSlide(index) {
            window.spotlightTrailerPlaying = false; // Reset state
            if (spotlightInterval) clearInterval(spotlightInterval);
            renderSpotlightSlide(index);
            spotlightInterval = setInterval(() => {
                nextSpotlightSlide();
            }, 6000);
        }

        // Trailer Play Popups
        function playTrailerPopup(key, title) {
            const modal = document.getElementById('trailerModal');
            const iframe = document.getElementById('trailerIframe');
            iframe.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0&vq=medium`;
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; if(window.lenis) window.lenis.stop();
            lucide.createIcons();
        }

        function closeTrailerPopup() {
            const modal = document.getElementById('trailerModal');
            const iframe = document.getElementById('trailerIframe');
            iframe.src = '';
            modal.classList.add('hidden');
            if (!document.getElementById('detailsModal').classList.contains('hidden')) {
                document.body.style.overflow = 'hidden'; if(window.lenis) window.lenis.stop();
            } else {
                document.body.style.overflow = ''; if(window.lenis) window.lenis.start();
            }
        }

        function playSelectedTrailer() {
            if (window.currentTrailerKey) {
                playTrailerPopup(window.currentTrailerKey, selectedMedia?.title || selectedMedia?.name || "Trailer");
            } else {
                showToast("No trailer found for this title.");
            }
        }

        // Active Streaming Execution (requires user click)
        function startActualPlayback() {
            document.getElementById('playerPlaceholder').classList.add('hidden');
            changeServer();
        }

        // Anime View Engine
        let animePage = 1;
        let animeList = [];
        let animeSearchQuery = '';
        let animeHomeLoaded = false;

        async function loadAnimeCatalog() {
            const grid = document.getElementById('animeGrid');
            const btn = document.getElementById('btn-load-anime');
            const animeHomeLayout = document.getElementById('animeHomeLayout');
            const animeCatalogLayout = document.getElementById('animeCatalogLayout');

            const genre = document.getElementById('anime-genre').value;
            const query = document.getElementById('animeSearchInput').value.trim();

            // 1. If no search query and no genre filter is selected, show beautiful Home UI layout
            if (!genre && !query) {
                if (animeHomeLayout) animeHomeLayout.classList.remove('hidden');
                if (animeCatalogLayout) animeCatalogLayout.classList.add('hidden');
                
                if (!animeHomeLoaded) {
                    await loadAnimeHomeData();
                    animeHomeLoaded = true;
                }
                return;
            }

            // 2. Otherwise, switch to search/filter Catalog Grid Layout
            if (animeHomeLayout) animeHomeLayout.classList.add('hidden');
            if (animeCatalogLayout) animeCatalogLayout.classList.remove('hidden');

            if (animePage === 1) {
                grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-zinc-500 font-bold uppercase">Gathering anime list...</div>';
            }
            
            try {
                let data;
                if (query) {
                    data = await fetchTMDB('search/tv', { query, page: animePage });
                } else {
                    const params = {
                        with_genres: '16',
                        with_original_language: 'ja',
                        sort_by: 'popularity.desc',
                        page: animePage
                    };
                    if (genre) {
                        params.with_genres = `16,${genre}`;
                    }
                    data = await fetchTMDB('discover/tv', params);
                }
                
                const results = data.results || [];
                if (animePage === 1) {
                    animeList = results;
                } else {
                    animeList = animeList.concat(results);
                }
                
                if (animeList.length === 0) {
                    grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-zinc-500 font-bold uppercase">No anime titles found matching filters</div>';
                    btn.classList.add('hidden');
                    return;
                }
                
                renderAnimeGrid();
                
                if (results.length < 20) {
                    btn.classList.add('hidden');
                } else {
                    btn.classList.remove('hidden');
                }
            } catch (err) {
                console.error(err);
                if (animePage === 1) {
                    grid.innerHTML = '<div class="col-span-full py-20 text-center text-xs text-red-500 font-bold uppercase">Failed to load Anime Arena</div>';
                }
            }
        }

        
// Timelines Data
const animeTimelines = [
    {
        id: 'onepiece',
        title: 'One Piece Saga',
        jp: 'ワンピース',
        gradient: 'from-cyan-950/40 via-blue-950/20 to-cyan-950/40',
        textGradient: 'from-cyan-400 via-blue-500 to-sky-400',
        borderColor: 'border-cyan-500/20',
        glowColors: ['bg-cyan-600/10', 'bg-blue-500/10'],
        badgeBg: 'bg-cyan-500/15',
        badgeBorder: 'border-cyan-500/20',
        badgeText: 'text-cyan-400',
        accent: 'from-cyan-500 to-blue-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]',
        accentLine: 'from-cyan-500 to-blue-500',
        backdropSource: 'tv/37854',
        items: [
            { id: 37854, tmdbType: 'tv', title: "East Blue", chrono: "Saga 1", jpTitle: "ワンピース", rating: "8.7", year: "1999", desc: "Luffy begins his quest to find the One Piece." },
            { id: 37854, tmdbType: 'tv', title: "Alabasta", chrono: "Saga 2", jpTitle: "アラバスタ", rating: "8.8", year: "2001", desc: "The Straw Hats enter the Grand Line." },
            { id: 37854, tmdbType: 'tv', title: "Sky Island", chrono: "Saga 3", jpTitle: "空島", rating: "8.5", year: "2003", desc: "The crew travels to an island in the sky." },
            { id: 37854, tmdbType: 'tv', title: "Water 7", chrono: "Saga 4", jpTitle: "ウォーターセブン", rating: "9.2", year: "2005", desc: "Conflict within the crew and the World Government." },
            { id: 37854, tmdbType: 'tv', title: "Thriller Bark", chrono: "Saga 5", jpTitle: "スリラーバーク", rating: "8.4", year: "2007", desc: "A ghostly island ship filled with zombies." },
            { id: 37854, tmdbType: 'tv', title: "Summit War", chrono: "Saga 6", jpTitle: "頂上戦争", rating: "9.5", year: "2009", desc: "The ultimate war at Marineford." },
            { id: 37854, tmdbType: 'tv', title: "Fish-Man Island", chrono: "Saga 7", jpTitle: "魚人島", rating: "8.1", year: "2011", desc: "The Straw Hats journey underwater." },
            { id: 37854, tmdbType: 'tv', title: "Dressrosa", chrono: "Saga 8", jpTitle: "ドレスローザ", rating: "8.6", year: "2013", desc: "A battle against Donquixote Doflamingo." },
            { id: 37854, tmdbType: 'tv', title: "Whole Cake Island", chrono: "Saga 9", jpTitle: "ホールケーキアイランド", rating: "8.9", year: "2017", desc: "A rescue mission in Big Mom's territory." },
            { id: 37854, tmdbType: 'tv', title: "Wano Country", chrono: "Saga 10", jpTitle: "ワノ国", rating: "9.3", year: "2019", desc: "The alliance takes on Emperor Kaido." },
            { id: 37854, tmdbType: 'tv', title: "Egghead", chrono: "Saga 11", jpTitle: "エッグヘッド", rating: "9.0", year: "2024", desc: "The final saga begins on the island of the future." }
        ]
    },
    {
        id: 'onepiece_movies',
        title: 'One Piece Movies',
        jp: '映画',
        gradient: 'from-rose-950/40 via-pink-950/20 to-rose-950/40',
        textGradient: 'from-rose-400 via-pink-500 to-red-400',
        borderColor: 'border-rose-500/20',
        glowColors: ['bg-rose-600/10', 'bg-pink-500/10'],
        badgeBg: 'bg-rose-500/15',
        badgeBorder: 'border-rose-500/20',
        badgeText: 'text-rose-400',
        accent: 'from-rose-500 to-pink-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
        accentLine: 'from-rose-500 to-pink-500',
        backdropSource: 'movie/900667',
        items: [
            { id: 23647, tmdbType: 'movie', title: "One Piece: The Movie", chrono: "Movie 1", jpTitle: "劇場版", rating: "6.5", year: "2000", desc: "The Straw Hat Pirates' first theatrical film." },
            { id: 23648, tmdbType: 'movie', title: "Clockwork Island Adventure", chrono: "Movie 2", jpTitle: "ねじまき島の冒険", rating: "6.6", year: "2001", desc: "The crew's ship is stolen." },
            { id: 23649, tmdbType: 'movie', title: "Chopper's Kingdom", chrono: "Movie 3", jpTitle: "珍獣島のチョッパー王国", rating: "6.4", year: "2002", desc: "Chopper becomes the king of an island of animals." },
            { id: 23650, tmdbType: 'movie', title: "Dead End Adventure", chrono: "Movie 4", jpTitle: "デッドエンドの冒険", rating: "7.1", year: "2003", desc: "A desperate race between pirate crews." },
            { id: 23652, tmdbType: 'movie', title: "The Cursed Holy Sword", chrono: "Movie 5", jpTitle: "呪われた聖剣", rating: "6.7", year: "2004", desc: "Zoro vanishes and joins a group of marines." },
            { id: 23653, tmdbType: 'movie', title: "Baron Omatsuri", chrono: "Movie 6", jpTitle: "オマツリ男爵", rating: "7.3", year: "2005", desc: "A dark and surreal adventure on a resort island." },
            { id: 34291, tmdbType: 'movie', title: "Strong World", chrono: "Movie 10", jpTitle: "ストロングワールド", rating: "7.6", year: "2009", desc: "The Straw Hats face off against legendary pirate Shiki." },
            { id: 132686, tmdbType: 'movie', title: "Film: Z", chrono: "Movie 12", jpTitle: "フィルム Z", rating: "7.9", year: "2012", desc: "A former Marine Admiral seeks to destroy the New World." },
            { id: 382322, tmdbType: 'movie', title: "Film: Gold", chrono: "Movie 13", jpTitle: "フィルム GOLD", rating: "7.4", year: "2016", desc: "The crew visits the glamorous Gran Tesoro." },
            { id: 568012, tmdbType: 'movie', title: "Stampede", chrono: "Movie 14", jpTitle: "スタンピード", rating: "8.0", year: "2019", desc: "Pirates gather for the great Pirate Festival." },
            { id: 900667, tmdbType: 'movie', title: "Film: Red", chrono: "Movie 15", jpTitle: "フィルム RED", rating: "7.3", year: "2022", desc: "Uta reveals her identity at a live concert." }
        ]
    }
];

const homeTimelines = [
    {
        id: 'marvel',
        title: 'Marvel Cinematic Universe',
        jp: 'MCU',
        gradient: 'from-red-950/40 via-rose-950/20 to-red-950/40',
        textGradient: 'from-red-400 via-rose-500 to-red-600',
        borderColor: 'border-red-500/20',
        glowColors: ['bg-red-600/10', 'bg-rose-500/10'],
        badgeBg: 'bg-red-500/15',
        badgeBorder: 'border-red-500/20',
        badgeText: 'text-red-400',
        accent: 'from-red-500 to-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]',
        accentLine: 'from-red-500 to-rose-500',
        backdropSource: 'movie/299534',
        items: [
            { id: 1771, tmdbType: 'movie', title: "Captain America: The First Avenger", chrono: "Phase 1", jpTitle: "ファーストアベンジャー", rating: "7.0", year: "2011", desc: "Steve Rogers becomes Captain America during WWII." },
            { id: 299537, tmdbType: 'movie', title: "Captain Marvel", chrono: "Phase 3", jpTitle: "キャプテンマーベル", rating: "6.9", year: "2019", desc: "Carol Danvers becomes one of the universe's most powerful heroes." },
            { id: 1726, tmdbType: 'movie', title: "Iron Man", chrono: "Phase 1", jpTitle: "アイアンマン", rating: "7.6", year: "2008", desc: "Tony Stark builds an armored suit." },
            { id: 1724, tmdbType: 'movie', title: "The Incredible Hulk", chrono: "Phase 1", jpTitle: "インクレディブル・ハルク", rating: "6.2", year: "2008", desc: "Bruce Banner seeks a cure for his unique condition." },
            { id: 10138, tmdbType: 'movie', title: "Iron Man 2", chrono: "Phase 1", jpTitle: "アイアンマン2", rating: "6.8", year: "2010", desc: "The world knows Tony Stark is Iron Man." },
            { id: 10195, tmdbType: 'movie', title: "Thor", chrono: "Phase 1", jpTitle: "マイティ・ソー", rating: "7.0", year: "2011", desc: "The powerful but arrogant god Thor is cast out of Asgard." },
            { id: 24428, tmdbType: 'movie', title: "The Avengers", chrono: "Phase 1", jpTitle: "アベンジャーズ", rating: "7.7", year: "2012", desc: "Earth's mightiest heroes must fight as a team." },
            { id: 100402, tmdbType: 'movie', title: "The Winter Soldier", chrono: "Phase 2", jpTitle: "ウィンター・ソルジャー", rating: "7.7", year: "2014", desc: "Steve Rogers struggles to embrace his role in the modern world." },
            { id: 118340, tmdbType: 'movie', title: "Guardians of the Galaxy", chrono: "Phase 2", jpTitle: "ガーディアンズ", rating: "7.9", year: "2014", desc: "Space adventurers must save the universe." },
            { id: 271110, tmdbType: 'movie', title: "Civil War", chrono: "Phase 3", jpTitle: "シビル・ウォー", rating: "7.4", year: "2016", desc: "The Avengers fracture into two opposing factions." },
            { id: 299536, tmdbType: 'movie', title: "Infinity War", chrono: "Phase 3", jpTitle: "インフィニティ・ウォー", rating: "8.3", year: "2018", desc: "The Avengers must stop Thanos." },
            { id: 299534, tmdbType: 'movie', title: "Endgame", chrono: "Phase 3", jpTitle: "エンドゲーム", rating: "8.3", year: "2019", desc: "The remaining Avengers reverse Thanos' actions." }
        ]
    },
    {
        id: 'dc',
        title: 'DC Multiverse & Batman',
        jp: 'DCU',
        gradient: 'from-blue-950/40 via-indigo-950/20 to-blue-950/40',
        textGradient: 'from-blue-400 via-indigo-500 to-cyan-400',
        borderColor: 'border-blue-500/20',
        glowColors: ['bg-blue-600/10', 'bg-indigo-500/10'],
        badgeBg: 'bg-blue-500/15',
        badgeBorder: 'border-blue-500/20',
        badgeText: 'text-blue-400',
        accent: 'from-blue-500 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]',
        accentLine: 'from-blue-500 to-indigo-500',
        backdropSource: 'movie/155',
        items: [
            { id: 272, tmdbType: 'movie', title: "Batman Begins", chrono: "Nolanverse", jpTitle: "バットマン ビギンズ", rating: "7.7", year: "2005", desc: "Bruce Wayne trains to become Gotham's protector." },
            { id: 155, tmdbType: 'movie', title: "The Dark Knight", chrono: "Nolanverse", jpTitle: "ダークナイト", rating: "8.5", year: "2008", desc: "Batman faces his ultimate test as the Joker wreaks havoc." },
            { id: 49026, tmdbType: 'movie', title: "The Dark Knight Rises", chrono: "Nolanverse", jpTitle: "ライジング", rating: "7.8", year: "2012", desc: "Batman returns to face Bane." },
            { id: 49521, tmdbType: 'movie', title: "Man of Steel", chrono: "DCEU", jpTitle: "マンオブスティール", rating: "6.6", year: "2013", desc: "Clark Kent must become the hero Superman." },
            { id: 209112, tmdbType: 'movie', title: "Batman v Superman", chrono: "DCEU", jpTitle: "ジャスティスの誕生", rating: "5.9", year: "2016", desc: "Gotham's vigilante takes on Metropolis's savior." },
            { id: 297762, tmdbType: 'movie', title: "Wonder Woman", chrono: "DCEU", jpTitle: "ワンダーウーマン", rating: "7.2", year: "2017", desc: "Diana leaves her island to stop a massive conflict." },
            { id: 791373, tmdbType: 'movie', title: "Zack Snyder's Justice League", chrono: "DCEU", jpTitle: "ジャスティス・リーグ", rating: "8.2", year: "2021", desc: "Bruce Wayne assembles a team." },
            { id: 297802, tmdbType: 'movie', title: "Aquaman", chrono: "DCEU", jpTitle: "アクアマン", rating: "6.9", year: "2018", desc: "Arthur Curry must step forward to lead his people." },
            { id: 414906, tmdbType: 'movie', title: "The Batman", chrono: "Reevesverse", jpTitle: "ザ・バットマン", rating: "7.7", year: "2022", desc: "Batman pursues the Riddler." },
            { id: 475557, tmdbType: 'movie', title: "Joker", chrono: "Elseworlds", jpTitle: "ジョーカー", rating: "8.2", year: "2019", desc: "Arthur Fleck begins a slow descent into madness." }
        ]
    },
    {
        id: 'harrypotter',
        title: 'Wizarding World',
        jp: '魔法ワールド',
        gradient: 'from-violet-950/40 via-purple-950/20 to-violet-950/40',
        textGradient: 'from-violet-400 via-purple-500 to-fuchsia-400',
        borderColor: 'border-violet-500/20',
        glowColors: ['bg-violet-600/10', 'bg-purple-500/10'],
        badgeBg: 'bg-violet-500/15',
        badgeBorder: 'border-violet-500/20',
        badgeText: 'text-violet-400',
        accent: 'from-violet-500 to-purple-500 shadow-[0_0_15px_rgba(139,92,246,0.4)]',
        accentLine: 'from-violet-500 to-purple-500',
        backdropSource: 'movie/12445',
        items: [
            { id: 671, tmdbType: 'movie', title: "The Sorcerer's Stone", chrono: "Year 1", jpTitle: "賢者の石", rating: "7.9", year: "2001", desc: "Harry discovers he is a wizard." },
            { id: 672, tmdbType: 'movie', title: "The Chamber of Secrets", chrono: "Year 2", jpTitle: "秘密の部屋", rating: "7.7", year: "2002", desc: "A dark force terrorizes Hogwarts." },
            { id: 673, tmdbType: 'movie', title: "The Prisoner of Azkaban", chrono: "Year 3", jpTitle: "アズカバンの囚人", rating: "8.0", year: "2004", desc: "Harry learns the truth about Sirius Black." },
            { id: 674, tmdbType: 'movie', title: "The Goblet of Fire", chrono: "Year 4", jpTitle: "炎のゴブレット", rating: "7.8", year: "2005", desc: "Harry competes in the Triwizard Tournament." },
            { id: 675, tmdbType: 'movie', title: "The Order of the Phoenix", chrono: "Year 5", jpTitle: "不死鳥の騎士団", rating: "7.7", year: "2007", desc: "Harry prepares for Voldemort's return." },
            { id: 767, tmdbType: 'movie', title: "The Half-Blood Prince", chrono: "Year 6", jpTitle: "謎のプリンス", rating: "7.7", year: "2009", desc: "Harry discovers Voldemort's dark secret." },
            { id: 12444, tmdbType: 'movie', title: "The Deathly Hallows: Part 1", chrono: "Year 7", jpTitle: "死の秘宝 PART1", rating: "7.8", year: "2010", desc: "Harry races to find the Horcruxes." },
            { id: 12445, tmdbType: 'movie', title: "The Deathly Hallows: Part 2", chrono: "Year 7", jpTitle: "死の秘宝 PART2", rating: "8.1", year: "2011", desc: "The final battle between good and evil." },
            { id: 259316, tmdbType: 'movie', title: "Fantastic Beasts", chrono: "Prequel", jpTitle: "ファンタスティック", rating: "7.3", year: "2016", desc: "Newt Scamander visits New York." }
        ]
    },
    {
        id: 'lotr',
        title: 'Lord of the Rings',
        jp: '指輪物語',
        gradient: 'from-emerald-950/40 via-green-950/20 to-emerald-950/40',
        textGradient: 'from-emerald-400 via-green-500 to-teal-400',
        borderColor: 'border-emerald-500/20',
        glowColors: ['bg-emerald-600/10', 'bg-green-500/10'],
        badgeBg: 'bg-emerald-500/15',
        badgeBorder: 'border-emerald-500/20',
        badgeText: 'text-emerald-400',
        accent: 'from-emerald-500 to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
        accentLine: 'from-emerald-500 to-green-500',
        backdropSource: 'movie/122',
        items: [
            { id: 84773, tmdbType: 'tv', title: "The Rings of Power", chrono: "Second Age", jpTitle: "力の指輪", rating: "7.4", year: "2022", desc: "Set thousands of years before the events of The Hobbit." },
            { id: 49051, tmdbType: 'movie', title: "An Unexpected Journey", chrono: "The Hobbit 1", jpTitle: "思いがけない冒険", rating: "7.3", year: "2012", desc: "Bilbo Baggins journeys to reclaim the Lonely Mountain." },
            { id: 57158, tmdbType: 'movie', title: "The Desolation of Smaug", chrono: "The Hobbit 2", jpTitle: "竜に奪われた王国", rating: "7.6", year: "2013", desc: "The dwarves continue their quest to confront the dragon Smaug." },
            { id: 122917, tmdbType: 'movie', title: "The Battle of the Five Armies", chrono: "The Hobbit 3", jpTitle: "決戦のゆくえ", rating: "7.3", year: "2014", desc: "Bilbo and company are forced to engage in a war." },
            { id: 120, tmdbType: 'movie', title: "The Fellowship of the Ring", chrono: "LOTR 1", jpTitle: "旅の仲間", rating: "8.4", year: "2001", desc: "A meek Hobbit sets out to destroy the powerful One Ring." },
            { id: 121, tmdbType: 'movie', title: "The Two Towers", chrono: "LOTR 2", jpTitle: "二つの塔", rating: "8.4", year: "2002", desc: "The divided fellowship makes a stand." },
            { id: 122, tmdbType: 'movie', title: "The Return of the King", chrono: "LOTR 3", jpTitle: "王の帰還", rating: "8.5", year: "2003", desc: "Gandalf and Aragorn lead the World of Men against Sauron's army." }
        ]
    },
    {
        id: 'fastfurious',
        title: 'The Fast Saga',
        jp: 'ワイルド',
        gradient: 'from-slate-950/40 via-zinc-950/20 to-slate-950/40',
        textGradient: 'from-slate-300 via-gray-400 to-slate-200',
        borderColor: 'border-slate-500/20',
        glowColors: ['bg-slate-600/10', 'bg-zinc-500/10'],
        badgeBg: 'bg-slate-500/15',
        badgeBorder: 'border-slate-500/20',
        badgeText: 'text-slate-300',
        accent: 'from-slate-400 to-gray-500 shadow-[0_0_15px_rgba(148,163,184,0.4)]',
        accentLine: 'from-slate-400 to-gray-500',
        backdropSource: 'movie/385687',
        items: [
            { id: 9799, tmdbType: 'movie', title: "The Fast and the Furious", chrono: "Part 1", jpTitle: "スピード", rating: "6.9", year: "2001", desc: "Dom Toretto falls under the suspicion of the LAPD." },
            { id: 514, tmdbType: 'movie', title: "2 Fast 2 Furious", chrono: "Part 2", jpTitle: "X2", rating: "6.5", year: "2003", desc: "Brian O'Conner returns to the street racing scene." },
            { id: 9615, tmdbType: 'movie', title: "Tokyo Drift", chrono: "Part 3", jpTitle: "X3", rating: "6.4", year: "2006", desc: "An American teen moves to Tokyo." },
            { id: 13804, tmdbType: 'movie', title: "Fast & Furious", chrono: "Part 4", jpTitle: "MAX", rating: "6.6", year: "2009", desc: "Brian and Dom reunite to stop a heroin importer." },
            { id: 51497, tmdbType: 'movie', title: "Fast Five", chrono: "Part 5", jpTitle: "メガマックス", rating: "7.3", year: "2011", desc: "Dominic and his crew plan a massive heist in Rio." },
            { id: 82992, tmdbType: 'movie', title: "Fast & Furious 6", chrono: "Part 6", jpTitle: "EURO MISSION", rating: "6.8", year: "2013", desc: "The crew assembles to take down a mercenary organization." },
            { id: 168259, tmdbType: 'movie', title: "Furious 7", chrono: "Part 7", jpTitle: "スカイミッション", rating: "7.2", year: "2015", desc: "Deckard Shaw seeks revenge against Dom's family." },
            { id: 337339, tmdbType: 'movie', title: "The Fate of the Furious", chrono: "Part 8", jpTitle: "ICE BREAK", rating: "6.9", year: "2017", desc: "A mysterious woman seduces Dom into the world of terrorism." },
            { id: 385128, tmdbType: 'movie', title: "F9", chrono: "Part 9", jpTitle: "ジェットブレイク", rating: "7.1", year: "2021", desc: "Dom and his crew join forces to battle the most skilled assassin." },
            { id: 385687, tmdbType: 'movie', title: "Fast X", chrono: "Part 10", jpTitle: "ファイヤーブースト", rating: "7.1", year: "2023", desc: "Dom Toretto and his family have outsmarted every foe." }
        ]
    }
];

async function renderTimelines(containerId, timelinesArray) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = "";
    
    for (const tl of timelinesArray) {
        let itemsHtml = "";
        for (let i = 0; i < tl.items.length; i++) {
            const item = tl.items[i];
            
            // Default posters
            let poster = "https://image.tmdb.org/t/p/w400/811LjuvO9QJMA0m18Zt41zZ1Hov.jpg";
            
            const nodeHtml = `
                <div class="hidden sm:flex flex-col items-center justify-center shrink-0 pr-2">
                    <div class="w-10 h-10 rounded-full bg-zinc-950 border-2 ${tl.borderColor} flex items-center justify-center font-black text-xs ${tl.badgeText} shadow-md relative z-20 hover:scale-110 transition-transform">
                        ${i + 1}
                    </div>
                    ${i < tl.items.length - 1 ? `<div class="w-0.5 h-32 bg-gradient-to-b ${tl.accentLine} opacity-30 mt-2 z-10"></div>` : ''}
                </div>
            `;
            
            const isLast = i === tl.items.length - 1;
            
            itemsHtml += `
                <div class="flex items-center gap-4 shrink-0 relative z-20">
                    ${nodeHtml}
                    <div class="w-56 sm:w-64 bg-zinc-950/90 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:${tl.borderColor} transition-all duration-500 transform hover:scale-[1.03] active:scale-[0.98] relative flex flex-col group shadow-xl z-20" onclick="openDetails('${item.id}', '${item.tmdbType}')">
                        <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                            <img src="${poster}" id="${containerId}-poster-${item.id}-${i}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                            <div class="absolute top-3 left-3 bg-gradient-to-r ${tl.accent} px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10 flex items-center gap-1 shadow-md">
                                <i data-lucide="compass" class="w-3 h-3 animate-spin" style="animation-duration: 8s;"></i> <span>${item.chrono}</span>
                            </div>
                            <div class="absolute top-3 right-3 bg-black/85 px-2 py-0.5 rounded-lg text-[10px] font-black border border-white/15 flex items-center gap-0.5 shadow-md text-white">
                                <i data-lucide="star" class="w-3 h-3 ${tl.badgeText} fill-current"></i> <span>${item.rating}</span>
                            </div>
                        </div>
                        <div class="p-4 bg-zinc-950/95 flex-grow flex flex-col justify-between border-t border-white/5 min-h-[160px]">
                            <div class="space-y-1.5">
                                <div class="text-[9px] font-black uppercase tracking-widest ${tl.badgeText} flex items-center justify-between">
                                    <span>${item.jpTitle}</span>
                                    <span class="${tl.badgeBg} px-1.5 py-0.5 rounded border ${tl.badgeBorder} ${tl.badgeText}">${item.tmdbType === 'tv' ? 'Series' : 'Movie'}</span>
                                </div>
                                <h3 class="text-xs sm:text-sm font-black text-white group-hover:${tl.badgeText} transition-colors uppercase tracking-tight line-clamp-1" title="${item.title}">${item.title}</h3>
                                <p class="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed font-semibold line-clamp-3 group-hover:text-zinc-300 transition-colors">${item.desc}</p>
                            </div>
                            <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-3 pt-3 border-t border-white/5">
                                <span>${item.year}</span>
                                <span class="text-indigo-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">Stream Arc <i data-lucide="chevron-right" class="w-3 h-3"></i></span>
                            </div>
                        </div>
                    </div>
                    
                    ${!isLast ? `
                    <div class="hidden md:flex items-center justify-center pointer-events-none select-none shrink-0 self-center -mx-1 z-10">
                        <div class="w-10 h-0.5 bg-gradient-to-r ${tl.accentLine} opacity-20 relative">
                            <div class="absolute inset-0 bg-white blur-sm opacity-50 animate-pulse"></div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
        
        html += `
        <div class="bg-gradient-to-r ${tl.gradient} p-0.5 rounded-[2rem] border ${tl.borderColor} relative overflow-hidden mt-10">
            <div class="bg-zinc-950/80  relative overflow-hidden rounded-[1.8rem]">
                
                <!-- Dynamic TMDB Backdrop Image Right Side -->
                <div class="absolute inset-y-0 right-0 w-[60%] sm:w-[50%] lg:w-[40%] pointer-events-none z-0">
                    <img id="${containerId}-backdrop-${tl.id}" src="" alt="Backdrop" class="w-full h-full object-cover opacity-30 sm:opacity-50 object-right" />
                    <div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent"></div>
                </div>

                <!-- Glows -->
                <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 ${tl.glowColors[0]} blur-2xl opacity-50 pointer-events-none z-0"></div>
                <div class="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 ${tl.glowColors[1]} blur-2xl opacity-50 pointer-events-none z-0"></div>
                
                <div class="p-5 sm:p-6 sm:pr-8 relative z-10">
                    <div class="flex items-center justify-between relative z-10">
                        <div class="flex items-center gap-3">
                            <span class="w-2.5 h-8 bg-gradient-to-b ${tl.accentLine} rounded-full shadow-lg"></span>
                            <div class="flex flex-col">
                                <span class="inline-flex items-center gap-1 ${tl.badgeBg} border ${tl.badgeBorder} ${tl.badgeText} text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mb-1">${tl.jp} Timeline</span>
                                <h2 class="text-2xl sm:text-3xl font-black uppercase tracking-tight bg-gradient-to-r ${tl.textGradient} bg-clip-text text-transparent filter drop-shadow-lg">${tl.title}</h2>
                            </div>
                        </div>
                    </div>
                    
                    <div class="scroller-container relative z-10 mt-6">
                        <button class="scroller-btn scroller-left bg-zinc-900/80 hover:bg-zinc-800" onclick="scrollShelf('${containerId}-${tl.id}TimelineShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="${containerId}-${tl.id}TimelineShelf" class="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-4 px-2 relative z-20">${itemsHtml}</div>
                        <button class="scroller-btn scroller-right bg-zinc-900/80 hover:bg-zinc-800" onclick="scrollShelf('${containerId}-${tl.id}TimelineShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
    
    container.innerHTML = html;
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Async load posters and backdrops
    for (const tl of timelinesArray) {
        // Fetch Backdrop
        if (tl.backdropSource) {
            fetchTMDB(tl.backdropSource).then(data => {
                if (data && data.backdrop_path) {
                    const backdropImg = document.getElementById(`${containerId}-backdrop-${tl.id}`);
                    if (backdropImg) backdropImg.src = `https://image.tmdb.org/t/p/w1280${data.backdrop_path}`;
                } else if (data && data.poster_path) {
                    const backdropImg = document.getElementById(`${containerId}-backdrop-${tl.id}`);
                    if (backdropImg) backdropImg.src = `https://image.tmdb.org/t/p/w1280${data.poster_path}`;
                }
            }).catch(e => {});
        }
    
        // Fetch Posters
        for (let i = 0; i < tl.items.length; i++) {
            const item = tl.items[i];
            setTimeout(() => {
                fetchTMDB(`${item.tmdbType}/${item.id}`).then(data => {
                if (data && data.poster_path) {
                    const img = document.getElementById(`${containerId}-poster-${item.id}-${i}`);
                    if (img) img.src = `https://image.tmdb.org/t/p/w400${data.poster_path}`;
                }
            }).catch(e => {});
            }, i * 200 + Math.random() * 100);
        }
    }
}


        // Anime Home Data Fetcher (Spotlight & Shelves)
        async function loadAnimeHomeData() {
            try {
                // Fetch New Anime Content for Spotlight
                const newAnimeData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'first_air_date.gte': '2024-01-01',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                const newSpotlight = newAnimeData.results || [];

                // 1. Trending Anime
                const trendingData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                const trending = trendingData.results || [];
                
                // Render Spotlight with New Contents
                renderAnimeSpotlight(newSpotlight.length > 0 ? newSpotlight.slice(0, 5) : trending.slice(0, 5));
                
                // Render Trending Shelf
                renderAnimeShelf(trending, 'animeTrendingShelf');
                
                // Load Demon Slayer Timeline
                
                
                renderTimelines('animeTimelinesContainer', animeTimelines);
                renderTimelines('homeTimelinesContainer', homeTimelines);
                
                // Fetch Live Anime Channels
                await loadLiveAnimeChannels();

                // 2. Shonen / Action Anime (genre 10759 = Action & Adventure, 16 = Animation)
                const shonenData = await fetchTMDB('discover/tv', {
                    with_genres: '16,10759',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(shonenData.results || [], 'animeShonenShelf');
                
                // 3. Top Rated Anime Masterpieces
                const topRatedData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 150,
                    page: 1
                });
                renderAnimeShelf(topRatedData.results || [], 'animeTopRatedShelf');

                // 4. Sci-Fi & Cyberpunk Mecha Anime
                const sciFiData = await fetchTMDB('discover/tv', {
                    with_genres: '16,10765',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(sciFiData.results || [], 'animeSciFiShelf');

                // 5. Slice of Life & Comedy Anime
                const comedyData = await fetchTMDB('discover/tv', {
                    with_genres: '16,35',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(comedyData.results || [], 'animeComedyShelf');

                // 6a. New Release Anime Movies
                const todayStr = new Date().toISOString().split('T')[0];
                const newReleaseMoviesData = await fetchTMDB('discover/movie', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'primary_release_date.lte': todayStr,
                    sort_by: 'primary_release_date.desc',
                    'vote_count.gte': 5,
                    page: 1
                });
                renderAnimeShelf(newReleaseMoviesData.results || [], 'animeNewReleaseMoviesShelf', 'movie');

                // 6b. Popular Now Anime Movies
                const popularMoviesData = await fetchTMDB('discover/movie', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(popularMoviesData.results || [], 'animePopularMoviesShelf', 'movie');

                // 6c. Top Rated Masterpieces Anime Movies
                const topRatedMoviesData = await fetchTMDB('discover/movie', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 80,
                    page: 1
                });
                renderAnimeShelf(topRatedMoviesData.results || [], 'animeMoviesShelf', 'movie');

                // 6d. Action & Blockbuster Anime Movies
                const actionMoviesData = await fetchTMDB('discover/movie', {
                    with_genres: '16,28',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(actionMoviesData.results || [], 'animeActionMoviesShelf', 'movie');
                
                // 7. Dark Fantasy & Supernatural Anime
                const darkFantasyData = await fetchTMDB('discover/tv', {
                    with_genres: '16,9648',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(darkFantasyData.results || [], 'animeDarkFantasyShelf');

                // 8. Romance & Drama Masterpieces
                const romanceData = await fetchTMDB('discover/tv', {
                    with_genres: '16,18',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                renderAnimeShelf(romanceData.results || [], 'animeRomanceShelf');

                // 9. Classic Retro Masterpieces
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

        window.animeSpotlightTrailerPlaying = false;
        window.isAnimeSpotlightMuted = true;

        window.toggleAnimeSpotlightMute = function(itemId) {
            const iframe = document.getElementById(`animeSpotlightIframe-${itemId}`);
            const icon = document.getElementById(`animeSpotlightMuteIcon-${itemId}`);
            if (!iframe) return;

            window.isAnimeSpotlightMuted = !window.isAnimeSpotlightMuted;
            const command = window.isAnimeSpotlightMuted ? 'mute' : 'unMute';
            iframe.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');

            if (icon) {
                if (window.isAnimeSpotlightMuted) {
                    icon.setAttribute('data-lucide', 'volume-x');
                } else {
                    icon.setAttribute('data-lucide', 'volume-2');
                }
                lucide.createIcons();
            }
        };

        // Render Anime Spotlight Slider
        let animeSpotlightSlides = [];
        let currentAnimeSlideIndex = 0;
        let animeSpotlightInterval = null;

        async function renderAnimeSpotlight(slides) {
            animeSpotlightSlides = slides;
            if (slides.length === 0) return;
            renderAnimeSpotlightSlide(0);
            
            if (animeSpotlightInterval) clearInterval(animeSpotlightInterval);
            animeSpotlightInterval = setInterval(() => {
                nextAnimeSpotlightSlide();
            }, 6500);
        }

        function nextAnimeSpotlightSlide() {
            if (animeSpotlightSlides.length === 0) return;
            const nextIdx = (currentAnimeSlideIndex + 1) % animeSpotlightSlides.length;
            renderAnimeSpotlightSlide(nextIdx);
        }

        async function renderAnimeSpotlightSlide(index) {
            if (animeSpotlightSlides.length === 0) return;
            currentAnimeSlideIndex = index;
            window.animeSpotlightTrailerPlaying = false; // Reset on slide load
            const container = document.getElementById('animeHeroSliderContainer');
            const item = animeSpotlightSlides[index];
            const backdrop = `https://image.tmdb.org/t/p/original${item.backdrop_path}`;
            const title = item.name || item.title || "Anime Arena Showcase";
            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
            const year = (item.first_air_date || '').split('-')[0] || '2024';
            const overview = item.overview || "Dive into legendary Japanese anime releases streamed direct from global backup mirrors.";

            let trailerBtnHtml = '';
            let trailerKey = null;
            try {
                const vidData = await fetchTMDB(`tv/${item.id}/videos`);
                const trailer = vidData.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube') || vidData.results?.find(v => v.site === 'YouTube');
                if (trailer) {
                    trailerKey = trailer.key;
                    trailerBtnHtml = `
                        <button onclick="playTrailerPopup('${trailer.key}', '${encodeURIComponent(title)}')" class="px-5 py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 transform active:scale-95">
                            <i data-lucide="play" class="w-4 h-4 text-red-500"></i> Watch Trailer
                        </button>
                    `;
                }
            } catch (err) {
                console.warn("Failed to fetch anime spotlight trailer", err);
            }

            container.innerHTML = `
                <div id="animeStaticBg-${item.id}" class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('${backdrop}')"></div>
                <!-- YouTube Trailer Background (Delayed Autoplay) -->
                <div id="animeSpotlightTrailerBg-${item.id}" class="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-1000 z-[1] overflow-hidden"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/50 to-transparent z-10"></div>
                <div class="absolute inset-0 bg-gradient-to-r from-[#05070a]/90 via-transparent to-transparent z-10"></div>
                
                <div class="absolute bottom-6 right-6 flex items-center gap-2 z-20">
                    ${animeSpotlightSlides.map((_, i) => `
                        <button onclick="selectAnimeSpotlightSlide(${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-indigo-500 w-6' : 'bg-white/30 hover:bg-white/50'}"></button>
                    `).join('')}
                </div>

                <!-- Floating Mute Button for Anime Spotlight Background Trailer -->
                <button id="animeSpotlightMuteBtn-${item.id}" onclick="toggleAnimeSpotlightMute('${item.id}')" class="hidden absolute bottom-6 right-32 z-30 w-10 h-10 rounded-full bg-black/60 hover:bg-black border border-white/10 flex items-center justify-center text-white transition-all shadow-lg hover:scale-105 active:scale-95">
                    <i id="animeSpotlightMuteIcon-${item.id}" data-lucide="volume-x" class="w-4 h-4 text-white"></i>
                </button>

                <div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">
                    <div class="flex flex-wrap items-center gap-2.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <span class="bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-md animate-pulse">🔥 Otaku Spotlight</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md flex items-center gap-1 border border-white/5"><i data-lucide="star" class="w-3 h-3 fill-red-500 text-red-500"></i> ${rating}</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md border border-white/5">${year}</span>
                        <span class="bg-zinc-950/80 px-2.5 py-0.5 rounded-md border border-white/5 text-pink-400">JAPAN ORIGINAL</span>
                    </div>
                    <h1 class="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">${title}</h1>
                    <p class="text-sm text-slate-300 leading-relaxed max-w-lg line-clamp-3">${overview}</p>
                    <div class="flex flex-wrap items-center gap-3 pt-4">
                        <button onclick="openDetails('${item.id}', 'tv')" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 transform active:scale-95"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Now</button>
                        ${trailerBtnHtml}
                        <button onclick="openDetails('${item.id}', 'tv')" class="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5"><i data-lucide="info" class="w-4 h-4"></i> Info</button>
                    </div>
                </div>
            `;
            lucide.createIcons();

            // Delayed Anime background trailer autoplay (2 seconds)
            if (trailerKey) {
                setTimeout(() => {
                    if (currentAnimeSlideIndex === index && activeTab === 'anime') {
                        const trailerEl = document.getElementById(`animeSpotlightTrailerBg-${item.id}`);
                        const staticBg = document.getElementById(`animeStaticBg-${item.id}`);
                        const muteBtn = document.getElementById(`animeSpotlightMuteBtn-${item.id}`);
                        if (trailerEl) {
                            trailerEl.innerHTML = `<iframe id="animeSpotlightIframe-${item.id}" class="w-full h-[140%] -translate-y-[10%] scale-110 pointer-events-none" src="https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailerKey}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&vq=medium" frameborder="0" allow="autoplay; encrypted-media"></iframe>`;
                            trailerEl.classList.remove('opacity-0');
                            trailerEl.classList.add('opacity-40');
                            if (staticBg) {
                                staticBg.classList.add('opacity-0'); // No image of movie when trailer plays
                            }
                            window.animeSpotlightTrailerPlaying = true; // Stay on this slide while trailer plays
                            if (muteBtn) {
                                muteBtn.classList.remove('hidden');
                            }
                        }
                    }
                }, 2000);
            }
        }

        function selectAnimeSpotlightSlide(idx) {
            window.animeSpotlightTrailerPlaying = false; // Reset state
            renderAnimeSpotlightSlide(idx);
            if (animeSpotlightInterval) clearInterval(animeSpotlightInterval);
            animeSpotlightInterval = setInterval(() => {
                nextAnimeSpotlightSlide();
            }, 6500);
        }

        function renderAnimeShelf(items, shelfId, typeOverride = null) {
            const shelf = document.getElementById(shelfId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            items.slice(0, 15).forEach(item => {
                const title = item.name || item.title || "Untitled Anime";
                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.first_air_date || item.release_date || '').split('-')[0] || '2024';
                const finalType = typeOverride || (item.first_air_date ? 'tv' : 'movie');

                const card = document.createElement('div');
                card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-indigo-500/30 shadow-md";
                card.onclick = () => openDetails(item.id, finalType);
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 bg-indigo-600/90 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/20 flex items-center gap-0.5 shadow-md animate-pulse">
                            <i data-lucide="sparkles" class="w-2.5 h-2.5 fill-white text-white"></i> Otaku Fever
                        </div>
                        <div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            <span>${year}</span>
                            <span class="text-indigo-400 font-extrabold">${finalType === 'movie' ? 'Anime Movie' : 'Anime Series'}</span>
                        </div>
                    </div>
                `;
                shelf.appendChild(card);
            });
            lucide.createIcons();
        }

        async function loadLiveAnimeChannels() {
            try {
                const response = await fetch('https://iptv-org.github.io/iptv/categories/animation.m3u');
                if (!response.ok) return;
                const text = await response.text();
                const lines = text.split('\n');
                let current = {};
                let channels = [];
                
                for (let line of lines) {
                    line = line.trim();
                    if (line.startsWith('#EXTINF')) {
                        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
                        if (logoMatch) current.logo = logoMatch[1];
                        const nameParts = line.split(',');
                        current.name = nameParts.length > 1 ? nameParts[1].trim() : "Anime Channel";
                    } else if (line.startsWith('http')) {
                        current.url = line;
                        if (current.name) channels.push(Object.assign({}, current));
                        current = {};
                    }
                }
                
                // Add some hardcoded top Japanese channels as requested if they aren't in the list
                const topChannels = [
                    { name: "Animax Global", url: "https://amg02159-kcglobal-amg02159c1-samsung-in-521.playouts.now.amagi.tv/playlist/amg02159-kcglobal-animax-samsungin/playlist.m3u8", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Animax.png/960px-Animax.png" },
                    { name: "TV Tokyo (Live)", url: "https://nhkworld.webcdn.stream.ne.jp/www11/nhkworld-tv/global/2003458/live.m3u8", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/TV_Tokyo_logo_2023.svg/512px-TV_Tokyo_logo_2023.svg.png" },
                    { name: "Animax Asia", url: "https://sra72yz.s.gy/ANIMAX_ASIA_SD", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Animax.png/960px-Animax.png" },
                    { name: "AT-X (Anime Theater X)", url: "https://amg18481-amg18481c1-amgplt0352.playout.now3.amagi.tv/playlist/amg18481-amg18481c1-amgplt0352/playlist.m3u8", logo: "https://upload.wikimedia.org/wikipedia/commons/e/ec/AT-X_logo.png" }
                ];
                
                // Prepend top channels
                channels = [...topChannels, ...channels];
                
                const shelf = document.getElementById('animeChannelsShelf');
                if (!shelf) return;
                shelf.innerHTML = '';
                
                channels.slice(0, 25).forEach(ch => {
                    const title = ch.name;
                    const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=6366f1&size=256&bold=true';
                    const poster = ch.logo || fallbackLogo;
                    
                    const card = document.createElement('div');
                    card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-indigo-500/30 shadow-md";
                    card.onclick = () => openFullscreenPlayer(ch.url, title);
                    
                    card.innerHTML = `
                        <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
                            <img src="${poster}" alt="${title}" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500">
                            <div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md backdrop-blur-sm">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> LIVE
                            </div>
                        </div>
                        <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                            <div>
                                <h3 class="text-xs font-black text-white truncate w-full uppercase tracking-tight" title="${title}">${title}</h3>
                                <div class="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span>LIVE TV</span>
                                </div>
                            </div>
                        </div>
                    `;
                    shelf.appendChild(card);
                });
                lucide.createIcons();
            } catch (e) {
                console.warn('Failed to load anime channels', e);
            }
        }

        async function loadDemonSlayerTimeline() {
            try {
                // Fetch Demon Slayer TV series & compilations with individual try-catches to prevent total failure
                let dsTv = { vote_average: 8.7 };
                let mugenMovie = { vote_average: 8.4, poster_path: "/h8g6vth0gZAIvOIbZgTwv06u96c.jpg" };
                let swordsmithMovie = { vote_average: 8.0, poster_path: "/6990g668EAtWsc2x9O6fG68A7Q.jpg" };
                let hashiraMovie = { vote_average: 7.5, poster_path: "/fLpSThW7VAti9ZWeQf07vC3mE0H.jpg" };

                try {
                    dsTv = await fetchTMDB('tv/85931');
                } catch (err) {
                    console.warn("Failed to fetch dsTv, using fallback", err);
                }

                try {
                    mugenMovie = await fetchTMDB('movie/635302');
                } catch (err) {
                    console.warn("Failed to fetch mugenMovie, using fallback", err);
                }

                try {
                    swordsmithMovie = await fetchTMDB('movie/1067283');
                } catch (err) {
                    console.warn("Failed to fetch swordsmithMovie, using fallback", err);
                }

                try {
                    hashiraMovie = await fetchTMDB('movie/1216221');
                } catch (err) {
                    console.warn("Failed to fetch hashiraMovie, using fallback", err);
                }

                const timelineData = [
                    {
                        title: "Unwavering Resolve Arc",
                        jpTitle: "竈門炭治郎 立志編",
                        chrono: "Chrono 1",
                        type: "tv",
                        mediaId: 85931,
                        season: 1,
                        episode: 1,
                        year: "2019",
                        rating: dsTv.vote_average ? dsTv.vote_average.toFixed(1) : "8.7",
                        poster: "https://image.tmdb.org/t/p/w400/96Lg36T6Oatn69XG76ZzAn45Rpx.jpg",
                        accent: "from-orange-500 to-red-600 shadow-[0_0_15px_rgba(249,115,22,0.4)]",
                        desc: "Tanjiro trains diligently to become a Demon Slayer and find a cure for his demonic sister, Nezuko."
                    },
                    {
                        title: "Mugen Train Arc (Movie)",
                        jpTitle: "無限列車編",
                        chrono: "Chrono 2",
                        type: "movie",
                        mediaId: 635302,
                        year: "2020",
                        rating: mugenMovie.vote_average ? mugenMovie.vote_average.toFixed(1) : "8.4",
                        poster: mugenMovie.poster_path ? `https://image.tmdb.org/t/p/w400${mugenMovie.poster_path}` : "https://image.tmdb.org/t/p/w400/h8g6vth0gZAIvOIbZgTwv06u96c.jpg",
                        accent: "from-red-600 to-amber-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]",
                        desc: "Tanjiro, Nezuko, Zenitsu, and Inosuke join Kyojuro Rengoku, the Flame Hashira, to eliminate a demon on a mysterious train."
                    },
                    {
                        title: "Entertainment District Arc",
                        jpTitle: "遊郭編",
                        chrono: "Chrono 3",
                        type: "tv",
                        mediaId: 85931,
                        season: 2,
                        episode: 1,
                        year: "2021",
                        rating: dsTv.vote_average ? dsTv.vote_average.toFixed(1) : "8.7",
                        poster: "https://image.tmdb.org/t/p/w400/o7369uSca67uYgZ7L67g7gI690Y.jpg",
                        accent: "from-amber-500 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]",
                        desc: "Accompanied by Tengen Uzui, the Sound Hashira, the Slayers infiltrate the Yoshiwara red-light district to hunt Upper Rank demons."
                    },
                    {
                        title: "To the Swordsmith Village",
                        jpTitle: "「刀鍛冶の里へ」",
                        chrono: "Chrono 4",
                        type: "movie",
                        mediaId: 1067283,
                        year: "2023",
                        rating: swordsmithMovie.vote_average ? swordsmithMovie.vote_average.toFixed(1) : "8.0",
                        poster: swordsmithMovie.poster_path ? `https://image.tmdb.org/t/p/w400${swordsmithMovie.poster_path}` : "https://image.tmdb.org/t/p/w400/6990g668EAtWsc2x9O6fG68A7Q.jpg",
                        accent: "from-red-500 to-pink-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]",
                        desc: "Special theatrical bridge compilation featuring the climax of Yoshiwara and the introductory chapter of Swordsmith Village."
                    },
                    {
                        title: "Swordsmith Village Arc",
                        jpTitle: "刀鍛冶の里編",
                        chrono: "Chrono 5",
                        type: "tv",
                        mediaId: 85931,
                        season: 3,
                        episode: 1,
                        year: "2023",
                        rating: dsTv.vote_average ? dsTv.vote_average.toFixed(1) : "8.7",
                        poster: "https://image.tmdb.org/t/p/w400/y9M7A0iZia3VnZ0R1OAnO2gR6Lp.jpg",
                        accent: "from-pink-500 to-violet-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]",
                        desc: "Tanjiro travels to the hidden Swordsmith Village to repair his broken weapon, meeting the Mist and Love Hashiras."
                    },
                    {
                        title: "To the Hashira Training",
                        jpTitle: "「柱稽古へ」",
                        chrono: "Chrono 6",
                        type: "movie",
                        mediaId: 1216221,
                        year: "2024",
                        rating: hashiraMovie.vote_average ? hashiraMovie.vote_average.toFixed(1) : "7.5",
                        poster: hashiraMovie.poster_path ? `https://image.tmdb.org/t/p/w400${hashiraMovie.poster_path}` : "https://image.tmdb.org/t/p/w400/fLpSThW7VAti9ZWeQf07vC3mE0H.jpg",
                        accent: "from-indigo-500 to-teal-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]",
                        desc: "Theatrical feature combining the spectacular finale of Swordsmith Village Arc with the first hour of the Hashira Training Arc."
                    },
                    {
                        title: "Hashira Training Arc",
                        jpTitle: "柱稽古編",
                        chrono: "Chrono 7",
                        type: "tv",
                        mediaId: 85931,
                        season: 4,
                        episode: 1,
                        year: "2024",
                        rating: dsTv.vote_average ? dsTv.vote_average.toFixed(1) : "8.7",
                        poster: "https://image.tmdb.org/t/p/w400/fLpSThW7VAti9ZWeQf07vC3mE0H.jpg",
                        accent: "from-teal-500 to-emerald-500 shadow-[0_0_15px_rgba(20,184,166,0.4)]",
                        desc: "Tanjiro and the remaining Slayers embark on an exhausting training camp conducted by the Hashira to prepare for the final war."
                    }
                ];

                const shelf = document.getElementById('demonSlayerTimelineShelf');
                if (!shelf) return;
                shelf.innerHTML = '';

                timelineData.forEach((item, idx) => {
                    const card = document.createElement('div');
                    card.className = "flex items-center gap-4 shrink-0 relative";

                    // Timeline node circle indicator
                    const nodeHtml = `
                        <div class="hidden md:flex flex-col items-center justify-center relative select-none shrink-0 self-center">
                            <div class="w-10 h-10 rounded-full bg-zinc-950 border-2 border-red-500 flex items-center justify-center font-black text-xs text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] relative z-20 hover:scale-110 transition-transform">
                                ${idx + 1}
                            </div>
                            ${idx < timelineData.length - 1 ? `<div class="w-0.5 h-32 bg-gradient-to-b from-red-500 to-orange-500 opacity-30 mt-2 z-10"></div>` : ''}
                        </div>
                    `;

                    // Main card body
                    card.innerHTML = `
                        ${nodeHtml}
                        <div class="w-56 sm:w-64 bg-zinc-950/90 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.25)] transition-all duration-500 transform hover:scale-[1.03] active:scale-[0.98] relative flex flex-col group shadow-xl">
                            <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                                <img src="${item.poster}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700">
                                <div class="absolute top-3 left-3 bg-gradient-to-r ${item.accent} px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white border border-white/10 flex items-center gap-1 shadow-md">
                                    <i data-lucide="compass" class="w-3 h-3 animate-spin" style="animation-duration: 8s;"></i> <span>${item.chrono}</span>
                                </div>
                                <div class="absolute top-3 right-3 bg-black/85 px-2 py-0.5 rounded-lg text-[10px] font-black border border-white/15 flex items-center gap-0.5 shadow-md text-white">
                                    <i data-lucide="star" class="w-3 h-3 text-red-500 fill-red-500"></i> <span>${item.rating}</span>
                                </div>
                            </div>
                            <div class="p-4 bg-zinc-950/95 flex-grow flex flex-col justify-between border-t border-white/5 min-h-[160px]">
                                <div class="space-y-1.5">
                                    <div class="text-[9px] font-black uppercase tracking-widest text-red-400 flex items-center justify-between">
                                        <span>${item.jpTitle}</span>
                                        <span class="bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/10 text-red-500">${item.type === 'tv' ? 'Series' : 'Movie'}</span>
                                    </div>
                                    <h3 class="text-xs sm:text-sm font-black text-white group-hover:text-red-400 transition-colors uppercase tracking-tight line-clamp-1" title="${item.title}">${item.title}</h3>
                                    <p class="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed font-semibold line-clamp-3 group-hover:text-zinc-300 transition-colors">${item.desc}</p>
                                </div>
                                <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-3 pt-3 border-t border-white/5">
                                    <span>${item.year}</span>
                                    <span class="text-indigo-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">Stream Arc <i data-lucide="chevron-right" class="w-3 h-3"></i></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Connecting Line for Horizontal Scroll -->
                        ${idx < timelineData.length - 1 ? `
                        <div class="hidden md:flex items-center justify-center pointer-events-none select-none shrink-0 self-center -mx-1">
                            <div class="w-10 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 opacity-20 relative">
                                <div class="absolute inset-0 bg-red-500 blur-sm opacity-50 animate-pulse"></div>
                            </div>
                        </div>
                        ` : ''}
                    `;

                    card.onclick = () => {
                        if (item.type === 'tv') {
                            openDetails(item.mediaId, 'tv', item.season, item.episode);
                        } else {
                            openDetails(item.mediaId, 'movie');
                        }
                    };

                    shelf.appendChild(card);
                });

                lucide.createIcons();
            } catch (err) {
                console.error("Failed to load Demon Slayer timeline", err);
            }
        }


        function renderAnimeGrid() {
            const grid = document.getElementById('animeGrid');
            grid.innerHTML = '';
            
            animeList.forEach(item => {
                const title = item.name || item.title || "Untitled Anime";
                const poster = item.poster_path ? `https://image.tmdb.org/t/p/w300${item.poster_path}` : 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.first_air_date || item.release_date || '').split('-')[0] || '2024';
                
                const card = document.createElement('div');
                card.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-red-500/30";
                card.onclick = () => openDetails(item.id, 'tv');
                
                card.innerHTML = `
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                        <img src="${poster}" alt="${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                        <div class="absolute top-2 right-2 bg-red-600/90 text-white px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-red-500/20 flex items-center gap-0.5 shadow-md">
                            <i data-lucide="sparkles" class="w-2.5 h-2.5 fill-white text-white"></i> Otaku Hot
                        </div>
                        <div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-red-500 border border-white/5 flex items-center gap-0.5 shadow-md">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-red-500 text-red-500"></i> ${rating}
                        </div>
                    </div>
                    <div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
                        <h3 class="text-xs font-extrabold text-white truncate uppercase tracking-tight" title="${title}">${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                            <span>${year}</span>
                            <span class="text-red-500 font-extrabold">Anime TV</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }

        let animeSearchTimeout = null;
        function debounceAnimeSearch() {
            clearTimeout(animeSearchTimeout);
            animeSearchTimeout = setTimeout(() => {
                animePage = 1;
                loadAnimeCatalog();
            }, 400);
        }

        function applyAnimeFilters() {
            animePage = 1;
            loadAnimeCatalog();
        }

        function loadMoreAnime() {
            animePage++;
            loadAnimeCatalog();
        }

        // Active Sports Category Selector
        window.activeSportsCategory = 'all';
        function filterSportsCategory(cat) {
            window.activeSportsCategory = cat;
            
            // Highlight selected button
            const categories = ['all', 'sky', 'football', 'cricket', 'f1', 'us', 'sony', 'hbo', 'kids', 'saved'];
            categories.forEach(c => {
                const btn = document.getElementById(`btn-sport-${c}`);
                if (btn) {
                    if (c === cat) {
                        btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-emerald-600 text-white border border-emerald-500/30";
                    } else {
                        btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-zinc-900 text-slate-400 hover:text-white border border-white/5";
                    }
                }
            });
            
            const homeLayout = document.getElementById('sportsHomeLayout');
            const catalogLayout = document.getElementById('sportsCatalogLayout');
            const searchQuery = document.getElementById('sportsSearch') ? document.getElementById('sportsSearch').value.toLowerCase().trim() : '';

            if (cat === 'saved') {
                if (homeLayout) homeLayout.classList.add('hidden');
                if (catalogLayout) catalogLayout.classList.remove('hidden');
                
                let list = getSavedSports();
                if (searchQuery !== '') {
                    list = list.filter(c => c.name.toLowerCase().includes(searchQuery));
                }
                renderSportsGrid(list);
            } else if (cat === 'all' && searchQuery === '') {
                if (homeLayout) homeLayout.classList.remove('hidden');
                if (catalogLayout) catalogLayout.classList.add('hidden');
                renderSportsHome();
            } else {
                if (homeLayout) homeLayout.classList.add('hidden');
                if (catalogLayout) catalogLayout.classList.remove('hidden');
                
                // Filter live channel names
                let list = window.allSportsChannels || [];
                if (cat !== 'all') {
                    if (cat === 'sky') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('sky'));
                    } else if (cat === 'football') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('sports 1') || ch.name.toLowerCase().includes('sports 2') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
                    } else if (cat === 'cricket') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric'));
                    } else if (cat === 'f1') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
                    } else if (cat === 'us') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
                    } else if (cat === 'sony') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('sony'));
                    } else if (cat === 'hbo') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
                    } else if (cat === 'kids') {
                        list = list.filter(ch => ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
                    }
                }
                
                if (searchQuery !== '') {
                    list = list.filter(ch => ch.name.toLowerCase().includes(searchQuery));
                }
                
                renderSportsGrid(list);
            }
        }

        // ==========================================
        // ELECTRONIC PROGRAM GUIDE (EPG) SYSTEM LOGIC
        // ==========================================
        window.epgChannels = [];
        window.epgProgrammes = [];
        window.epgSelectedDayOffset = 0; // 0 = Today, 1 = Tomorrow, 2 = Day After

        function handleEpgProviderChange() {
            const select = document.getElementById('epgProviderSelect');
            const customContainer = document.getElementById('epgCustomUrlContainer');
            if (select && customContainer) {
                if (select.value === 'custom') {
                    customContainer.classList.remove('hidden');
                } else {
                    customContainer.classList.add('hidden');
                }
            }
        }

        function parseXmltvDate(str) {
            if (!str) return null;
            const match = str.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
            if (!match) return new Date(str);
            const [_, year, month, day, hour, minute, second] = match;
            
            let tzOffsetMs = 0;
            const tzMatch = str.match(/([+-])(\d{2})(\d{2})$/);
            if (tzMatch) {
                const sign = tzMatch[1] === '+' ? 1 : -1;
                const tzHours = parseInt(tzMatch[2], 10);
                const tzMins = parseInt(tzMatch[3], 10);
                tzOffsetMs = sign * (tzHours * 60 + tzMins) * 60 * 1000;
            }
            
            const utcDate = new Date(Date.UTC(
                parseInt(year, 10),
                parseInt(month, 10) - 1,
                parseInt(day, 10),
                parseInt(hour, 10),
                parseInt(minute, 10),
                parseInt(second, 10)
            ));
            
            if (tzOffsetMs !== 0) {
                return new Date(utcDate.getTime() - tzOffsetMs);
            }
            return utcDate;
        }

        function generateDemoEpgData() {
            const demoChannels = [
                { id: "hbo", name: "HBO HD Action", logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=100&h=100&fit=crop" },
                { id: "espn", name: "ESPN Live Arena", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=100&h=100&fit=crop" },
                { id: "discovery", name: "Discovery Explorer", logo: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=100&h=100&fit=crop" },
                { id: "cnn", name: "CNN Global Express", logo: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=100&h=100&fit=crop" },
                { id: "disney", name: "Disney Magical Kidz", logo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=100&h=100&fit=crop" },
                { id: "mtv", name: "MTV Ultra Hits", logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=100&h=100&fit=crop" },
                { id: "natgeo", name: "National Geographic HD", logo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=100&h=100&fit=crop" },
                { id: "action_cinema", name: "Action Cinema Extra", logo: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=100&h=100&fit=crop" }
            ];

            const today = new Date();
            today.setHours(0,0,0,0);

            const demoProgrammes = [];
            const titlesByChannel = {
                hbo: [
                    { title: "Inception (Directors Cut)", desc: "A thief who steals corporate secrets through the use of dream-sharing technology must execute the reverse.", cat: "Movie" },
                    { title: "Game of Thrones: Season 8", desc: "The final battle for the Iron Throne of Westeros culminates in an epic showdown.", cat: "Series" },
                    { title: "Dune: Part Two", desc: "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators.", cat: "Movie" },
                    { title: "Succession: Ep 9", desc: "The Roy family fights for ultimate control over the world's largest media empire.", cat: "Series" },
                    { title: "The Dark Knight", desc: "When the menace known as the Joker wreaks havoc and chaos on Gotham City.", cat: "Movie" },
                    { title: "Interstellar", desc: "A team of space explorers travel through a wormhole to find a new home for mankind.", cat: "Movie" }
                ],
                espn: [
                    { title: "SportsCenter Live Morning", desc: "Comprehensive sports news, analytic breakdowns, daily highlights, and expert interviews.", cat: "Sports" },
                    { title: "Premier League: Match of the Day", desc: "A detailed analysis and breakdown of the biggest soccer matches in England.", cat: "Sports" },
                    { title: "NBA Tonight Live", desc: "Scores, stats, previews, and spectacular plays from tonight's basketball courts.", cat: "Sports" },
                    { title: "F1 Grand Prix Pre-Show", desc: "Technical pit lane analysis, tire strategies, track walkthroughs, and interviews.", cat: "Sports" },
                    { title: "Wimbledon Classics", desc: "Revisiting legendary five-set tennis matches from the grass courts of London.", cat: "Sports" }
                ],
                discovery: [
                    { title: "MythBusters Recharged", desc: "Special effects experts use modern science to test common urban legends and myths.", cat: "Documentary" },
                    { title: "Deadliest Catch: Wild Seas", desc: "Alaskan king crab fishing fleets battle brutal storms and freezing waves.", cat: "Reality" },
                    { title: "How It's Made: Factories", desc: "Discover how everyday objects are produced using automated factory lines.", cat: "Educational" },
                    { title: "Gold Rush: Yukon Chase", desc: "Teams of gold miners take extreme financial risks to strike a massive payload.", cat: "Reality" }
                ],
                cnn: [
                    { title: "Global Newsroom Live", desc: "Live breaking coverage, field correspondents, international panels, and special features.", cat: "News" },
                    { title: "Amanpour & Company", desc: "Thought-provoking global affairs discussions with key authors, leaders, and thinkers.", cat: "News" },
                    { title: "Quest Means Business", desc: "Richard Quest reports on international economic trends and stock market volatility.", cat: "Finance" },
                    { title: "State of the Union", desc: "Exclusive political talk show examining the legislative developments in Washington.", cat: "News" }
                ],
                disney: [
                    { title: "Mickey Mouse Playhouse", desc: "Interactive puzzle-solving fun and musical adventures with Mickey and Donald.", cat: "Kids" },
                    { title: "Phineas and Ferb Marathon", desc: "Two creative stepbrothers design massive rollercoasters and inventions in their backyard.", cat: "Kids" },
                    { title: "Gravity Falls: Mystery Shack", desc: "Twins Dipper and Mabel solve supernatural anomalies in a quirky Oregon forest.", cat: "Animation" },
                    { title: "The Lion King (Animated)", desc: "A young lion cub flees his pride after tragedy, only to return to reclaim his destiny.", cat: "Movie" }
                ],
                mtv: [
                    { title: "Top 20 Streaming Hitlist", desc: "Counting down the most popular music videos and tracks of the week.", cat: "Music" },
                    { title: "Unplugged Acoustic Sessions", desc: "Raw, intimate, and stripped-down acoustic sets by famous artists.", cat: "Music" },
                    { title: "Club Anthems Energy Mix", desc: "Continuous high-tempo EDM and house music curated by elite DJs.", cat: "Music" },
                    { title: "Legends of Rock Documentary", desc: "A deeper look at the historic rise, fallout, and reunion of legendary rock bands.", cat: "Music" }
                ],
                natgeo: [
                    { title: "Our Planet: Deep Oceans", desc: "Take a dive into the darkest depths of the ocean to see rare biological wonders.", cat: "Documentary" },
                    { title: "Cosmos: Cosmic Odyssey", desc: "A beautiful exploration of science, astrophysics, and cosmic evolution.", cat: "Science" },
                    { title: "Secrets of the Wildlife Zoo", desc: "Inside the intricate daily medical and nutritional care at a world-class zoo.", cat: "Nature" },
                    { title: "Air Crash Investigation Case", desc: "Step-by-step forensic reviews of historical air disasters to improve flight safety.", cat: "Documentary" }
                ],
                action_cinema: [
                    { title: "Mad Max: Fury Road", desc: "In a brutal post-apocalyptic desert world, a woman rebels against a tyrant.", cat: "Movie" },
                    { title: "John Wick: Chapter 2", desc: "An legendary hitman is forced out of retirement to fulfill a blood oath in Rome.", cat: "Movie" },
                    { title: "Gladiator: Arena Edition", desc: "A betrayed Roman General becomes a gladiator to exact revenge against a corrupt emperor.", cat: "Movie" },
                    { title: "Die Hard (1988)", desc: "An NYPD officer faces off against professional bank thieves inside a high-rise office building.", cat: "Movie" }
                ]
            };

            demoChannels.forEach(ch => {
                const templates = titlesByChannel[ch.id] || [{ title: "General Program", desc: "General daily program schedule.", cat: "General" }];
                let currentTime = new Date(today);
                
                const endOfEpgPeriod = new Date(today);
                endOfEpgPeriod.setDate(endOfEpgPeriod.getDate() + 3); // 3 full days of scheduling
                
                let idx = 0;
                while (currentTime < endOfEpgPeriod) {
                    const template = templates[idx % templates.length];
                    const durations = [60, 90, 120, 180];
                    const durationMins = durations[(ch.id.charCodeAt(0) + idx) % durations.length];
                    
                    const pStart = new Date(currentTime);
                    const pEnd = new Date(currentTime.getTime() + durationMins * 60 * 1000);
                    
                    demoProgrammes.push({
                        channel: ch.id,
                        title: template.title,
                        desc: template.desc,
                        category: template.cat,
                        start: pStart,
                        end: pEnd
                    });
                    
                    currentTime = pEnd;
                    idx++;
                }
            });

            return { channels: demoChannels, programmes: demoProgrammes };
        }

        async function fetchAndParseEpg(silent = false) {
            const select = document.getElementById('epgProviderSelect');
            const loadIcon = document.getElementById('epgLoadIcon');
            const loadBtn = document.getElementById('epgLoadBtn');
            const container = document.getElementById('epgGuideContainer');
            const emptyState = document.getElementById('epgEmptyState');
            const loadingState = document.getElementById('epgLoadingState');
            const channelsCountBadge = document.getElementById('epgChannelsCountBadge');

            if (!select) return;

            // Show Loading State
            if (!silent) {
                if (emptyState) emptyState.classList.add('hidden');
                if (container) container.classList.add('hidden');
                if (loadingState) loadingState.classList.remove('hidden');
                if (loadIcon) loadIcon.classList.add('animate-spin');
                if (loadBtn) {
                    loadBtn.disabled = true;
                    loadBtn.classList.add('opacity-75');
                }
            }

            try {
                const feedVal = select.value;
                if (feedVal === 'demo') {
                    // Load Offline Demo
                    const data = generateDemoEpgData();
                    const normalizeName = (name) => name.replace(/\[.*?\]|\(.*?\)|\|.*/g, '').replace(/\b(hd|fhd|4k|sd)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    window.epgChannels = [];
                    window.epgProgrammesByChannel = {};
                    window.epgProgrammes = data.programmes;

                    let baseChannels = window.allSportsChannels && window.allSportsChannels.length > 0 ? window.allSportsChannels : data.channels;

                    for (let i = 0; i < baseChannels.length; i++) {
                        const ch = baseChannels[i];
                        const cleanName = normalizeName(ch.name.replace(/⭐️/g, '').trim());
                        const chId = ch.id || ("mapped_" + i);

                        let matchedEpgIds = [];
                        if (baseChannels === window.allSportsChannels) {
                            let matchedEpgChan = data.channels.find(c => {
                                const cName = normalizeName(c.name);
                                if (!cName || !cleanName) return false;
                                if (cName === cleanName) return true;
                                if (cName.length > 4 && cleanName.includes(cName)) return true;
                                if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                return false;
                            });
                            
                            if (matchedEpgChan) {
                                matchedEpgIds.push(matchedEpgChan.id);
                            }
                        } else {
                            matchedEpgIds.push(ch.id);
                        }

                        const finalChan = {
                            id: chId,
                            name: ch.name.replace(/⭐️/g, '').trim(),
                            logo: (typeof getSportsLogo === 'function' ? getSportsLogo(ch) : (ch.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(ch.name)+'&background=05070a&color=10b981&size=256&bold=true')),
                            url: ch.url || ch.stream_url
                        };
                        window.epgChannels.push(finalChan);
                        window.epgProgrammesByChannel[chId] = [];

                        if (matchedEpgIds.length > 0) {
                            for (const p of data.programmes) {
                                if (matchedEpgIds.includes(p.channel)) {
                                    window.epgProgrammesByChannel[chId].push({...p, channel: chId});
                                }
                            }
                        }
                    }
                    // synthesize fallback for channels without EPG
                    const nowFallback = new Date();
                    nowFallback.setHours(0,0,0,0);
                    const todayStart = nowFallback.getTime();
                    const tomorrowStart = todayStart + 86400000;
                    const nextDayStart = tomorrowStart + 86400000;

                    for (const c of window.epgChannels) {
                        if (!window.epgProgrammesByChannel[c.id] || window.epgProgrammesByChannel[c.id].length === 0) {
                            window.epgProgrammesByChannel[c.id] = [
                                {
                                    id: c.id + '_dummy_1',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(todayStart),
                                    end: new Date(tomorrowStart - 1000),
                                    category: "Live"
                                },
                                {
                                    id: c.id + '_dummy_2',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(tomorrowStart),
                                    end: new Date(nextDayStart - 1000),
                                    category: "Live"
                                }
                            ];
                        }
                    }

                } else {
                    let url = feedVal;
                    if (feedVal === 'custom') {
                        const customInput = document.getElementById('epgCustomUrlInput');
                        url = customInput ? customInput.value.trim() : '';
                    }
                    
                    if (!url) {
                        alert("Please provide a valid XMLTV URL feed.");
                        if (loadingState) loadingState.classList.add('hidden');
                        if (emptyState) emptyState.classList.remove('hidden');
                        if (loadIcon) loadIcon.classList.remove('animate-spin');
                        if (loadBtn) {
                            loadBtn.disabled = false;
                            loadBtn.classList.remove('opacity-75');
                        }
                        return;
                    }

                    let allChannels = [];
                    let allProgrammes = [];
                    
                    try {
                        const response = await fetch(`/api/epg-json?urls=${encodeURIComponent(url)}`);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch JSON EPG: ${response.statusText}`);
                        }
                        const data = await response.json();
                        
                        allChannels = data.channels || [];
                        const rawProgrammes = data.programmes || [];
                        
                        // Parse dates on client to save server CPU
                        for (let i = 0; i < rawProgrammes.length; i++) {
                            const p = rawProgrammes[i];
                            allProgrammes.push({
                                channel: p.channel,
                                start: parseXmltvDate(p.start),
                                end: parseXmltvDate(p.end),
                                title: p.title,
                                desc: p.desc,
                                category: p.category
                            });
                            // Yield occasionally
                            if (i % 10000 === 0) await new Promise(r => setTimeout(r, 0));
                        }
                    } catch (e) {
                        console.error("Failed to load EPG from server", e);
                    }

                    if (allChannels.length === 0) {
                        throw new Error("No channels found in provided XMLTV EPG sources.");
                    }

                    const normalizeName = (name) => name.replace(/\[.*?\]|\(.*?\)|\|.*/g, '').replace(/\b(hd|fhd|4k|sd)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    window.epgChannels = [];
                    window.epgProgrammesByChannel = {};
                    window.epgProgrammes = allProgrammes;

                    let baseChannels = window.allSportsChannels && window.allSportsChannels.length > 0 ? window.allSportsChannels : allChannels;

                    for (let i = 0; i < baseChannels.length; i++) {
                        const ch = baseChannels[i];
                        const cleanName = normalizeName(ch.name.replace(/⭐️/g, '').trim());
                        const chId = ch.id || ("mapped_" + i);

                        let matchedEpgIds = [];
                        if (baseChannels === window.allSportsChannels) {
                            let matchedEpgChan = allChannels.find(c => {
                                const cName = normalizeName(c.name);
                                if (!cName || !cleanName) return false;
                                if (cName === cleanName) return true;
                                if (cName.length > 4 && cleanName.includes(cName)) return true;
                                if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                return false;
                            });
                            
                            if (matchedEpgChan) {
                                matchedEpgIds.push(matchedEpgChan.id);
                            }
                        } else {
                            matchedEpgIds.push(ch.id);
                        }

                        const finalChan = {
                            id: chId,
                            name: ch.name.replace(/⭐️/g, '').trim(),
                            logo: (typeof getSportsLogo === 'function' ? getSportsLogo(ch) : (ch.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(ch.name)+'&background=05070a&color=10b981&size=256&bold=true')),
                            url: ch.url || ch.stream_url
                        };
                        window.epgChannels.push(finalChan);
                        window.epgProgrammesByChannel[chId] = [];

                        if (matchedEpgIds.length > 0) {
                            for (const p of allProgrammes) {
                                if (matchedEpgIds.includes(p.channel)) {
                                    window.epgProgrammesByChannel[chId].push({...p, channel: chId});
                                }
                            }
                        }
                    }

                    // synthesize fallback for channels without EPG
                    const nowFallback = new Date();
                    nowFallback.setHours(0,0,0,0);
                    const todayStart = nowFallback.getTime();
                    const tomorrowStart = todayStart + 86400000;
                    const nextDayStart = tomorrowStart + 86400000;

                    for (const c of window.epgChannels) {
                        if (!window.epgProgrammesByChannel[c.id] || window.epgProgrammesByChannel[c.id].length === 0) {
                            window.epgProgrammesByChannel[c.id] = [
                                {
                                    id: c.id + '_dummy_1',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(todayStart),
                                    end: new Date(tomorrowStart - 1000),
                                    category: "Live"
                                },
                                {
                                    id: c.id + '_dummy_2',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(tomorrowStart),
                                    end: new Date(nextDayStart - 1000),
                                    category: "Live"
                                }
                            ];
                        }
                    }
                }

                // Complete and render EPG Board
                if (loadingState) loadingState.classList.add('hidden');
                if (container) container.classList.remove('hidden');
                
                if (channelsCountBadge) {
                    channelsCountBadge.innerHTML = `<i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400 animate-pulse"></i> ${window.epgChannels.length} Channels Sourced`;
                }

                // Reset search
                const searchInp = document.getElementById('epgSearchInput');
                if (searchInp) searchInp.value = '';

                renderEpgBoard();

            } catch (err) {
                console.error("EPG fetch error:", err);
                if (!silent) {
                    alert(`Error loading EPG: ${err.message}. Showing offline demo as safe fallback.`);
                }
                
                // Load Demo offline as reliable safe fallback
                const data = generateDemoEpgData();
                const normalizeName = (name) => name.replace(/\[.*?\]|\(.*?\)|\|.*/g, '').replace(/\b(hd|fhd|4k|sd)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    window.epgChannels = [];
                    window.epgProgrammesByChannel = {};
                    window.epgProgrammes = data.programmes;

                    let baseChannels = window.allSportsChannels && window.allSportsChannels.length > 0 ? window.allSportsChannels : data.channels;

                    for (let i = 0; i < baseChannels.length; i++) {
                        const ch = baseChannels[i];
                        const cleanName = normalizeName(ch.name.replace(/⭐️/g, '').trim());
                        const chId = ch.id || ("mapped_" + i);

                        let matchedEpgIds = [];
                        if (baseChannels === window.allSportsChannels) {
                            let matchedEpgChan = data.channels.find(c => {
                                const cName = normalizeName(c.name);
                                if (!cName || !cleanName) return false;
                                if (cName === cleanName) return true;
                                if (cName.length > 4 && cleanName.includes(cName)) return true;
                                if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                return false;
                            });
                            
                            if (matchedEpgChan) {
                                matchedEpgIds.push(matchedEpgChan.id);
                            }
                        } else {
                            matchedEpgIds.push(ch.id);
                        }

                        const finalChan = {
                            id: chId,
                            name: ch.name.replace(/⭐️/g, '').trim(),
                            logo: (typeof getSportsLogo === 'function' ? getSportsLogo(ch) : (ch.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(ch.name)+'&background=05070a&color=10b981&size=256&bold=true')),
                            url: ch.url || ch.stream_url
                        };
                        window.epgChannels.push(finalChan);
                        window.epgProgrammesByChannel[chId] = [];

                        if (matchedEpgIds.length > 0) {
                            for (const p of data.programmes) {
                                if (matchedEpgIds.includes(p.channel)) {
                                    window.epgProgrammesByChannel[chId].push({...p, channel: chId});
                                }
                            }
                        }
                    }
                    // synthesize fallback for channels without EPG
                    const nowFallback = new Date();
                    nowFallback.setHours(0,0,0,0);
                    const todayStart = nowFallback.getTime();
                    const tomorrowStart = todayStart + 86400000;
                    const nextDayStart = tomorrowStart + 86400000;

                    for (const c of window.epgChannels) {
                        if (!window.epgProgrammesByChannel[c.id] || window.epgProgrammesByChannel[c.id].length === 0) {
                            window.epgProgrammesByChannel[c.id] = [
                                {
                                    id: c.id + '_dummy_1',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(todayStart),
                                    end: new Date(tomorrowStart - 1000),
                                    category: "Live"
                                },
                                {
                                    id: c.id + '_dummy_2',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(tomorrowStart),
                                    end: new Date(nextDayStart - 1000),
                                    category: "Live"
                                }
                            ];
                        }
                    }

                
                if (loadingState) loadingState.classList.add('hidden');
                if (container) container.classList.remove('hidden');
                if (channelsCountBadge) {
                    channelsCountBadge.innerHTML = `<i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400"></i> ${window.epgChannels.length} Demo Channels Loaded`;
                }
                renderEpgBoard();
            } finally {
                if (!silent) {
                    if (loadIcon) loadIcon.classList.remove('animate-spin');
                    if (loadBtn) {
                        loadBtn.disabled = false;
                        loadBtn.classList.remove('opacity-75');
                    }
                }
                if (window.lucide) lucide.createIcons();
            }
        }

        async function renderEpgBoard() {
            const dayTabsContainer = document.getElementById('epgDayTabs');
            const sidebarContainer = document.getElementById('epgSidebarChannels');
            const hoursHeader = document.getElementById('epgTimelineHoursHeader');
            const timelineBody = document.getElementById('epgTimelineBody');
            const channelCountText = document.getElementById('epgChannelCountText');

            if (!dayTabsContainer || !sidebarContainer || !hoursHeader || !timelineBody) return;

            // Generate Day Dates
            const todayMidnight = new Date();
            todayMidnight.setHours(0,0,0,0);

            const days = [];
            for (let i = 0; i < 3; i++) {
                const dayDate = new Date(todayMidnight);
                dayDate.setDate(dayDate.getDate() + i);
                days.push({
                    offset: i,
                    date: dayDate,
                    label: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + (i === 0 ? " (Today)" : i === 1 ? " (Tomorrow)" : "")
                });
            }

            // Render Day Selector Tabs
            dayTabsContainer.innerHTML = '';
            days.forEach(day => {
                const isActive = window.epgSelectedDayOffset === day.offset;
                const btn = document.createElement('button');
                btn.className = `px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all border ${isActive ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/15' : 'bg-black/60 text-slate-400 hover:text-white border-white/5'}`;
                btn.textContent = day.label;
                btn.onclick = () => selectEpgDay(day.offset);
                dayTabsContainer.appendChild(btn);
            });

            // Target midnight start & end bounds for selected day
            const selectedDayStart = days[window.epgSelectedDayOffset].date;
            const selectedDayEnd = new Date(selectedDayStart.getTime() + 24 * 60 * 60 * 1000);

            // Render Hours Timeline Header (24 hour blocks)
            hoursHeader.innerHTML = '';
            const totalHours = 24;
            const hourWidthPx = 150; // Width of 1 hour block
            const totalWidthPx = totalHours * hourWidthPx; // 3600px width

            for (let h = 0; h < totalHours; h++) {
                const tick = document.createElement('div');
                tick.className = "flex-shrink-0 h-full border-r border-white/5 flex flex-col justify-center px-4 font-black tracking-wider text-[10px] text-slate-400 uppercase select-none";
                tick.style.width = `${hourWidthPx}px`;
                
                const ampm = h >= 12 ? 'PM' : 'AM';
                const displayH = h % 12 === 0 ? 12 : h % 12;
                tick.textContent = `${displayH}:00 ${ampm}`;
                hoursHeader.appendChild(tick);
            }

            // Populate Channels and timelines
            
            sidebarContainer.innerHTML = '';
            timelineBody.innerHTML = '';
            
            window.epgFilteredChannels = window.epgChannels || [];
            channelCountText.textContent = window.epgFilteredChannels.length;
            
            window.epgRenderIndex = 0;
            const CHUNK_SIZE = 30;
            
            window.renderNextEpgChunk = async function() {
                const slice = window.epgFilteredChannels.slice(window.epgRenderIndex, window.epgRenderIndex + CHUNK_SIZE);
                if (slice.length === 0) return;
                
                for (let i = 0; i < slice.length; i++) {
                    const chan = slice[i];


            

                // Sidebar Item
                const sItem = document.createElement('div');
                sItem.id = `epg-sidebar-item-${chan.id}`;
                sItem.className = "epg-sidebar-item h-[65px] px-4 flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900/40 border-b border-white/5 transition-all cursor-pointer group";
                
                sItem.onclick = () => {
                    if (chan.url) {
                        openFullscreenPlayer(chan.url, chan.name);
                    } else {
                        openEpgChannelModal(chan.id, chan.name, chan.logo, chan.url);
                    }
                };

                // Fallback channel avatar
                const initials = chan.name.substring(0, 2).toUpperCase();
                sItem.innerHTML = `
                    <div class="w-9 h-9 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        <img src="${chan.logo}" alt="" class="w-full h-full object-cover" onerror="this.outerHTML='<span class=&quot;text-[10px] font-bold text-amber-500&quot;>${initials}</span>'">
                    </div>
                    <div class="min-w-0 flex-grow">
                        <p class="text-xs font-black uppercase text-white truncate leading-tight group-hover:text-amber-500 transition-colors">${chan.name}</p>
                        <p class="text-[9px] font-semibold text-amber-500 tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="play" class="w-2.5 h-2.5"></i> Play Channel</p>
                    </div>
                `;
                sidebarContainer.appendChild(sItem);

                // Timeline Row
                const tRow = document.createElement('div');
                tRow.className = "epg-timeline-row h-[65px] relative border-b border-white/5 overflow-hidden flex items-center";
                tRow.style.width = `${totalWidthPx}px`;
                tRow.dataset.channelId = chan.id;
                tRow.dataset.channelName = chan.name;

                // Grab programs for this channel
                const chanProgs = window.epgProgrammesByChannel[chan.id] || [];
                
                chanProgs.forEach((prog, pIdx) => {
                    const startMs = prog.start ? prog.start.getTime() : 0;
                    const endMs = prog.end ? prog.end.getTime() : 0;

                    // Skip program block if completely outside selected day bounds
                    if (endMs <= selectedDayStart.getTime() || startMs >= selectedDayEnd.getTime()) {
                        return;
                    }

                    // Clip start/end to day midnight limits for precise layout positioning
                    const drawStartMs = Math.max(startMs, selectedDayStart.getTime());
                    const drawEndMs = Math.min(endMs, selectedDayEnd.getTime());

                    const leftMinutes = (drawStartMs - selectedDayStart.getTime()) / (60 * 1000);
                    const durationMinutes = (drawEndMs - drawStartMs) / (60 * 1000);

                    // Compute responsive pixel left offset and card width
                    const cardLeft = (leftMinutes / 1440) * totalWidthPx;
                    const cardWidth = (durationMinutes / 1440) * totalWidthPx;

                    // Build program block card
                    const card = document.createElement('div');
                    card.className = "absolute top-2 bottom-2 bg-zinc-900 hover:bg-amber-600/20 hover:border-amber-500/50 border border-white/5 rounded-xl px-3 py-1.5 cursor-pointer flex flex-col justify-between transition-all select-none overflow-hidden group";
                    card.style.left = `${cardLeft}px`;
                    card.style.width = `${Math.max(cardWidth - 4, 30)}px`; // 4px padding/gap between consecutive cards

                    const timeLabel = `${prog.start ? formatTime12h(prog.start) : ""} - ${prog.end ? formatTime12h(prog.end) : ""}`;
                    
                    card.innerHTML = `
                        <p class="epg-program-title text-[11px] font-black uppercase text-slate-200 group-hover:text-amber-400 transition-colors truncate leading-tight">${prog.title}</p>
                        <div class="flex items-center justify-between text-[8px] font-black text-slate-500 uppercase tracking-wider mt-0.5">
                            <span class="truncate">${timeLabel}</span>
                            <span class="bg-white/5 px-1 py-0.5 rounded text-amber-500 border border-white/5">${prog.category || "General"}</span>
                        </div>
                    `;

                    // Trigger Program Info popup Modal on card click
                    card.onclick = () => openEpgProgramDetails(prog, chan.name, chan.url);
                    tRow.appendChild(card);
                });

                // If no programmes are available on this day, fill with a 24h generic block
                if (tRow.children.length === 0) {
                    const fallbackCard = document.createElement('div');
                    fallbackCard.className = "absolute top-2 bottom-2 left-1 right-1 bg-zinc-900/30 border border-dashed border-white/5 rounded-xl px-4 py-2 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase tracking-widest";
                    fallbackCard.textContent = "Broadcast programming scheduled, refer to broadcaster feed.";
                    tRow.appendChild(fallbackCard);
                }

                timelineBody.appendChild(tRow);
                
                
                    // Yield to avoid freeze
                    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
                }
                
                window.epgRenderIndex += CHUNK_SIZE;
                
                // If there are more channels, add an IntersectionObserver sentinel
                if (window.epgRenderIndex < window.epgFilteredChannels.length) {
                    const sentinel = document.createElement('div');
                    sentinel.className = 'h-10 w-full shrink-0 flex items-center justify-center';
                    sentinel.innerHTML = '<div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>';
                    
                    const tSentinel = document.createElement('div');
                    tSentinel.className = 'h-10 w-full shrink-0';
                    
                    const observer = new IntersectionObserver((entries) => {
                        if (entries[0].isIntersecting) {
                            observer.disconnect();
                            sentinel.remove();
                            tSentinel.remove();
                            window.renderNextEpgChunk();
                        }
                    }, { root: sidebarContainer, rootMargin: '100px' });
                    
                    sidebarContainer.appendChild(sentinel);
                    timelineBody.appendChild(tSentinel);
                    observer.observe(sentinel);
                }
                lucide.createIcons();
            }
            
            await window.renderNextEpgChunk();


            // Adjust Live Current Time Indicator Line
            const now = new Date();
            const timeIndicator = document.getElementById('epgCurrentTimeIndicator');
            
            if (window.epgSelectedDayOffset === 0 && now.getTime() >= selectedDayStart.getTime() && now.getTime() < selectedDayEnd.getTime()) {
                const nowMinutes = (now.getTime() - selectedDayStart.getTime()) / (60 * 1000);
                const indicatorLeft = (nowMinutes / 1440) * totalWidthPx;
                
                if (timeIndicator) {
                    timeIndicator.classList.remove('hidden');
                    timeIndicator.style.left = `${indicatorLeft}px`;
                }

                // Autoscroll horizontal list to center current program
                setTimeout(() => {
                    const targetScroll = Math.max(0, indicatorLeft - (timelineBody.clientWidth / 2.5));
                    timelineBody.scrollLeft = targetScroll;
                    if (hoursHeader) hoursHeader.scrollLeft = targetScroll;
                }, 350);
            } else {
                if (timeIndicator) timeIndicator.classList.add('hidden');
                // Auto scroll to 8 AM for later days
                setTimeout(() => {
                    const eightAmMinutes = 8 * 60;
                    const targetScroll = (eightAmMinutes / 1440) * totalWidthPx;
                    timelineBody.scrollLeft = targetScroll;
                    if (hoursHeader) hoursHeader.scrollLeft = targetScroll;
                }, 100);
            }

            lucide.createIcons();
        }

        function selectEpgDay(offset) {
            window.epgSelectedDayOffset = offset;
            renderEpgBoard();
        }

        function formatTime12h(date) {
            let hours = date.getHours();
            let minutes = date.getMinutes();
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;
            minutes = minutes < 10 ? '0'+minutes : minutes;
            return `${hours}:${minutes} ${ampm}`;
        }

        function openEpgProgramDetails(prog, channelName, channelUrl) {
            const modal = document.getElementById('epgProgramModal');
            if (!modal) return;

            document.getElementById('epgModalTitle').textContent = prog.title;
            document.getElementById('epgModalChannel').innerHTML = `<i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400"></i> ${channelName}`;
            
            const startLabel = prog.start ? formatTime12h(prog.start) : "";
            const endLabel = prog.end ? formatTime12h(prog.end) : "";
            document.getElementById('epgModalTime').textContent = `${startLabel} - ${endLabel}`;
            
            if (prog.start && prog.end) {
                const durationMins = Math.round((prog.end.getTime() - prog.start.getTime()) / (60 * 1000));
                document.getElementById('epgModalDuration').textContent = `${durationMins} Mins`;
            } else {
                document.getElementById('epgModalDuration').textContent = "Unknown Duration";
            }

            document.getElementById('epgModalCategory').textContent = prog.category || "Broadcast";
            document.getElementById('epgModalDesc').textContent = prog.desc ? prog.desc : "No program description has been provided by the external broadcaster.";

            const playBtnContainer = document.getElementById('epgModalPlayBtnContainer');
            if (playBtnContainer) {
                if (channelUrl) {
                    playBtnContainer.innerHTML = `<button onclick="closeEpgProgramModal(); openFullscreenPlayer('${channelUrl.replace(/'/g, "\\'")}', '${channelName.replace(/'/g, "\\'")}')" class="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Live Channel</button>`;
                } else {
                    playBtnContainer.innerHTML = '';
                }
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');
            lucide.createIcons();
        }

        function closeEpgProgramModal() {
            const modal = document.getElementById('epgProgramModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        async function openEpgChannelModal(channelId, channelName, channelLogo, channelUrl) {
            channelName = decodeURIComponent(channelName);
            channelLogo = decodeURIComponent(channelLogo);
            const modal = document.getElementById('epgChannelModal');
            if (!modal) return;
            
            document.getElementById('epgChannelModalTitle').textContent = channelName;
            const logoEl = document.getElementById('epgChannelModalLogo');
            if (logoEl) {
                logoEl.src = channelLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(channelName)}&background=05070a&color=10b981&size=256&bold=true`;
            }
            
            const liveContainer = document.getElementById('epgChannelModalLive');
            const upcomingContainer = document.getElementById('epgChannelModalUpcoming');
            
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            
            if (!window.epgProgrammes || window.epgProgrammes.length === 0) {
                liveContainer.innerHTML = `<div class="flex justify-center py-4"><i data-lucide="loader-2" class="w-6 h-6 text-emerald-500 animate-spin"></i></div>`;
                upcomingContainer.innerHTML = ``;
                if (window.lucide) lucide.createIcons();
                try {
                    await fetchAndParseEpg(true);
                } catch(e) {
                    console.error("Auto EPG fetch error:", e);
                }
            }
            
            if (!window.epgProgrammes || window.epgProgrammes.length === 0) {
                liveContainer.innerHTML = `<p class="text-xs text-red-400 font-bold">Failed to load EPG Data.</p>`;
                upcomingContainer.innerHTML = ``;
            } else {
                let progs = window.epgProgrammesByChannel[channelId] || [];
                if (progs.length === 0) {
                    const normalizeName = (name) => name.replace(/\[.*?\]|\(.*?\)|\|.*/g, '').replace(/\b(hd|fhd|4k|sd)\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    const cleanName = normalizeName(channelName);
                    
                    const matchedEpgChan = (window.epgChannels || []).find(c => {
                        const cName = normalizeName(c.name);
                        if (!cName || !cleanName) return false;
                        if (cName === cleanName) return true;
                        if (cName.length > 4 && cleanName.includes(cName)) return true;
                        if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                        return false;
                    });
                    if (matchedEpgChan) {
                        progs = window.epgProgrammesByChannel[matchedEpgChan.id] || [];
                    }
                }
                
                const now = new Date();
                
                if (progs.length === 0) {
                    liveContainer.innerHTML = `<p class="text-xs text-red-400 font-bold">No guide data found for this channel.</p>`;
                    upcomingContainer.innerHTML = ``;
                } else {
                    const currentProg = progs.find(p => p.start <= now && p.end > now);
                    if (currentProg) {
                        const startLabel = currentProg.start ? formatTime12h(currentProg.start) : "";
                        const endLabel = currentProg.end ? formatTime12h(currentProg.end) : "";
                        liveContainer.innerHTML = `
                            <p class="text-sm font-black text-white uppercase">${currentProg.title}</p>
                            <p class="text-[10px] font-bold text-red-400 mt-1">${startLabel} - ${endLabel} &bull; ${currentProg.category || "General"}</p>
                            <p class="text-xs text-slate-300 mt-2 line-clamp-2">${currentProg.desc || "No description available."}</p>
                        `;
                    } else {
                        liveContainer.innerHTML = `<p class="text-xs text-red-400 font-bold">No current program found.</p>`;
                    }
                    
                    const upcomingProgs = progs.filter(p => p.start > now).sort((a, b) => a.start - b.start);
                    if (upcomingProgs.length > 0) {
                        let html = '';
                        let currentDay = '';
                        upcomingProgs.forEach(prog => {
                            const startLabel = prog.start ? formatTime12h(prog.start) : "";
                            const endLabel = prog.end ? formatTime12h(prog.end) : "";
                            
                            let dayStr = "";
                            if (prog.start) {
                                const progDate = new Date(prog.start);
                                const todayDate = new Date();
                                const tomorrowDate = new Date(todayDate);
                                tomorrowDate.setDate(tomorrowDate.getDate() + 1);
                                
                                if (progDate.toDateString() === todayDate.toDateString()) {
                                    dayStr = "TODAY";
                                } else if (progDate.toDateString() === tomorrowDate.toDateString()) {
                                    dayStr = "TOMORROW";
                                } else {
                                    dayStr = progDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
                                }
                            }
                            
                            if (dayStr !== currentDay) {
                                html += `<h4 class="text-[10px] font-black text-amber-500 uppercase tracking-widest mt-4 mb-2">${dayStr}</h4>`;
                                currentDay = dayStr;
                            }
                            
                            html += `
                                <div class="bg-zinc-900/50 border border-white/5 rounded-xl p-3 hover:bg-zinc-900 transition-colors cursor-pointer mb-2" onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\'")}', start: new Date('${prog.start}'), end: new Date('${prog.end}'), desc: '${(prog.desc || "").replace(/'/g, "\\'")}', category: '${(prog.category || "").replace(/'/g, "\\'")}'}, '${channelName.replace(/'/g, "\\'")}', (typeof channelUrl !== 'undefined' ? channelUrl : null))">
                                    <div class="flex items-center justify-between gap-2">
                                        <p class="text-xs font-black text-slate-200 uppercase truncate">${prog.title}</p>
                                        <span class="text-[9px] font-bold text-amber-500 whitespace-nowrap bg-amber-500/10 px-1.5 py-0.5 rounded">${startLabel}</span>
                                    </div>
                                </div>
                            `;
                        });
                        upcomingContainer.innerHTML = html;
                    } else {
                        upcomingContainer.innerHTML = `<p class="text-xs text-slate-500">No upcoming programs found.</p>`;
                    }
                }
            }
            
            if (window.lucide) lucide.createIcons();
        }

        function closeEpgChannelModal() {
            const modal = document.getElementById('epgChannelModal');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        }

        // MATRIX TWO-WAY SCROLL LOCK SYNCS
        let isSyncingSidebar = false;
        let isSyncingTimeline = false;
        let isSyncingHeader = false;

        function syncEpgSidebarScroll(el) {
            if (isSyncingTimeline) {
                isSyncingTimeline = false;
                return;
            }
            isSyncingSidebar = true;
            const body = document.getElementById('epgTimelineBody');
            if (body) body.scrollTop = el.scrollTop;
        }

        function syncEpgTimelineScroll(el) {
            if (isSyncingSidebar) {
                isSyncingSidebar = false;
            } else {
                isSyncingTimeline = true;
                const sidebar = document.getElementById('epgSidebarChannels');
                if (sidebar) sidebar.scrollTop = el.scrollTop;
            }
            
            if (isSyncingHeader) {
                isSyncingHeader = false;
            } else {
                isSyncingTimeline = true;
                const header = document.getElementById('epgTimelineHoursHeader');
                if (header) header.scrollLeft = el.scrollLeft;
            
            const timeIndicator = document.getElementById('epgCurrentTimeIndicator');
            if (timeIndicator) {
                timeIndicator.style.transform = `translateX(-${el.scrollLeft}px)`;
            }
            }
        }

        function syncEpgHeaderScroll(el) {
            if (isSyncingTimeline) {
                isSyncingTimeline = false;
                return;
            }
            isSyncingHeader = true;
            const body = document.getElementById('epgTimelineBody');
            if (body) body.scrollLeft = el.scrollLeft;
            
            const timeIndicator = document.getElementById('epgCurrentTimeIndicator');
            if (timeIndicator) {
                timeIndicator.style.transform = `translateX(-${el.scrollLeft}px)`;
            }
        }

        function filterEpgGrid() {
            const q = document.getElementById('epgSearchInput').value.toLowerCase().trim();
            
            if (q === '') {
                window.epgFilteredChannels = window.epgChannels;
            } else {
                window.epgFilteredChannels = window.epgChannels.filter(chan => {
                    if (chan.name.toLowerCase().includes(q)) return true;
                    
                    const progs = window.epgProgrammesByChannel[chan.id] || [];
                    for (let p of progs) {
                        if (p.title && p.title.toLowerCase().includes(q)) return true;
                    }
                    return false;
                });
            }
            
            const sidebarContainer = document.getElementById('epgSidebarChannels');
            const timelineBody = document.getElementById('epgTimelineBody');
            const channelCountText = document.getElementById('epgChannelCountText');
            
            if (sidebarContainer) sidebarContainer.innerHTML = '';
            if (timelineBody) timelineBody.innerHTML = '';
            if (channelCountText) channelCountText.textContent = window.epgFilteredChannels.length;
            
            window.epgRenderIndex = 0;
            if (window.renderNextEpgChunk) window.renderNextEpgChunk();
        }

        // Lenis Smooth Scroll
        window.lenis = new Lenis({
            autoRaf: true,
        });

        // Run On Start
        window.addEventListener('DOMContentLoaded', () => {
            initApp();
            renderContinueWatchingHistory();
            
            // Fetch EPG silently in background as requested
            setTimeout(() => {
                try {
                    fetchAndParseEpg(true);
                } catch(e) {}
            }, 500);
            
            const urlParams = new URLSearchParams(window.location.search);
            const initialTab = urlParams.get('tab');
            if (initialTab) {
                switchTab(initialTab);
            }
        });
