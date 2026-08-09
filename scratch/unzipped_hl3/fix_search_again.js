const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /let epgMatches = \[\];[\s\S]*?htmlOutput \+= '<\/div>';\s*\}/;

const replacement = `let epgMatches = [];
                if (window.allSportsChannels) {
                    const q = query.toLowerCase();
                    const normalizeName = (name) => name.replace(/\\[.*?\\]|\\(.*?\\)|\\|.*/g, '').replace(/\\b(hd|fhd|4k|sd)\\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();

                    for (const ch of window.allSportsChannels) {
                        let matchTitle = null;
                        let matchType = null;
                        
                        // Check channel name
                        if (ch.name.toLowerCase().includes(q)) {
                            matchTitle = ch.name;
                            matchType = 'channel';
                        } else {
                            // Try EPG lookup
                            if (window.epgChannels && window.epgProgrammesByChannel) {
                                const cleanName = normalizeName(ch.name);
                                const matchedEpgChan = window.epgChannels.find(c => {
                                    const cName = normalizeName(c.name);
                                    if (!cName || !cleanName) return false;
                                    if (cName === cleanName) return true;
                                    if (cName.length > 4 && cleanName.includes(cName)) return true;
                                    if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                    return false;
                                });
                                
                                if (matchedEpgChan) {
                                    const progs = window.epgProgrammesByChannel[matchedEpgChan.id] || [];
                                    const progMatch = progs.find(p => p.title && p.title.toLowerCase().includes(q));
                                    if (progMatch) {
                                        matchTitle = progMatch.title;
                                        matchType = 'program';
                                    }
                                }
                            }
                        }
                        
                        if (matchTitle) {
                            epgMatches.push({ type: matchType, title: matchTitle, channel: ch });
                        }
                        if (epgMatches.length >= 10) break;
                    }
                }

                if (epgMatches.length > 0) {
                    htmlOutput += '<div class="text-[10px] text-amber-500 font-bold uppercase tracking-widest mb-2 px-1">Live Channels & Events</div>';
                    htmlOutput += '<div class="grid grid-cols-1 gap-2 mb-4">';
                    
                    epgMatches.forEach(match => {
                        const subTitle = match.type === 'program' ? 'On: ' + match.channel.name : 'Live Channel';
                        const logo = (typeof getSportsLogo === 'function') ? getSportsLogo(match.channel) : (match.channel.logo || '');
                        const url = match.channel.url || match.channel.stream_url;
                        const titleSafe = match.title.replace(/'/g, "\\\\\\'").replace(/"/g, '&quot;');
                        
                        htmlOutput += \`
                        <div class="flex items-center gap-3 p-3 bg-amber-950/20 hover:bg-amber-900/40 border border-amber-500/10 hover:border-amber-500/30 rounded-xl cursor-pointer transition-all transform active:scale-[0.99] group" 
                             onclick="closeSearchPalette(); openFullscreenPlayer('\${url}', '\${titleSafe}');">
                            <div class="w-10 h-10 rounded-lg bg-black border border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1">
                                <img src="\${logo}" class="max-w-full max-h-full object-contain" onerror="this.outerHTML='<i data-lucide=\\'play\\' class=\\'w-5 h-5 text-amber-500\\'></i>'">
                            </div>
                            <div class="min-w-0 flex-grow text-left">
                                <div class="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5"><div class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div> \${subTitle}</div>
                                <div class="text-sm font-extrabold text-white truncate mt-0.5" title="\${match.title}">\${match.title}</div>
                            </div>
                            <i data-lucide="play" class="w-5 h-5 text-amber-500/50 group-hover:text-amber-500 transition-colors shrink-0"></i>
                        </div>\`;
                    });
                    htmlOutput += '</div>';
                }`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
