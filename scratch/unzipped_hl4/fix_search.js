const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /resultsDiv\.innerHTML = '<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Searching Cinema Catalogs\.\.\.<\/div>';[\s\S]*?resultsDiv\.innerHTML = '<div class="text-center py-10 text-red-500 text-xs font-bold uppercase tracking-widest">Search failed<\/div>';\s*\}/;

const replacement = `resultsDiv.innerHTML = '<div class="text-center py-10 text-zinc-500 text-xs font-bold uppercase tracking-widest animate-pulse">Searching Catalogs & EPG...</div>';

            try {
                let htmlOutput = '';
                
                let epgMatches = [];
                if (window.epgChannels && window.epgProgrammesByChannel) {
                    const q = query.toLowerCase();
                    for (const chan of window.epgChannels) {
                        if (chan.name.toLowerCase().includes(q)) {
                            epgMatches.push({ type: 'channel', data: chan, chan: chan });
                        } else {
                            const progs = window.epgProgrammesByChannel[chan.id] || [];
                            const progMatch = progs.find(p => p.title && p.title.toLowerCase().includes(q));
                            if (progMatch) {
                                epgMatches.push({ type: 'program', data: progMatch, chan: chan });
                            }
                        }
                        if (epgMatches.length >= 6) break;
                    }
                }

                if (epgMatches.length > 0) {
                    htmlOutput += '<div class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 px-1">Live TV & Sports Matches</div>';
                    htmlOutput += '<div class="grid grid-cols-1 gap-2 mb-4">';
                    
                    epgMatches.forEach(match => {
                        const isProg = match.type === 'program';
                        const title = isProg ? match.data.title : match.data.name;
                        const subTitle = isProg ? \`On: \${match.chan.name}\` : 'Live Channel';
                        
                        htmlOutput += \`
                        <div class="flex items-center gap-3 p-3 bg-amber-950/20 hover:bg-amber-900/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all transform active:scale-[0.99] group" 
                             onclick="closeSearchPalette(); switchTab('epg'); document.getElementById('epgSearchInput').value = '\${title.replace(/'/g, "\\\\\\'")}'; filterEpgGrid();">
                            <div class="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <img src="\${match.chan.logo}" class="max-w-full max-h-full object-contain" onerror="this.outerHTML='<i data-lucide=\\'tv\\' class=\\'w-5 h-5 text-amber-500\\'></i>'">
                            </div>
                            <div class="min-w-0 flex-grow text-left">
                                <div class="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> \${subTitle}</div>
                                <div class="text-sm font-extrabold text-white truncate mt-0.5" title="\${title}">\${title}</div>
                            </div>
                            <i data-lucide="chevron-right" class="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors shrink-0"></i>
                        </div>\`;
                    });
                    htmlOutput += '</div>';
                }

                const data = await fetchTMDB('search/multi', { query });
                const filtered = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 12);
                
                if (filtered.length > 0) {
                    htmlOutput += '<div class="text-[10px] text-red-500 font-bold uppercase tracking-widest mb-2 px-1 mt-2">Movies & Series</div>';
                    htmlOutput += '<div class="grid grid-cols-1 gap-2">';
                    filtered.forEach(item => {
                        const title = item.title || item.name || "Untitled";
                        const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w185\${item.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=90&h=135&fit=crop';
                        const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                        const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                        const label = item.media_type === 'tv' ? 'Series' : 'Movie';
                        
                        htmlOutput += \`
                            <div class="flex items-center gap-4 p-3 bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 hover:border-red-500/20 rounded-2xl cursor-pointer transition-all transform active:scale-[0.99] group" onclick="closeSearchPalette(); openDetails(\${item.id}, '\${item.media_type}')">
                                <img src="\${poster}" alt="Poster" class="w-12 h-18 rounded-lg object-cover shrink-0 bg-zinc-900 border border-white/5">
                                <div class="min-w-0 text-left flex-grow">
                                    <div class="text-xs font-black text-red-500 uppercase tracking-widest">\${label} &bull; \${year}</div>
                                    <div class="text-sm font-extrabold text-white truncate group-hover:text-red-500 transition-colors mt-0.5" title="\${title.replace(/"/g, '&quot;')}">\${title}</div>
                                    <div class="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1"><i data-lucide="star" class="w-3 h-3 fill-red-500 text-red-500"></i> \${rating} TMDB User Score</div>
                                </div>
                                <i data-lucide="chevron-right" class="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors shrink-0"></i>
                            </div>\`;
                    });
                    htmlOutput += '</div>';
                }

                if (htmlOutput === '') {
                    resultsDiv.innerHTML = '<div class="text-center py-10 text-slate-500 text-xs font-bold uppercase tracking-widest">No matching cinema or live events found</div>';
                } else {
                    resultsDiv.innerHTML = htmlOutput;
                    if (window.lucide) lucide.createIcons();
                }

            } catch(e) {
                console.error(e);
                resultsDiv.innerHTML = '<div class="text-center py-10 text-red-500 text-xs font-bold uppercase tracking-widest">Search failed</div>';
            }`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
