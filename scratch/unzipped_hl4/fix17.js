const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('openFullscreenPlayer(\'${rawUrl}\', \'${encodeURIComponent(title).replace')) {
        count++;
        lines[i] = `                    <div class="bg-zinc-950/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 relative group flex flex-col justify-between p-3.5" onclick="openFullscreenPlayer('\${rawUrl}', '\${title.replace(/'/g, "\\\\'")}')">`;
    } else if (lines[i].includes('openFullscreenPlayer(\'${item.url}\', \'${encodeURIComponent(title)}\')')) {
        count++;
        lines[i] = `                        <button onclick="openFullscreenPlayer('\${item.url}', '\${title.replace(/'/g, "\\\\'")}')" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 flex items-center gap-2 transform active:scale-95">`;
    }
}

console.log("Matched:", count);
fs.writeFileSync('consumet.html', lines.join('\n'), 'utf8');
