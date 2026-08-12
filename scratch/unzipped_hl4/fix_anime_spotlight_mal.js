const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const fetchJikan = `
        async function fetchJikanSpotlight() {
            try {
                // Fetch current season top anime from Jikan (MyAnimeList)
                const res = await fetch('https://api.jikan.moe/v4/seasons/now?limit=7');
                const data = await res.json();
                
                let tmdbResults = [];
                // Map MAL anime to TMDB by title search
                for(const anime of data.data) {
                    const title = anime.title_english || anime.title;
                    const tmdbRes = await fetchTMDB('search/tv', { query: title });
                    if(tmdbRes && tmdbRes.results && tmdbRes.results.length > 0) {
                        const match = tmdbRes.results[0];
                        // Enhance TMDB match with MAL data (better rating, genres)
                        match.mal_score = anime.score;
                        match.mal_synopsis = anime.synopsis;
                        tmdbResults.push(match);
                    }
                    if(tmdbResults.length >= 5) break;
                    // respect rate limit for Jikan/TMDB
                    await new Promise(r => setTimeout(r, 200)); 
                }
                
                if(tmdbResults.length > 0) {
                    return tmdbResults;
                }
                throw new Error("No TMDB matches for Jikan");
            } catch(e) {
                console.warn("Jikan fetch failed, falling back to TMDB", e);
                // Fallback to TMDB trending
                const data = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                return data.results.slice(0, 5);
            }
        }
`;

const regex = /\/\/ 1\. Trending Anime & Spotlight\s*fetchTMDB\('discover\/tv', \{[\s\S]*?renderAnimeSpotlight\(trending\.slice\(0, 5\)\);\s*renderAnimeShelf\(trending, 'animeTrendingShelf'\);\s*\}\)\.catch\(e => console\.error\(e\)\);/;

const replacement = `// 1. Trending Anime & Spotlight
                fetchJikanSpotlight().then(spotlights => {
                    renderAnimeSpotlight(spotlights);
                    renderAnimeShelf(spotlights, 'animeTrendingShelf');
                }).catch(e => console.error(e));`;

if (html.includes('fetchJikanSpotlight')) {
   console.log('already has it');
} else {
   html = html.replace('async function loadAnimeHomeData() {', fetchJikan + '\n        async function loadAnimeHomeData() {');
   html = html.replace(regex, replacement);
   fs.writeFileSync('consumet.html', html);
}

