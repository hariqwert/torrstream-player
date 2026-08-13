const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const oldFunc = `        async function searchAndPlayItem(query, autoPlayContext = null, episode = null) {
            if (!query) return;
            try {
                const res = await fetchTMDB('search/multi', { query: query });
                if (res && res.results && res.results.length > 0) {
                    const match = res.results[0];
                    if (autoPlayContext) {
                        selectedMedia = match;
                        selectedMedia.type = match.media_type || (match.title ? 'movie' : 'tv');
                        selectedSeason = 1;
                        selectedEpisode = episode || 1;
                        
                        if (autoPlayContext === 'torrent') {
                            openTorrentPlayer();
                        } else if (autoPlayContext === 'player1') {
                            await openDetails(match.id, selectedMedia.type, 1, episode);
                            // Wait for modal to render then start playback
                            setTimeout(() => {
                                startActualPlayback();
                            }, 500);
                        }
                    } else {
                        openDetails(match.id, match.media_type || (match.title ? 'movie' : 'tv'));
                    }
                } else {
                    const input = document.getElementById('globalSearchInput');
                    if (input) {
                        input.value = query;
                        if (typeof executeSearch === 'function') executeSearch();
                    }
                }
            } catch(e) {
                console.error("searchAndPlayItem error", e);
            }
        }`;

const newFunc = `        async function searchAndPlayItem(query, autoPlayContext = null, episode = null) {
            if (!query) return;
            try {
                const res = await fetchTMDB('search/multi', { query: query });
                if (res && res.results && res.results.length > 0) {
                    const match = res.results[0];
                    if (autoPlayContext) {
                        selectedMedia = match;
                        selectedMedia.type = match.media_type || (match.title ? 'movie' : 'tv');
                        selectedSeason = 1;
                        selectedEpisode = episode || 1;
                        
                        // Fetch latest episode for TV
                        if (selectedMedia.type === 'tv') {
                            try {
                                const tvDetails = await fetchTMDB(\`tv/\${match.id}\`);
                                if (tvDetails && tvDetails.last_episode_to_air) {
                                    selectedSeason = tvDetails.last_episode_to_air.season_number;
                                    selectedEpisode = tvDetails.last_episode_to_air.episode_number;
                                }
                            } catch (e) {
                                console.error("Failed to fetch tv details for latest episode", e);
                            }
                        }
                        
                        if (autoPlayContext === 'torrent') {
                            openTorrentPlayer();
                        } else if (autoPlayContext === 'player1') {
                            await openDetails(match.id, selectedMedia.type, selectedSeason, selectedEpisode);
                            // Wait for modal to render then start playback
                            setTimeout(() => {
                                startActualPlayback();
                            }, 500);
                        }
                    } else {
                        openDetails(match.id, match.media_type || (match.title ? 'movie' : 'tv'));
                    }
                } else {
                    const input = document.getElementById('globalSearchInput');
                    if (input) {
                        input.value = query;
                        if (typeof executeSearch === 'function') executeSearch();
                    }
                }
            } catch(e) {
                console.error("searchAndPlayItem error", e);
            }
        }`;

html = html.replace(oldFunc, newFunc);
fs.writeFileSync('consumet.html', html);
