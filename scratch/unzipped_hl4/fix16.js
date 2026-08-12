const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('onclick="closeEpgProgramModal(); openFullscreenPlayer(')) {
        count++;
        lines[i] = `                    playBtnContainer.innerHTML = \`<button onclick="closeEpgProgramModal(); openFullscreenPlayer('\${channelUrl.replace(/'/g, "\\\\'")}', '\${channelName.replace(/'/g, "\\\\'")}')" class="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Live Channel</button>\`;`;
    }
}

console.log("Matched:", count);
fs.writeFileSync('consumet.html', lines.join('\n'), 'utf8');
