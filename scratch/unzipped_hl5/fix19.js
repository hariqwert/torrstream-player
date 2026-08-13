const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onclick="event.stopPropagation(); showToast(\'Added ')) {
        count++;
        lines[i] = `                    ? \`<button onclick="event.stopPropagation(); showToast('Added \${title.replace(/'/g, "\\\\'")}\ to Watchlist!');" class="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-indigo-600 hover:bg-indigo-700 border border-white/10 flex items-center justify-center text-white transition-all shadow-md active:scale-90 ">\``;
    }
}

console.log("Matched 3751:", count);
fs.writeFileSync('consumet.html', lines.join('\n'), 'utf8');
