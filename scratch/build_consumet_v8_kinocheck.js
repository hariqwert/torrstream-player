const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Updated Official Video Trailer Provider Engine with KinoCheck API
const updatedTrailerEngine = `
// Official Multi-Provider Trailer Engine (KinoCheck API + TMDB Videos API)
async function fetchOfficialTrailerKey(id, type = 'movie', imdbId = null) {
    if (!id) return null;

    // 1. PRIMARY PROVIDER: KinoCheck API (api.kinocheck.com)
    try {
        const endpoint = (type === 'tv' || type === 'series') ? 'shows' : 'movies';
        let kcUrl = \`https://api.kinocheck.com/\${endpoint}?tmdb_id=\${id}&language=en\`;
        if (imdbId) kcUrl += \`&imdb_id=\${imdbId}\`;

        const kcRes = await fetch(kcUrl);
        if (kcRes.ok) {
            const kcData = await kcRes.json();
            const youtubeId = kcData.trailer?.youtube_video_id 
                || (kcData.videos && kcData.videos[0] && kcData.videos[0].youtube_video_id)
                || (kcData.youtube_video_id);
            if (youtubeId) {
                return youtubeId;
            }
        }
    } catch (e) {
        console.warn('[KinoCheck API] Error:', e);
    }

    // 2. SECONDARY PROVIDER: TMDB Videos API (api.themoviedb.org)
    try {
        const data = await fetchTMDB(\`\${type}/\${id}/videos\`);
        if (data && data.results && data.results.length > 0) {
            const trailer = data.results.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube') || data.results[0];
            if (trailer && trailer.key) return trailer.key;
        }
    } catch(e) {}

    return null;
}
`;

// Replace fetchOfficialTrailerKey definition
const origTrailerStart = html.indexOf('// Official Video Trailer Provider API Engine');
const origTrailerEnd = html.indexOf('let currentSpotlightTrailerKey = null;', origTrailerStart);

if (origTrailerStart !== -1 && origTrailerEnd !== -1) {
    html = html.substring(0, origTrailerStart) + updatedTrailerEngine + '\n\n' + html.substring(origTrailerEnd);
    console.log('Successfully replaced fetchOfficialTrailerKey with KinoCheck API integration!');
} else {
    // Try finding direct function definition
    const fnStart = html.indexOf('async function fetchOfficialTrailerKey(');
    if (fnStart !== -1) {
        const fnEnd = html.indexOf('let currentSpotlightTrailerKey = null;', fnStart);
        if (fnEnd !== -1) {
            html = html.substring(0, fnStart) + updatedTrailerEngine + '\n\n' + html.substring(fnEnd);
            console.log('Successfully replaced fetchOfficialTrailerKey (fn boundary)');
        }
    }
}

// Update updateSpotlightBackgroundTrailer to pass imdbId if available
const origSpotlightTrailerStart = html.indexOf('async function updateSpotlightBackgroundTrailer(');
if (origSpotlightTrailerStart !== -1) {
    const updatedSpotlightTrailerFn = `
async function updateSpotlightBackgroundTrailer(containerId, item, type = 'movie') {
    const container = document.getElementById(containerId);
    if (!container || !item) return;

    const imdbId = item.imdb_id || item.external_ids?.imdb_id || null;
    const trailerKey = await fetchOfficialTrailerKey(item.id, type, imdbId);
    const bgVideoEl = container.querySelector('.spotlight-bg-trailer');
    
    if (trailerKey) {
        currentSpotlightTrailerKey = trailerKey;
        if (!bgVideoEl) {
            const iframe = document.createElement('iframe');
            iframe.className = "spotlight-bg-trailer absolute inset-0 w-full h-[150%] -translate-y-[15%] scale-110 pointer-events-none opacity-0 transition-opacity duration-1000 z-0";
            iframe.src = \`https://www.youtube-nocookie.com/embed/\${trailerKey}?autoplay=1&mute=1&controls=0&loop=1&playlist=\${trailerKey}&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&vq=medium\`;
            iframe.frameBorder = "0";
            iframe.allow = "autoplay; encrypted-media";
            
            const firstChild = container.firstElementChild;
            if (firstChild) container.insertBefore(iframe, firstChild);
            else container.appendChild(iframe);

            setTimeout(() => {
                iframe.classList.remove('opacity-0');
                iframe.classList.add('opacity-40');
            }, 1000);
        }
    }
}
`;
    const nextFnStart = html.indexOf('function renderSpotlightSlider(', origSpotlightTrailerStart);
    if (nextFnStart !== -1) {
        html = html.substring(0, origSpotlightTrailerStart) + updatedSpotlightTrailerFn + '\n\n' + html.substring(nextFnStart);
        console.log('Successfully updated updateSpotlightBackgroundTrailer with KinoCheck API parameters');
    }
}

// Update openDetails to resolve KinoCheck trailer if TMDB trailer is missing
const openDetailsTrailerStart = html.indexOf('const trailerKey = data.videos?.results?.find(');
if (openDetailsTrailerStart !== -1) {
    const updatedOpenDetailsTrailer = `
    const imdbId = data.external_ids?.imdb_id || null;
    let trailerKey = data.videos?.results?.find(v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube')?.key;
    if (!trailerKey) {
        trailerKey = await fetchOfficialTrailerKey(data.id, type, imdbId);
    }
`;
    const openDetailsTrailerEnd = html.indexOf('const iframe = document.getElementById(\'trailerBgIframe\');', openDetailsTrailerStart);
    if (openDetailsTrailerEnd !== -1) {
        html = html.substring(0, openDetailsTrailerStart) + updatedOpenDetailsTrailer + html.substring(openDetailsTrailerEnd);
        console.log('Successfully updated openDetails trailer resolution to use KinoCheck API');
    }
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html v8 with KinoCheck API integration!');
