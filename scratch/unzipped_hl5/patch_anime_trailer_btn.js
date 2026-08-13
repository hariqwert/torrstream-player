const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /<button onclick="playTrailerPopup\('\$\{trailer\.key\}', '\$\{encodeURIComponent\(title\)\}'\)" class="px-5 py-3 bg-red-600\/20 hover:bg-red-600\/30 border border-red-500\/30 text-red-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1\.5 transform active:scale-95">[\s\S]*?<i data-lucide="play" class="w-4 h-4 text-red-500"><\/i> Watch Trailer[\s\S]*?<\/button>/;

const newBtn = `<button onclick="playTrailerPopup('\${trailer.key}', '\${encodeURIComponent(title)}')" class="px-5 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 transform active:scale-95">
                            <i data-lucide="play" class="w-4 h-4 text-white"></i> Watch Trailer
                        </button>`;

html = html.replace(regex, newBtn);
fs.writeFileSync('consumet.html', html);
