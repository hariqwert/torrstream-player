const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

// 1. Update consumet.html
let consumetHtml = fs.readFileSync(path.join(rootDir, 'consumet.html'), 'utf8');

// Replace logo image src
consumetHtml = consumetHtml.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
consumetHtml = consumetHtml.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');

// Ensure loadAnimeCatalog has robust TMDB fallback if AniList GraphQL fails
const animeFnSearch = `async function loadAnimeCatalog() {`;
const robustAnimeCatalogFn = `async function loadAnimeCatalog() {
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
            // Robust TMDB Anime Fallback
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
    } catch(e) {}
}`;

// Replace function body
const startIdx = consumetHtml.indexOf(animeFnSearch);
if (startIdx !== -1) {
    const endIdx = consumetHtml.indexOf('function renderAnimeShelf', startIdx);
    if (endIdx !== -1) {
        consumetHtml = consumetHtml.substring(0, startIdx) + robustAnimeCatalogFn + '\n\n' + consumetHtml.substring(endIdx);
    }
}

fs.writeFileSync(path.join(rootDir, 'consumet.html'), consumetHtml, 'utf8');
console.log('Updated consumet.html with hosted logo and robust anime fallback');

// 2. Update hero.html logo
let heroHtml = fs.readFileSync(path.join(rootDir, 'hero.html'), 'utf8');
heroHtml = heroHtml.replace(/src="\/stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
heroHtml = heroHtml.replace(/src="stalker_pro_infinity\.svg"/g, 'src="/stalker_pro_logo.png"');
fs.writeFileSync(path.join(rootDir, 'hero.html'), heroHtml, 'utf8');
console.log('Updated hero.html with hosted logo');

// 3. Update index.html logo
let indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
if (indexHtml.includes('<div class="brand">')) {
    indexHtml = indexHtml.replace('<div class="brand">', `<div class="brand">\n        <img src="/stalker_pro_logo.png" alt="Stalker Pro" class="h-8 sm:h-9 w-auto object-contain mr-2" />`);
}
fs.writeFileSync(path.join(rootDir, 'index.html'), indexHtml, 'utf8');
console.log('Updated index.html with hosted logo');
