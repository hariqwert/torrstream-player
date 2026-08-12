const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

const playNowBtnRegex = /<button onclick="openFullscreenPlayer\(\)" class="([^"]*)"><i data-lucide="play" class="w-4 h-4 fill-white"><\/i> Play Now<\/button>/;

if (playNowBtnRegex.test(code)) {
    const playNowBtn = code.match(playNowBtnRegex)[0];
    const newBtn = playNowBtn + `\n<button id="btn-play-torrent" onclick="openTorrentPlayer()" class="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 transform active:scale-95"><i data-lucide="download-cloud" class="w-4 h-4 fill-white"></i> Play Torrent (P2)</button>`;
    
    code = code.replace(playNowBtn, newBtn);
} else {
    console.log("Play Now button not found using regex.");
}

const openTorrentFunction = `
        function openTorrentPlayer() {
            if (!selectedMedia) return;
            const title = selectedMedia.title || selectedMedia.name;
            const tmdbId = selectedMedia.id;
            const mediaType = selectedMedia.type === 'tv' ? 'series' : 'movie';
            const season = selectedSeason || 1;
            const episode = selectedEpisode || 1;
            
            const url = \`/torrent.html?tmdb=\${tmdbId}&type=\${mediaType}&s=\${season}&e=\${episode}\`;
            window.location.href = url;
        }
`;

if (!code.includes("openTorrentPlayer() {")) {
    code = code.replace("function startActualPlayback() {", openTorrentFunction + "\n        function startActualPlayback() {");
}

fs.writeFileSync('consumet.html', code);
console.log("Patched consumet.html");
