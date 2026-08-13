const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const replacement = `            <!-- 8 New Subsections -->
            <div class="space-y-12 pt-10 border-t border-white/10 pb-8">
                <!-- 1. Sci-Fi -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="rocket" class="text-blue-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Intergalactic Sci-Fi</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('scifiShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="scifiShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('scifiShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 2. Korean -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="monitor-play" class="text-pink-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">K-Drama & Korean Cinema</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('koreanShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="koreanShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('koreanShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 3. Comedy -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="smile" class="text-yellow-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Laugh Out Loud Comedies</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('comedyShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="comedyShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('comedyShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 4. Horror -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="ghost" class="text-red-600 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Midnight Horror & Thrillers</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('horrorShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="horrorShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('horrorShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 5. Documentary -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="camera" class="text-emerald-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Eye-Opening Documentaries</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('documentaryShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="documentaryShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('documentaryShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 6. Classics -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="film" class="text-zinc-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Timeless Classics</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('classicShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="classicShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('classicShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 7. Kids -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="baby" class="text-sky-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-white">Kids & Family Adventures</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('kidsShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="kidsShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('kidsShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>

                <!-- 8. Award-Winning Masterpieces -->
                <div class="space-y-4">
                    <div class="flex items-center gap-2">
                        <i data-lucide="award" class="text-amber-400 w-5 h-5"></i>
                        <h2 class="text-xl sm:text-2xl font-black tracking-tight text-amber-100 uppercase">Award-Winning Masterpieces</h2>
                    </div>
                    <div class="scroller-container">
                        <button class="scroller-btn scroller-left" onclick="scrollShelf('awardShelf', 'left')"><i data-lucide="chevron-left"></i></button>
                        <div id="awardShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
                        <button class="scroller-btn scroller-right" onclick="scrollShelf('awardShelf', 'right')"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>
            </div>`;

html = html.replace(/<!-- 8 New Subsections including Thalapathy Vijay -->\s*<div class="space-y-12 pt-10 border-t border-white\/10 pb-8">\s*<\/section>/, replacement + '\n        </section>');

fs.writeFileSync('consumet.html', html);
