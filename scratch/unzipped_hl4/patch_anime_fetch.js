const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /\/\/ Fetch New Anime Content for Spotlight[\s\S]*?const newSpotlight = newAnimeData\.results \|\| \[\];/;

const newFetch = `// Fetch New Anime Content for Spotlight (Released this week)
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 14); // up to 14 days to be safe
                const dateStr = lastWeek.toISOString().split('T')[0];

                const newAnimeData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'first_air_date.gte': dateStr,
                    sort_by: 'popularity.desc',
                    page: 1
                });
                const newSpotlight = newAnimeData.results || [];`;

html = html.replace(regex, newFetch);
fs.writeFileSync('consumet.html', html);
