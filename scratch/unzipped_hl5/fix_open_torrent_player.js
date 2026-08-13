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

            const frame = document.getElementById('fullscreenVideoIframe');
            const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
            const epNavigator = document.getElementById('playerUpNextContainer');
            const serverNav = document.getElementById('playerServerSelector');
            
            if (epNavigator) {
                if (type === 'tv') {
                    epNavigator.classList.remove('hidden');
                    renderPlayerEpisodesList();
                } else {
                    epNavigator.classList.add('hidden');
                }
            }
            if (serverNav) serverNav.classList.remove('hidden');
            
            const select = document.getElementById('playerServerSelect');
            if (select) {
                const opt = Array.from(select.options).find(o => o.value === 'vidlink');
                if (!opt) {
                    const newOpt = document.createElement('option');
                    newOpt.value = 'vidlink';
                    newOpt.textContent = 'Vidlink (Torrent)';
                    select.appendChild(newOpt);
                }
                select.value = 'vidlink';
            }
            switchTab('player');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            frame.classList.remove('hidden');
            nativeContainer.classList.add('hidden');
            frame.src = url;
            
            const playerTitle = document.getElementById('playerTitle');
            if (playerTitle) {`;

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
            
            window.location.href = \`/torrent.html?play=\${encodeURIComponent(queryStr)}\`;
            return;
            
            const playerTitle = document.getElementById('playerTitle');
            if (playerTitle) {`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('consumet.html', html);
