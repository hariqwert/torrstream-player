const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

html = html.replace("switchHomeLowerCategory('oscar');", "loadHomeNewShelves();");

const shelvesCode = `
        async function loadHomeNewShelves() {
            try {
                // Thalapathy Vijay
                const vijay = await fetchTMDB('discover/movie', { with_cast: '31393', sort_by: 'popularity.desc' });
                renderShelfGrid(vijay.results || [], 'vijayShelf');

                // Intergalactic Sci-Fi & Space Operas
                const scifi = await fetchTMDB('discover/movie', { with_genres: '878', with_keywords: '3386', sort_by: 'popularity.desc' });
                renderShelfGrid(scifi.results || [], 'scifiShelf');

                // K-Drama & Korean Cinema
                const korean = await fetchTMDB('discover/tv', { with_original_language: 'ko', sort_by: 'popularity.desc' });
                renderShelfGrid(korean.results || [], 'koreanShelf', 'tv');

                // Laugh Out Loud Comedies
                const comedy = await fetchTMDB('discover/movie', { with_genres: '35', sort_by: 'popularity.desc' });
                renderShelfGrid(comedy.results || [], 'comedyShelf');

                // Midnight Horror & Thrillers
                const horror = await fetchTMDB('discover/movie', { with_genres: '27,53', sort_by: 'popularity.desc' });
                renderShelfGrid(horror.results || [], 'horrorShelf');

                // Eye-Opening Documentaries
                const docu = await fetchTMDB('discover/movie', { with_genres: '99', sort_by: 'popularity.desc' });
                renderShelfGrid(docu.results || [], 'documentaryShelf');

                // Timeless Classics
                const classic = await fetchTMDB('discover/movie', { 'primary_release_date.lte': '1995-01-01', sort_by: 'vote_average.desc', 'vote_count.gte': 1000 });
                renderShelfGrid(classic.results || [], 'classicShelf');

                // Kids & Family Adventures
                const kids = await fetchTMDB('discover/movie', { with_genres: '10751,16', sort_by: 'popularity.desc' });
                renderShelfGrid(kids.results || [], 'kidsShelf');
                
                // Award-Winning Masterpieces
                const awards = await fetchTMDB('discover/movie', { with_keywords: 'oscar', sort_by: 'vote_average.desc', 'vote_count.gte': 1000 });
                renderShelfGrid(awards.results || [], 'awardShelf');

            } catch(e) { console.error("Error loading new shelves", e); }
        }
`;

html = html.replace("async function switchHomeLowerCategory", shelvesCode + "\n        async function switchHomeLowerCategory");

fs.writeFileSync('consumet.html', html);
