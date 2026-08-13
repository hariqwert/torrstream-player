const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regexSchedule = /card\.onclick = async \(\) => \{[\s\S]*?searchAndPlayItem\(title\);\s*\};/g;

html = html.replace(regexSchedule, `// onclick handled by buttons`);

const regexCardHtml = /<div class="absolute inset-0 bg-black\/40 backdrop-blur-\[2px\] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">[\s\S]*?<\/div>\n                        <\/div>/;

const newCardHtml = `<div class="absolute inset-0 bg-black/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                            <p class="text-xs font-black text-white text-center uppercase tracking-widest drop-shadow-md mb-2">Play S1 E\${item.episode}</p>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${title.replace(/'/g, "\\'")}', 'torrent', \${item.episode})" class="w-full bg-indigo-500 hover:bg-indigo-400 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
                                <i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Torrent
                            </button>
                            <button onclick="event.stopPropagation(); searchAndPlayItem('\${title.replace(/'/g, "\\'")}', 'player1', \${item.episode})" class="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:-translate-y-0.5">
                                <i data-lucide="play" class="w-3.5 h-3.5"></i> Player 1
                            </button>
                        </div>
                        </div>`;

html = html.replace(regexCardHtml, newCardHtml);
fs.writeFileSync('consumet.html', html);
