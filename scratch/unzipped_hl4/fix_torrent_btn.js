const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

html = html.replace(/function openTorrentPlayer\(\) \{[\s\S]*?const playerTitle = document.getElementById\('playerTitle'\);/m, 
`function openTorrentPlayer() {
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
            
            const playerTitle = document.getElementById('playerTitle');`);

fs.writeFileSync('consumet.html', html);
