const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /sItem\.className = "epg-sidebar-item h-\[65px\] px-4 flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900\/40 border-b border-white\/5 transition-all";[\s\S]*?sidebarContainer\.appendChild\(sItem\);/;

const replacement = `sItem.className = "epg-sidebar-item h-[65px] px-4 flex items-center gap-3 bg-zinc-950 hover:bg-zinc-900/40 border-b border-white/5 transition-all cursor-pointer group";
                
                sItem.onclick = () => {
                    if (chan.url) {
                        openFullscreenPlayer(chan.url, chan.name);
                    } else {
                        openEpgChannelModal(chan.id, chan.name, chan.logo);
                    }
                };

                // Fallback channel avatar
                const initials = chan.name.substring(0, 2).toUpperCase();
                sItem.innerHTML = \`
                    <div class="w-9 h-9 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        <img src="\${chan.logo}" alt="" class="w-full h-full object-cover" onerror="this.outerHTML='<span class=&quot;text-[10px] font-bold text-amber-500&quot;>\${initials}</span>'">
                    </div>
                    <div class="min-w-0 flex-grow">
                        <p class="text-xs font-black uppercase text-white truncate leading-tight group-hover:text-amber-500 transition-colors">\${chan.name}</p>
                        <p class="text-[9px] font-semibold text-amber-500 tracking-wider flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><i data-lucide="play" class="w-2.5 h-2.5"></i> Play Channel</p>
                    </div>
                \`;
                sidebarContainer.appendChild(sItem);`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
