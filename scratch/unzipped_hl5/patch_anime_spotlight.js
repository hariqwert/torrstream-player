const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 z-20 animate-fade-in">[\s\S]*?<!-- Dynamic Logo Container -->/;

const newDesign = `<div class="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 md:p-16 lg:p-24 z-20 animate-fade-in">
                    <div class="max-w-4xl">
                        <div class="flex flex-wrap items-center gap-3 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/70 mb-4 sm:mb-6">
                            <span class="bg-indigo-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]">✨ Anime Spotlight</span>
                            <span class="bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 flex items-center gap-1.5">
                                <i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i> \${rating}
                            </span>
                            <span class="bg-black/40 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10">\${year}</span>
                        </div>
                        
                        <!-- Dynamic Logo Container -->`;

html = html.replace(regex, newDesign);

fs.writeFileSync('consumet.html', html);
