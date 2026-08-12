const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const oldFunc = /function renderShelfGrid\(items, elementId, defaultType = 'movie'\) \{[\s\S]*?<\/div>\n                    <\/div>\n                \`;\n                shelf\.appendChild\(card\);\n            \}\);\n        \}/;

const newFunc = `function renderShelfGrid(items, elementId, defaultType = 'movie', tall = false) {
            const shelf = document.getElementById(elementId);
            if (!shelf) return;
            shelf.innerHTML = '';
            
            items.forEach(item => {
                const title = item.title || item.name || "Untitled";
                const poster = item.poster_path ? \`https://image.tmdb.org/t/p/w300\${item.poster_path}\` : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=300&h=450&fit=crop';
                const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
                const year = (item.release_date || item.first_air_date || '').split('-')[0] || '2024';
                const type = item.media_type || defaultType;

                const aspectClass = tall ? 'aspect-[9/16]' : 'aspect-[2/3]';

                const card = document.createElement('div');
                card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-105 hover:border-white/30 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-white/10";
                card.onclick = () => openDetails(item.id, type);
                
                card.innerHTML = \`
                    <div class="relative \${aspectClass} overflow-hidden bg-zinc-950">
                        <img src="\${poster}" alt="\${title}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500">
                        <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <div class="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                <i data-lucide="play" class="w-5 h-5 fill-black ml-0.5"></i>
                            </div>
                        </div>
                        <div class="absolute top-2 right-2 bg-black/70 backdrop-blur-md px-2 py-1 rounded-full text-[10px] font-bold text-white border border-white/10 flex items-center gap-1 shadow-lg">
                            <i data-lucide="star" class="w-3 h-3 fill-amber-400 text-amber-400"></i> \${rating}
                        </div>
                        <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <p class="text-xs font-black uppercase tracking-wider text-white truncate drop-shadow-md">\${title}</p>
                            <p class="text-[10px] text-zinc-300 font-medium tracking-wide mt-0.5">\${year} • \${type === 'tv' ? 'Series' : 'Movie'}</p>
                        </div>
                    </div>
                \`;
                shelf.appendChild(card);
            });
        }`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('consumet.html', html);
