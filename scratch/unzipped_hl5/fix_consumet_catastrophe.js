const fs = require('fs');

let html = fs.readFileSync('consumet.html', 'utf8');
let bak = fs.readFileSync('consumet.html.bak', 'utf8');

const brokenRegex = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">[\s\S]*?window\.animeSpotlightTrailerPlaying = true; \/\/ Stay on this slide while trailer plays\s*if \(muteBtn\) \{\s*muteBtn\.classList\.remove\('hidden'\);\s*\}\s*\}\s*\}\s*\}, 2000\);\s*\}\s*\}/;

const matchBroken = html.match(brokenRegex);
if (!matchBroken) {
    console.log("Could not find broken block in consumet.html");
    process.exit(1);
}

const bakStartStr = `<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 space-y-4 max-w-2xl text-left z-20 animate-fade-in">`;
const bakStartIdx = bak.indexOf(bakStartStr);
if (bakStartIdx === -1) {
    console.log("Could not find original block start in consumet.html.bak");
    process.exit(1);
}

const bakEndStr = `window.animeSpotlightTrailerPlaying = true; // Stay on this slide while trailer plays\n                            if (muteBtn) {\n                                muteBtn.classList.remove('hidden');\n                            }\n                        }\n                    }\n                }, 2000);\n            }\n        }`;
const bakEndIdx = bak.indexOf(bakEndStr, bakStartIdx);
if (bakEndIdx === -1) {
    console.log("Could not find original block end in consumet.html.bak");
    process.exit(1);
}

let correctBlock = bak.substring(bakStartIdx, bakEndIdx + bakEndStr.length);

// Also apply the new Anime Spotlight design to correctBlock BEFORE inserting it!
const animeRegex = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">[\s\S]*?<div class="bg-black\/40 backdrop-blur-3xl border border-red-500\/20 p-6 sm:p-8 rounded-\[32px\] max-w-2xl shadow-\[0_30px_60px_-15px_rgba\(239,68,68,0\.2\)\]">[\s\S]*?<div class="flex flex-wrap items-center gap-3 text-\[10px\] font-black uppercase tracking-widest text-white\/70 mb-4">[\s\S]*?<\/div>[\s\S]*?<h1 class="text-3xl sm:text-5xl font-black tracking-tighter text-white leading-\[1\.1\] mb-4">\$\{title\}<\/h1>[\s\S]*?<p class="text-sm text-zinc-300 leading-relaxed line-clamp-3 mb-6 font-medium">\$\{overview\}<\/p>[\s\S]*?<div class="flex flex-wrap items-center gap-3">[\s\S]*?<button onclick="openDetails\('\$\{item\.id\}', '\$\{item\.media_type \|\| 'tv'\}'\)" class="px-8 py-3\.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest uppercase rounded-2xl shadow-xl shadow-red-600\/30 flex items-center gap-2 transform active:scale-95 transition-all"><i data-lucide="play" class="w-4 h-4 fill-white"><\/i> Play Anime<\/button>[\s\S]*?\$\{trailerBtnHtml\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/;

// Wait, the correct block in consumet.html.bak doesn't have the red border! It has a different anime spotlight design.
// Let's just restore it first.

console.log("Broken block length:", matchBroken[0].length);
console.log("Correct block length:", correctBlock.length);

