const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');
code = code.replace(
/async function openFullscreenPlayer\(sportsUrl = null, sportsName = null\) \{[\s\S]*?function closeFullscreenPlayer\(\) \{/g,
`async function openFullscreenPlayer(sportsUrl = null, sportsName = null) {
            closeDetailsModal();
            
            if (sportsUrl) {
                // Navigate to play.php with url and name params
                window.location.href = \`play.php?id=\${encodeURIComponent(sportsUrl)}&name=\${encodeURIComponent(sportsName || "Live Sports")}&source=consumet.html\`;
                return;
            }

            if (!selectedMedia || !selectedMedia.id || !selectedMedia.type) return;

            let embedUrl = "";
            const imdbId = selectedMedia.external_ids?.imdb_id || selectedMedia.id;
            const tmdbId = selectedMedia.id;
            const type = selectedMedia.type;

            if (currentServer === 'vidlink') {
                embedUrl = type === 'movie' ? \`https://vidlink.pro/movie/\${tmdbId}?autoplay=true\` : \`https://vidlink.pro/tv/\${tmdbId}/\${selectedSeason}/\${selectedEpisode}?autoplay=true\`;
            } else if (currentServer === 'vidsrc_to') {
                embedUrl = type === 'movie' ? \`https://vidsrc.to/embed/movie/\${imdbId}\` : \`https://vidsrc.to/embed/tv/\${imdbId}/\${selectedSeason}/\${selectedEpisode}\`;
            } else if (currentServer === 'vidsrc_net') {
                embedUrl = type === 'movie' ? \`https://vidsrc.net/embed/movie/\${imdbId}\` : \`https://vidsrc.net/embed/tv/\${imdbId}/\${selectedSeason}/\${selectedEpisode}\`;
            } else if (currentServer === 'vidsrc_cc') {
                embedUrl = type === 'movie' ? \`https://vidsrc.cc/v2/embed/movie/\${imdbId}\` : \`https://vidsrc.cc/v2/embed/tv/\${imdbId}/\${selectedSeason}/\${selectedEpisode}\`;
            } else {
                // Default to vidlink
                embedUrl = type === 'movie' ? \`https://vidlink.pro/movie/\${tmdbId}?autoplay=true\` : \`https://vidlink.pro/tv/\${tmdbId}/\${selectedSeason}/\${selectedEpisode}?autoplay=true\`;
            }

            // Save to Watch History before playing
            saveToWatchHistory(selectedMedia.id);
            
            // Navigate to embed page
            window.location.href = \`play_media.html?url=\${encodeURIComponent(embedUrl)}&title=\${encodeURIComponent(selectedMedia.title || selectedMedia.name || "Media Player")}\`;
        }

        function closeFullscreenPlayer() {`
);
fs.writeFileSync('consumet.html', code);
