const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /async function openFullscreenPlayer\(sportsUrl/g;

const torrentFunc = `function openTorrentPlayer() {
            closeDetailsModal();
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
        }

        async function openFullscreenPlayer(sportsUrl`;

html = html.replace(regex, torrentFunc);
fs.writeFileSync('consumet.html', html);
