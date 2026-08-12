const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /async function loadAnimeHomeData\(\) \{[\s\S]*?catch \(e\) \{\s*console\.error\("Anime Home fetch failed", e\);\s*\}\s*\}/;

const newFunc = `async function loadAnimeHomeData() {
            try {
                // Render Timelines immediately
                if (typeof renderTimelines === 'function') {
                    if (typeof animeTimelines !== 'undefined') renderTimelines('animeTimelinesContainer', animeTimelines);
                    if (typeof homeTimelines !== 'undefined') renderTimelines('homeTimelinesContainer', homeTimelines);
                }

                // Fire fetches concurrently without awaiting each one sequentially
                // 1. Trending Anime & Spotlight
                fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    const trending = data.results || [];
                    renderAnimeSpotlight(trending.slice(0, 5));
                    renderAnimeShelf(trending, 'animeTrendingShelf');
                }).catch(e => console.error(e));
                
                // 2. Shonen / Action Anime
                fetchTMDB('discover/tv', {
                    with_genres: '16,10759',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeShonenShelf');
                }).catch(e => console.error(e));
                
                // 3. Top Rated Anime Masterpieces
                fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 150,
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeTopRatedShelf');
                }).catch(e => console.error(e));

                // 4. Sci-Fi & Cyberpunk Mecha Anime
                fetchTMDB('discover/tv', {
                    with_genres: '16,10765',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeSciFiShelf');
                }).catch(e => console.error(e));

                // 5. Slice of Life & Comedy Anime
                fetchTMDB('discover/tv', {
                    with_genres: '16,35',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeComedyShelf');
                }).catch(e => console.error(e));

                // 6. Legendary Anime Movies
                fetchTMDB('discover/movie', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'vote_average.desc',
                    'vote_count.gte': 200,
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeMoviesShelf', 'movie');
                }).catch(e => console.error(e));

                // 7. Dark Fantasy & Supernatural Anime
                fetchTMDB('discover/tv', {
                    with_keywords: 'supernatural|dark fantasy|magic',
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeDarkFantasyShelf');
                }).catch(e => console.error(e));

                // 8. Romance
                fetchTMDB('discover/tv', {
                    with_genres: '16,10749',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeRomanceShelf');
                }).catch(e => console.error(e));

                // 9. Retro 90s Anime
                fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'first_air_date.lte': '1999-12-31',
                    'first_air_date.gte': '1989-01-01',
                    sort_by: 'popularity.desc',
                    page: 1
                }).then(data => {
                    renderAnimeShelf(data.results || [], 'animeRetroShelf');
                }).catch(e => console.error(e));

            } catch (e) {
                console.error("Anime Home fetch failed", e);
            }
        }`;

html = html.replace(regex, newFunc);
fs.writeFileSync('consumet.html', html);
