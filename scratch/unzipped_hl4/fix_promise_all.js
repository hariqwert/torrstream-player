const fs = require('fs');

let code = fs.readFileSync('consumet.html', 'utf8');

code = code.replace(
    /Promise\.all\(\[\s*loadHomeSpotlight\(\),\s*loadTrendingMovies\(\),\s*loadPopularSeries\(\),\s*loadTopRatedMasterpieces\(\),\s*loadAsianDramaAndAnime\(\),\s*loadSportsChannels\(\),\s*loadAnimeCatalog\(\)\s*\]\)\.then\(\(\) => \{\s*lucide\.createIcons\(\);\s*\}\);/g,
    `// Load in a cascading manner to prevent TMDB API rate-limiting
            loadHomeSpotlight().then(() => {
                setTimeout(() => loadTrendingMovies(), 200);
                setTimeout(() => loadPopularSeries(), 400);
                setTimeout(() => loadTopRatedMasterpieces(), 600);
                setTimeout(() => loadAsianDramaAndAnime(), 800);
                setTimeout(() => loadSportsChannels(), 1000);
                setTimeout(() => {
                    loadAnimeCatalog().then(() => lucide.createIcons());
                }, 1200);
            });`
);

fs.writeFileSync('consumet.html', code);
