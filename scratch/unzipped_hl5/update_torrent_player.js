const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const oldFunc = `        function openTorrentPlayer() {
            closeDetailsModal();
            if (!selectedMedia) return;
            let tmdbId = selectedMedia.id;
            let type = selectedMedia.type || selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
            let url = '';
            
            if (type === 'movie') {
                url = \`https://vidlink.pro/movie/\${tmdbId}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\`;
            } else {
                url = \`https://vidlink.pro/tv/\${tmdbId}/\${selectedSeason}/\${selectedEpisode}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\`;
            }
            
            const playerIframe = document.getElementById('consumetPlayerIframe');
            if (playerIframe) {
                playerIframe.src = url;
            }
            const modal = document.getElementById('consumetPlayerModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }`;

const newFunc = `        function openTorrentPlayer() {
            closeDetailsModal();
            if (!selectedMedia) return;
            let type = selectedMedia.type || selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
            let queryStr = selectedMedia.title || selectedMedia.name || "";
            if (type === 'tv') {
                queryStr += \` S\${String(selectedSeason).padStart(2, '0')}E\${String(selectedEpisode).padStart(2, '0')}\`;
            } else if (selectedMedia.release_date) {
                queryStr += \` \${selectedMedia.release_date.substring(0,4)}\`;
            }
            
            let url = \`/torrent.html?play=\${encodeURIComponent(queryStr)}\`;
            
            const playerIframe = document.getElementById('consumetPlayerIframe');
            if (playerIframe) {
                playerIframe.src = url;
            }
            const modal = document.getElementById('consumetPlayerModal');
            if (modal) {
                modal.classList.remove('hidden');
            }
        }`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('consumet.html', html);