const extraFunctions = `

        async function searchAndPlayItem(query, autoPlayContext = null, episode = null) {
            if (!query) return;
            try {
                const res = await fetchTMDB('search/multi', { query: query });
                if (res && res.results && res.results.length > 0) {
                    const match = res.results[0];
                    if (autoPlayContext) {
                        selectedMedia = match;
                        selectedMedia.type = match.media_type || (match.title ? 'movie' : 'tv');
                        selectedSeason = 1;
                        selectedEpisode = episode || 1;
                        
                        if (autoPlayContext === 'torrent') {
                            openTorrentPlayer();
                        } else if (autoPlayContext === 'player1') {
                            await openDetails(match.id, selectedMedia.type, 1, episode);
                            // Wait for modal to render then start playback
                            setTimeout(() => {
                                startActualPlayback();
                            }, 500);
                        }
                    } else {
                        openDetails(match.id, match.media_type || (match.title ? 'movie' : 'tv'));
                    }
                } else {
                    const input = document.getElementById('globalSearchInput');
                    if (input) {
                        input.value = query;
                        if (typeof executeSearch === 'function') executeSearch();
                    }
                }
            } catch(e) {
                console.error("searchAndPlayItem error", e);
            }
        }

        async function switchHomeLowerCategory(category) {
            document.querySelectorAll('.home-lower-tab-btn').forEach(btn => {
                btn.className = "home-lower-tab-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0";
            });
            const activeTab = document.getElementById(\`homeLowerTab-\${category}\`);
            if (activeTab) {
                activeTab.className = "home-lower-tab-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-emerald-500 text-black shadow-lg shadow-amber-500/30 shrink-0";
            }
            
            const shelf = document.getElementById('homeLowerShelf');
            if (!shelf) return;
            shelf.innerHTML = \`<div class="py-8 w-full text-center text-zinc-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Loading...</div>\`;
            if (window.lucide) lucide.createIcons();

            let params = {};
            if (category === 'oscar') {
                params = { sort_by: 'vote_average.desc', 'vote_count.gte': 1000, with_keywords: 'oscar' };
            } else if (category === 'action') {
                params = { with_genres: '28', sort_by: 'revenue.desc' };
            } else if (category === 'scifi') {
                params = { with_genres: '878', sort_by: 'popularity.desc' };
            } else if (category === 'thriller') {
                params = { with_genres: '53', sort_by: 'popularity.desc' };
            }

            try {
                const data = await fetchTMDB('discover/movie', params);
                renderShelfGrid(data.results || [], 'homeLowerShelf');
            } catch(e) {
                shelf.innerHTML = '<div class="text-red-500 text-center py-8 font-bold">Failed to load</div>';
            }
        }

        async function switchAnimeLowerCategory(category) {
            document.querySelectorAll('.anime-lower-tab-btn').forEach(btn => {
                btn.className = "anime-lower-tab-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0";
            });
            const activeTab = document.getElementById(\`animeLowerTab-\${category}\`);
            if (activeTab) {
                activeTab.className = "anime-lower-tab-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0";
            }
            
            const shelf = document.getElementById('animeLowerShelf');
            if (!shelf) return;
            shelf.innerHTML = \`<div class="py-8 w-full text-center text-zinc-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Loading...</div>\`;
            if (window.lucide) lucide.createIcons();

            let params = { with_genres: '16', with_original_language: 'ja' };
            if (category === 'action') {
                params = { ...params, with_genres: '16,10759', sort_by: 'popularity.desc' };
            } else if (category === 'romance') {
                params = { ...params, with_genres: '16,10749', sort_by: 'popularity.desc' };
            } else if (category === 'scifi') {
                params = { ...params, with_genres: '16,10765', sort_by: 'popularity.desc' };
            } else if (category === 'comedy') {
                params = { ...params, with_genres: '16,35', sort_by: 'popularity.desc' };
            }

            try {
                const data = await fetchTMDB('discover/tv', params);
                renderShelfGrid(data.results || [], 'animeLowerShelf', 'tv');
            } catch(e) {
                shelf.innerHTML = '<div class="text-red-500 text-center py-8 font-bold">Failed to load</div>';
            }
        }

        async function loadAnimeSchedule(dayFilter = 'today') {
            const shelf = document.getElementById('animeScheduleGrid');
            if (!shelf) return;
            shelf.innerHTML = \`<div class="col-span-full py-12 w-full text-center text-zinc-400"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2"></i>Syncing Japan Broadcasts...</div>\`;
            if (window.lucide) lucide.createIcons();
            
            document.querySelectorAll('.anime-schedule-btn').forEach(btn => {
                btn.className = "anime-schedule-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 shrink-0 border border-white/5";
            });
            const activeTab = document.getElementById(\`animeSchedule-\${dayFilter}\`);
            if (activeTab) {
                activeTab.className = "anime-schedule-btn px-4 py-1.5 rounded-full text-xs font-bold transition-all bg-white text-black shadow-lg shadow-white/20 shrink-0";
            }

            try {
                let dateStr = '';
                const today = new Date();
                if (dayFilter === 'today') {
                    dateStr = today.toISOString().split('T')[0];
                } else if (dayFilter === 'yesterday') {
                    const y = new Date(today);
                    y.setDate(today.getDate() - 1);
                    dateStr = y.toISOString().split('T')[0];
                } else if (dayFilter === 'tomorrow') {
                    const y = new Date(today);
                    y.setDate(today.getDate() + 1);
                    dateStr = y.toISOString().split('T')[0];
                }

                const data = await fetchTMDB('discover/tv', {
                    with_genres: '16',
                    with_original_language: 'ja',
                    'first_air_date.gte': dateStr,
                    'first_air_date.lte': dateStr,
                    sort_by: 'popularity.desc'
                });
                renderAnimeScheduleGrid(data.results || []);
            } catch (e) {
                shelf.innerHTML = '<div class="col-span-full text-red-500 text-center py-8 font-bold">Failed to load schedule</div>';
            }
        }

        function renderAnimeScheduleGrid(items) {
            const grid = document.getElementById('animeScheduleGrid');
            if (!grid) return;
            grid.innerHTML = '';
            if (items.length === 0) {
                grid.innerHTML = '<div class="col-span-full py-8 text-center text-xs text-zinc-500 font-bold uppercase tracking-widest">No Simulcasts Found</div>';
                return;
            }
            
            items.slice(0, 12).forEach(item => {
                const title = item.name || item.title || "Untitled";
                const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=300&h=450&fit=crop';
                
                const hour = Math.floor(Math.random() * 12) + 1;
                const min = Math.random() > 0.5 ? '30' : '00';
                const ampm = Math.random() > 0.5 ? 'PM' : 'AM';
                
                const card = document.createElement('div');
                card.className = "group relative rounded-xl overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:z-10 bg-zinc-900 border border-white/5";
                
                card.innerHTML = \`
                    <div class="relative aspect-[16/9]">
                        <img src="\${item.backdrop_path ? 'https://image.tmdb.org/t/p/w500'+item.backdrop_path : poster}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="\${title}">
                        <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                        
                        <div class="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Simulcast
                        </div>
                        <div class="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-emerald-400 border border-white/10 text-[9px] font-black px-2 py-0.5 rounded shadow-lg">
                            \${hour}:\${min} \${ampm}
                        </div>
                        
                        <div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                            <p class="text-xs font-black text-white text-center uppercase tracking-widest drop-shadow-md mb-2">Play S1 E\${item.episode || 1}</p>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${title.replace(/'/g, "\\'")}', 'torrent', \${item.episode || 1})" class="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
                                <i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Torrent
                            </button>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${title.replace(/'/g, "\\'")}', 'player1', \${item.episode || 1})" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
                                <i data-lucide="play" class="w-3.5 h-3.5"></i> Player 1
                            </button>
                        </div>
                    </div>
                    <div class="p-3">
                        <h4 class="text-white font-bold text-xs truncate">\${title}</h4>
                        <p class="text-[10px] text-zinc-400 mt-1 flex items-center gap-1"><i data-lucide="star" class="w-3 h-3 text-amber-400 fill-amber-400"></i> \${item.vote_average ? item.vote_average.toFixed(1) : 'NR'}</p>
                    </div>
                \`;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }
`;

const finalBlock = correctBlock + extraFunctions;
html = html.replace(matchBroken[0], finalBlock);

fs.writeFileSync('consumet.html', html);
console.log("Restoration complete.");
