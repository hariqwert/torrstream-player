const fs = require('fs');

let html = fs.readFileSync('consumet.html', 'utf8');

const newScheduleAndShelfCode = `        window.switchAnimeScheduleDay = function(day) {
            loadAnimeSchedule(day);
        }

        async function loadAnimeSchedule(dayFilter = 'today') {
            const shelf = document.getElementById('animeScheduleGrid');
            if (!shelf) return;
            shelf.innerHTML = \`<div class="col-span-full py-12 w-full text-center text-zinc-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400"></i>Syncing Japan Broadcasts...</div>\`;
            if (window.lucide) lucide.createIcons();
            
            document.querySelectorAll('.sched-tab-btn').forEach(btn => {
                btn.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0";
            });
            const activeTab = document.getElementById(\`schedTab-\${dayFilter}\`);
            if (activeTab) {
                activeTab.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0";
            }

            const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            let filterDay = (dayFilter || 'today').toLowerCase();
            if (filterDay === 'today') {
                filterDay = daysMap[new Date().getDay()];
            }

            try {
                const res = await fetch(\`https://api.jikan.moe/v4/schedules?filter=\${filterDay}\`);
                if (res.ok) {
                    const data = await res.json();
                    const rawItems = data.data || [];
                    if (rawItems.length > 0) {
                        const items = rawItems.map(item => ({
                            title: item.title_english || item.title || item.title_japanese || "Anime Broadcast",
                            poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
                            backdrop: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url,
                            time: item.broadcast?.string || item.broadcast?.time || \`\${filterDay.toUpperCase()} AIRING\`,
                            score: item.score ? item.score.toFixed(1) : "8.5",
                            episode: item.episodes || 1,
                            synopsis: item.synopsis || ""
                        }));
                        renderAnimeScheduleGrid(items);
                        return;
                    }
                }
            } catch (e) {
                console.warn("Jikan Schedule fetch failed, trying fallback...", e);
            }

            // Fallback if Jikan fails or is empty
            try {
                const tmdbData = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    sort_by: 'popularity.desc',
                    page: 1
                });
                const items = (tmdbData.results || []).slice(0, 12).map(item => ({
                    title: item.name || item.title || "Anime Show",
                    poster: item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : null,
                    backdrop: item.backdrop_path ? \`https://image.tmdb.org/t/p/w500\${item.backdrop_path}\` : null,
                    time: \`\${filterDay.toUpperCase()} AIRING\`,
                    score: item.vote_average ? item.vote_average.toFixed(1) : "8.5",
                    episode: 1,
                    tmdb_id: item.id
                }));
                renderAnimeScheduleGrid(items);
            } catch(err) {
                shelf.innerHTML = '<div class="col-span-full text-red-500 text-center py-8 font-bold">Failed to load schedule</div>';
            }
        }

        function renderAnimeScheduleGrid(items) {
            const grid = document.getElementById('animeScheduleGrid');
            if (!grid) return;
            grid.innerHTML = '';
            if (!items || items.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">No Broadcasts Scheduled for this Day</div>';
                return;
            }
            
            items.slice(0, 18).forEach(item => {
                const title = item.title || "Untitled Anime";
                const poster = item.poster || item.backdrop || 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&h=450&fit=crop';
                const timeStr = item.time || 'Airing Today';
                const rating = item.score || '8.5';
                const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');

                const card = document.createElement('div');
                card.className = "group relative rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:z-10 bg-zinc-900 border border-white/5 shadow-md hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col justify-between";
                
                card.innerHTML = \`
                    <div class="relative aspect-[16/9] overflow-hidden bg-black">
                        <img src="\${poster}" class="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt="\${safeTitle}">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        
                        <div class="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Simulcast
                        </div>
                        <div class="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-emerald-400 border border-white/10 text-[8px] font-black px-2 py-0.5 rounded shadow-lg truncate max-w-[120px]">
                            \${timeStr}
                        </div>
                        
                        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 p-3 z-20">
                            <p class="text-[10px] font-black text-white text-center uppercase tracking-widest drop-shadow-md line-clamp-1">\${title}</p>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${safeTitle}', 'torrent', \${item.episode || 1})" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
                                <i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Torrent
                            </button>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${safeTitle}', 'player1', \${item.episode || 1})" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-lg">
                                <i data-lucide="play" class="w-3.5 h-3.5"></i> Player 1
                            </button>
                        </div>
                    </div>
                    <div class="p-2.5 bg-zinc-950 flex items-center justify-between gap-2 border-t border-white/5">
                        <h4 class="text-white font-bold text-xs truncate flex-1" title="\${safeTitle}">\${title}</h4>
                        <p class="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 shrink-0"><i data-lucide="star" class="w-3 h-3 fill-amber-400"></i> \${rating}</p>
                    </div>
                \`;
                
                card.onclick = () => searchAndPlayItem(title);
                grid.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }

        function renderAnimeShelf(items, shelfId, typeOverride = null) {
            const shelf = document.getElementById(shelfId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            if (!items || items.length === 0) {
                shelf.innerHTML = '<div class="py-6 text-xs text-zinc-500 font-bold uppercase tracking-widest px-4">No Releases Found</div>';
                return;
            }
            
            items.slice(0, 15).forEach(item => {
                const title = item.title_english || item.title || item.name || "Untitled Anime";
                let poster = item.poster;
                if (!poster && item.images?.jpg?.large_image_url) poster = item.images.jpg.large_image_url;
                if (!poster && item.images?.jpg?.image_url) poster = item.images.jpg.image_url;
                if (!poster && item.poster_path) poster = \`https://image.tmdb.org/t/p/w300\${item.poster_path}\`;
                if (!poster) poster = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300&h=450&fit=crop';
                
                const rating = item.score ? item.score.toFixed(1) : (item.vote_average ? item.vote_average.toFixed(1) : '8.5');
                const year = item.year || (item.first_air_date || item.release_date || '').split('-')[0] || '2024';
                const finalType = typeOverride || (item.first_air_date ? 'tv' : 'movie');
                const safeTitle = title.replace(/'/g, "\\\\'").replace(/"/g, '&quot;');

                const card = document.createElement('div');
                card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-105 hover:border-indigo-400/50 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10";
                
                if (item.poster_path && item.id && typeof item.id === 'number') {
                    card.onclick = () => openDetails(item.id, finalType);
                } else {
                    card.onclick = () => searchAndPlayItem(title);
                }
                
                card.innerHTML = \`
                    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-950">
                        <img src="\${poster}" alt="\${safeTitle}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                <i data-lucide="play" class="w-5 h-5 fill-white ml-0.5"></i>
                            </div>
                        </div>
                        <div class="absolute top-2.5 left-2.5 bg-indigo-600/80 backdrop-blur-md text-white px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-indigo-400/30 flex items-center gap-1 shadow-md">
                            <i data-lucide="sparkles" class="w-2.5 h-2.5 fill-white text-white"></i> Anime
                        </div>
                        <div class="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white border border-white/15 flex items-center gap-1 shadow-md">
                            <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400 text-emerald-400"></i> \${rating}
                        </div>
                    </div>
                    <div class="p-3.5 bg-zinc-950/90 flex-grow flex flex-col justify-between border-t border-white/5">
                        <h3 class="text-xs sm:text-sm font-bold text-white truncate tracking-tight" title="\${safeTitle}">\${title}</h3>
                        <div class="flex items-center justify-between text-[9px] font-medium text-zinc-400 uppercase tracking-wider mt-1.5">
                            <span>\${year}</span>
                            <span class="text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-400/30">\${finalType === 'movie' ? 'Movie' : 'Series'}</span>
                        </div>
                    </div>
                \`;
                shelf.appendChild(card);
            });
            if (window.lucide) lucide.createIcons();
        }`;

// Replace window.switchAnimeScheduleDay through renderAnimeShelf
const targetPattern = /window\.switchAnimeScheduleDay = function\(day\) \{[\s\S]*?function renderAnimeShelf\(items, shelfId, typeOverride = null\) \{[\s\S]*?lucide\.createIcons\(\);\s*\}/;

if (targetPattern.test(html)) {
    html = html.replace(targetPattern, newScheduleAndShelfCode);
    fs.writeFileSync('consumet.html', html);
    console.log("Successfully replaced schedule and shelf code!");
} else {
    console.error("Target pattern for schedule and shelf code NOT found!");
}
