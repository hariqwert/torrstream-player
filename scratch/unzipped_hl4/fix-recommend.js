const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /grid\.appendChild\(card\);\n            }\);\n\n            lucide\.createIcons\(\);\n        }/;

const replacement = `grid.appendChild(card);
            });

            // Load Recommendations based on history
            const recShelf = document.getElementById('recommendedShelf');
            if (list.length > 0) {
                const latest = list[0];
                recShelf.classList.remove('hidden');
                
                // Fetch recommendations for the latest watched item
                fetchTMDB(\`\${latest.media_type}/\${latest.id}/recommendations\`).then(data => {
                    if (data && data.results && data.results.length > 0) {
                        const recGrid = document.getElementById('recommendedGrid');
                        recGrid.innerHTML = '';
                        data.results.slice(0, 15).forEach(item => {
                            const title = item.title || item.name;
                            const fallback = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                            const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : fallback;
                            const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                            const year = (item.release_date || item.first_air_date || '').split('-')[0] || '';
                            const isTv = !!item.name;

                            const rCard = document.createElement('div');
                            rCard.className = "w-36 sm:w-44 shrink-0 bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group";
                            rCard.onclick = () => openDetails(item.id, isTv ? 'tv' : 'movie');
                            rCard.innerHTML = \`
                                <div class="relative aspect-[2/3] overflow-hidden bg-zinc-900">
                                    <img src="\${poster}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                                    <div class="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md text-amber-400 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
                                        <i data-lucide="star" class="w-2.5 h-2.5 fill-amber-400"></i> \${rating}
                                    </div>
                                    <div class="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                                        \${year}
                                    </div>
                                </div>
                                <div class="p-3 bg-zinc-950 flex-grow">
                                    <h3 class="text-xs font-extrabold text-white truncate" title="\${title}">\${title}</h3>
                                    <p class="text-[9px] text-zinc-500 mt-1 uppercase tracking-widest font-semibold">\${isTv ? 'TV Series' : 'Movie'}</p>
                                </div>
                            \`;
                            recGrid.appendChild(rCard);
                        });
                        if (window.lucide) lucide.createIcons();
                    } else {
                        recShelf.classList.add('hidden');
                    }
                }).catch(err => {
                    console.error('Failed to load recommendations', err);
                    recShelf.classList.add('hidden');
                });
            } else {
                recShelf.classList.add('hidden');
            }

            if (window.lucide) lucide.createIcons();
        }`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html);
