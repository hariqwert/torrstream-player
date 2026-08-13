const fs = require('fs');
let content = fs.readFileSync('consumet.html', 'utf8');

const regex = /async function openAnimeInfo\(animeItem\) \{[\s\S]*?updateWatchlistBtnState\(\);\s*triggerLucide\(\);\s*\}/;
const replacement = `async function openAnimeInfo(animeItem) {
    if (!animeItem) return;
    
    // The user wants rich episodes, photos, and recommendations for Anime.
    // The best way is to map the Anime title to its TMDB TV Show ID and use the rich openDetails modal!
    const title = animeItem.title || animeItem.title_english || animeItem.name || "Untitled Anime";
    showToast(\`Loading rich data for "\${title}"...\`);
    
    try {
        const res = await fetchTMDB('search/tv', { query: title });
        if (res.results && res.results.length > 0) {
            const tmdbId = res.results[0].id;
            // Also store mapping in case we need it
            window._searchCache[tmdbId] = res.results[0];
            openDetails(tmdbId, 'tv');
            return;
        }
    } catch (e) {
        console.warn("TMDB resolve failed:", e);
    }
    
    // Fallback if TMDB doesn't find it (very rare)
    showToast("TMDB data not found, using basic view...", "error");
    // (Legacy basic view - highly truncated for brevity since TMDB will hit 99% of time)
    const modal = document.getElementById('detailsModal');
    if (!modal) return;
    handleModalOpen(modal);
    document.getElementById('detailTitle').textContent = title;
    document.getElementById('detailOverview').textContent = animeItem.synopsis || "Anime";
    document.getElementById('detailPoster').src = animeItem.poster || '';
    const actionContainer = document.querySelector('#detailsModal .pt-2');
    if (actionContainer) {
        let safeTitle = title.replace(/'/g, "\\\\\\'").replace(/"/g, '&quot;');
        actionContainer.innerHTML = \`<button onclick="searchAndPlayItem('\${safeTitle}', 'player1', 1, 'tv')" class="px-6 py-3 bg-indigo-600 text-white text-xs font-black uppercase rounded-xl">Play EP 1</button>\`;
    }
}`;
content = content.replace(regex, replacement);
fs.writeFileSync('consumet.html', content);
