const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /<!-- 4\. SPORTS VIEW -->[\s\S]*?<!-- 5\. WATCHLIST VIEW -->/;

const newSports = `<!-- 4. SPORTS VIEW -->
        <section id="view-sports" class="hidden space-y-10 animate-fade-in relative min-h-screen">
            <!-- Dedicated Sports Hero Background -->
            <div class="absolute inset-0 top-0 left-0 right-0 h-[600px] pointer-events-none z-0">
                <div class="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent"></div>
            </div>

            <!-- Sports Header -->
            <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-12 pb-6 border-b border-white/10 relative z-10">
                <div>
                    <span class="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 mb-3 shadow-lg shadow-emerald-500/10">
                        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        Live Sports Center
                    </span>
                    <h1 class="text-4xl sm:text-5xl font-black tracking-tighter text-white">SPORTS ARENA</h1>
                    <p class="text-sm text-zinc-400 mt-2 font-medium max-w-xl">Immerse yourself in live sports, custom channels, and legendary events.</p>
                </div>
                <!-- Dedicated Sports Search -->
                <div class="relative w-full sm:w-auto">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i data-lucide="search" class="w-4 h-4 text-zinc-400"></i>
                    </div>
                    <input type="text" id="sportsSearch" onkeyup="filterSports()" placeholder="Search teams, channels..." class="bg-black/40 border border-white/10 focus:border-emerald-500/50 backdrop-blur-2xl rounded-2xl py-3 pl-11 pr-4 text-sm font-semibold outline-none text-white placeholder:text-zinc-500 w-full sm:w-80 transition-all shadow-2xl">
                </div>
            </div>

            <!-- Custom Channel M3U Launcher -->
            <div class="relative z-10 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[32px] p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
                <div class="flex items-center gap-5 w-full md:w-auto shrink-0">
                    <div class="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 transform -rotate-3">
                        <i data-lucide="radio" class="w-8 h-8 text-black"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-black text-white tracking-widest uppercase mb-1">Custom Stream</h3>
                        <p class="text-xs text-zinc-400 font-medium">Launch direct M3U/M3U8 feeds</p>
                    </div>
                </div>
                
                <div class="w-full grid grid-cols-1 md:grid-cols-12 gap-3 flex-grow">
                    <div class="md:col-span-4">
                        <input type="text" id="customM3uNameInput" placeholder="Channel Name (e.g. ESPN)" class="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl py-3.5 px-5 text-sm font-semibold outline-none text-white placeholder:text-zinc-500 transition-all">
                    </div>
                    <div class="md:col-span-6">
                        <input type="url" id="customM3uUrlInput" onkeydown="if(event.key==='Enter') playCustomM3uStream()" placeholder="Paste Stream URL (http://...m3u8)" class="w-full bg-white/5 border border-white/10 focus:border-emerald-500/50 rounded-xl py-3.5 px-5 text-sm font-mono outline-none text-white placeholder:text-zinc-500 transition-all">
                    </div>
                    <div class="md:col-span-2">
                        <button onclick="playCustomM3uStream()" class="w-full h-full min-h-[48px] px-6 bg-white text-black hover:bg-zinc-200 text-xs font-black uppercase tracking-widest rounded-xl shadow-xl flex items-center justify-center gap-2 transform active:scale-95 transition-all">
                            <i data-lucide="play" class="w-4 h-4 fill-black text-black"></i> Play
                        </button>
                    </div>
                </div>
                <div id="userCustomM3uChips" class="absolute -bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center items-center gap-2 hidden"></div>
            </div>

            <!-- Sports Live Grid -->
            <div class="space-y-6 relative z-10 animate-fade-in" id="sportsLiveEventsShelfContainer" style="display: none;">
                <div class="flex items-center gap-3">
                    <div class="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                    <h2 class="text-xl font-black uppercase tracking-widest text-white">Live Broadcasts</h2>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" id="sportsLiveEventsShelf">
                    <!-- Dynamic -->
                </div>
            </div>

            <!-- EPG Timeline for Sports -->
            <div class="space-y-6 relative z-10">
                <div class="flex items-center gap-3">
                    <i data-lucide="calendar-clock" class="w-6 h-6 text-emerald-400"></i>
                    <h2 class="text-xl font-black uppercase tracking-widest text-white">Sports Schedule</h2>
                </div>
                
                <div class="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl">
                    <div class="flex flex-col md:flex-row">
                        <!-- Sidebar Channels -->
                        <div class="w-full md:w-64 bg-zinc-950/80 border-r border-white/5 flex flex-col">
                            <div class="h-16 border-b border-white/5 flex items-center px-6">
                                <span class="text-xs font-black text-zinc-400 uppercase tracking-widest">Channels</span>
                            </div>
                            <div id="epgSidebarChannels" class="flex-1 overflow-y-auto no-scrollbar py-2 h-[400px] md:h-[600px]">
                                <!-- Channels -->
                            </div>
                        </div>
                        
                        <!-- Timeline -->
                        <div class="flex-1 flex flex-col relative overflow-hidden bg-[#09090b]/90">
                            <!-- Hours Header -->
                            <div id="epgTimelineHoursHeader" class="h-16 border-b border-white/5 flex overflow-x-auto no-scrollbar relative select-none bg-zinc-950/50" onscroll="syncEpgHeaderScroll(this)">
                                <!-- Hours -->
                            </div>
                            
                            <!-- Schedule Body -->
                            <div id="epgTimelineBody" class="flex-1 overflow-auto relative no-scrollbar bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTM5LjUgMEwzOS41IDQwTDAgNDBMIDAgMEwzOS41IDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')] h-[400px] md:h-[600px]" onscroll="syncEpgTimelineScroll(this)">
                                <!-- Blocks -->
                            </div>
                            
                            <!-- Current Time Indicator -->
                            <div id="epgCurrentTimeIndicator" class="absolute top-0 bottom-0 w-[1px] bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] pointer-events-none z-30 hidden transition-transform duration-300">
                                <div class="w-3 h-3 bg-emerald-500 rounded-full -ml-1.5 -mt-1.5 shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </section>

        <!-- 5. WATCHLIST VIEW -->`;

html = html.replace(regex, newSports);
fs.writeFileSync('consumet.html', html);
