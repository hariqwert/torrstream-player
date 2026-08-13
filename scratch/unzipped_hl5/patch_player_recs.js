const fs = require('fs');
let content = fs.readFileSync('consumet.html', 'utf8');

const regex = /startActualFullscreenPlayback\(\);\s*\}/;
const replacement = `startActualFullscreenPlayback();
    
    // Populate episodes list and recommendations
    populatePlayerEpisodes();
    populatePlayerRecommendations();
}`;

content = content.replace(regex, replacement);

const scriptToAdd = `
async function populatePlayerEpisodes() {
    const item = selectedMedia;
    const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');
    const container = document.getElementById('playerUpNextContainer');
    const list = document.getElementById('playerEpisodesList');
    
    if (type !== 'tv' || !item.id) {
        if (container) container.classList.add('hidden');
        return;
    }
    if (container) container.classList.remove('hidden');
    if (list) list.innerHTML = \`<div class="text-xs text-zinc-400">Loading episodes...</div>\`;
    
    try {
        const s = selectedSeason || 1;
        const res = await fetchTMDB(\`tv/\${item.id}/season/\${s}\`);
        if (res.episodes && res.episodes.length > 0) {
            let html = '';
            res.episodes.forEach(ep => {
                const still = ep.still_path ? \`https://image.tmdb.org/t/p/w300\${ep.still_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=200&fit=crop';
                const isActive = (ep.episode_number == selectedEpisode);
                const borderCls = isActive ? 'border-red-500' : 'border-white/10 hover:border-red-500/40';
                
                html += \`
                <div class="w-48 shrink-0 bg-zinc-900/90 border \${borderCls} p-2 rounded-xl cursor-pointer transition-all group" onclick="selectedEpisode = \${ep.episode_number}; startActualFullscreenPlayback(); populatePlayerEpisodes();">
                    <div class="aspect-video relative rounded-lg overflow-hidden mb-2 bg-black">
                        <img loading="lazy" src="\${still}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                            <button onclick="event.stopPropagation(); selectedEpisode = \${ep.episode_number}; startActualFullscreenPlayback(); populatePlayerEpisodes();" class="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform">
                                <i data-lucide="play" class="w-4 h-4 fill-black"></i>
                            </button>
                        </div>
                        <span class="absolute bottom-1 left-1 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black text-white">EP \${ep.episode_number}</span>
                    </div>
                    <h4 class="text-[10px] font-bold text-white truncate" title="\${ep.name}">\${ep.episode_number}. \${ep.name}</h4>
                </div>\`;
            });
            list.innerHTML = html;
            triggerLucide();
            
            setTimeout(() => {
                const activeEl = list.querySelector('.border-red-500');
                if (activeEl) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            }, 100);
        } else {
            list.innerHTML = \`<div class="text-xs text-zinc-400">No episodes found.</div>\`;
        }
    } catch (e) {
        list.innerHTML = \`<div class="text-xs text-red-400">Failed to load episodes.</div>\`;
    }
}

async function populatePlayerRecommendations() {
    const item = selectedMedia;
    const type = item.media_type || (item.name || item.first_air_date ? 'tv' : 'movie');
    const container = document.getElementById('playerRecommendationsContainer');
    
    if (!item || !item.id) {
        if (container) container.classList.add('hidden');
        return;
    }
    
    if (container) {
        container.classList.remove('hidden');
        container.innerHTML = \`
            <div class="flex items-center gap-2 mb-4">
                <span class="w-1.5 h-4 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/50 animate-pulse"></span>
                <h3 class="text-xs font-black uppercase tracking-widest text-zinc-400">More Like This</h3>
            </div>
            <div id="playerRecsShelf" class="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                <div class="text-xs text-zinc-400">Loading recommendations...</div>
            </div>
        \`;
    }
    
    try {
        const res = await fetchTMDB(\`\${type}/\${item.id}/recommendations\`);
        if (res.results && res.results.length > 0) {
            const shelf = document.getElementById('playerRecsShelf');
            if (shelf) {
                shelf.innerHTML = '';
                res.results.slice(0, 15).forEach(rec => {
                    rec.media_type = type;
                    const card = document.createElement('div');
                    card.className = "w-32 shrink-0 cursor-pointer group";
                    card.onclick = () => {
                        selectedMedia = rec;
                        selectedSeason = 1;
                        selectedEpisode = 1;
                        openFullscreenPlayer();
                    };
                    const poster = rec.poster_path ? \`https://image.tmdb.org/t/p/w300\${rec.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                    card.innerHTML = \`
                        <div class="aspect-[2/3] rounded-xl overflow-hidden mb-2 relative border border-white/10 group-hover:border-indigo-500/50 transition-all">
                            <img loading="lazy" src="\${poster}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <i data-lucide="play-circle" class="w-8 h-8 text-white"></i>
                            </div>
                        </div>
                        <h4 class="text-[10px] font-bold text-white truncate" title="\${rec.title || rec.name}">\${rec.title || rec.name}</h4>
                    \`;
                    shelf.appendChild(card);
                });
                triggerLucide();
            }
        } else {
            document.getElementById('playerRecsShelf').innerHTML = \`<div class="text-xs text-zinc-400">No recommendations found.</div>\`;
        }
    } catch(e) {
        document.getElementById('playerRecsShelf').innerHTML = \`<div class="text-xs text-red-400">Failed to load recommendations.</div>\`;
    }
}
`;

content = content.replace('// FULLSCREEN THEATER PLAYER ENGINE', scriptToAdd + '\n\n// FULLSCREEN THEATER PLAYER ENGINE');

// Fix Anime Top 10 poster_path issue
content = content.replace("if (item.poster_path) poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`;",
"if (item.poster_path) poster = item.poster_path.startsWith('http') ? item.poster_path : `https://image.tmdb.org/t/p/w500${item.poster_path}`;");

fs.writeFileSync('consumet.html', content);
