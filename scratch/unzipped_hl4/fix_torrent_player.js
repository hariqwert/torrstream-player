const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const oldFunc = `function openTorrentPlayer() {
            closeDetailsModal();
            let tmdbId = selectedMedia.id;
            let type = selectedMedia.type || selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
            let url = '';
            
            if (type === 'movie') {
                url = \\\`https://vidlink.pro/movie/\\\${tmdbId}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\\\`;
            } else {
                url = \\\`https://vidlink.pro/tv/\\\${tmdbId}/\\\${selectedSeason}/\\\${selectedEpisode}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\\\`;
            }

            const frame = document.getElementById('fullscreenVideoIframe');
            const nativeContainer = document.getElementById('fullscreenNativePlayerContainer');
            
            if(frame && nativeContainer) {
                // Reuse fullscreen UI for VidLink
                document.getElementById('fullscreenPlayerOverlay').classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                frame.classList.remove('hidden');
                nativeContainer.classList.add('hidden');
                frame.src = url;
            } else {
                window.open(url, '_blank');
            }
        }`;

const newFunc = `function openTorrentPlayer() {
            closeDetailsModal();
            if (!selectedMedia) return;
            let tmdbId = selectedMedia.id;
            let type = selectedMedia.type || selectedMedia.media_type || (selectedMedia.title ? 'movie' : 'tv');
            let url = '';
            
            if (type === 'movie') {
                url = \\\`https://vidlink.pro/movie/\\\${tmdbId}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\\\`;
            } else {
                url = \\\`https://vidlink.pro/tv/\\\${tmdbId}/\\\${selectedSeason}/\\\${selectedEpisode}?primaryColor=EF4444&secondaryColor=EF4444&autoplay=true\\\`;
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
            
            // Set Server select to Vidlink (Torrent) so it looks right
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
            if (playerTitle) {
                playerTitle.innerHTML = \\\`\\\${selectedMedia.title || selectedMedia.name} \\\${type === 'tv' ? \\\`<span class="text-zinc-500">S\\\${selectedSeason} E\\\${selectedEpisode}</span>\\\` : ''}\\\`;
            }
        }`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('consumet.html', html);
