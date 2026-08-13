const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Remove Anime Hub heading
html = html.replace(/<h1 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">\s*<i data-lucide="sparkles"[^>]*><\/i>\s*Anime Hub\s*<\/h1>\s*<p class="text-xs text-zinc-400 mt-1">Dive into the largest library of Japanese animation.<\/p>/, '');

// Remove Sports Arena heading
html = html.replace(/<h1 class="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">\s*<i data-lucide="trophy"[^>]*><\/i>\s*Sports Arena\s*<\/h1>\s*<p class="text-xs text-zinc-400 mt-1">Immerse yourself in live sports, custom channels, and legendary events.<\/p>/, '');

fs.writeFileSync('consumet.html', html);
