const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const oldFuncStart = `        async function openDetails(id, mediaType, startSeason = null, startEpisode = null) {`;
const newFuncStart = `        async function openDetails(id, mediaType, startSeason = null, startEpisode = null) {`;

// Let's just find where it sets `selectedSeason = startSeason || 1;`
const oldLogic = `                    selectedSeason = startSeason || 1;
                    select.value = selectedSeason;
                    selectedEpisode = startEpisode || 1;`;
const newLogic = `                    if (data.last_episode_to_air && !startSeason && !startEpisode) {
                        selectedSeason = data.last_episode_to_air.season_number;
                        selectedEpisode = data.last_episode_to_air.episode_number;
                    } else {
                        selectedSeason = startSeason || 1;
                        selectedEpisode = startEpisode || 1;
                    }
                    select.value = selectedSeason;`;

html = html.replace(oldLogic, newLogic);
fs.writeFileSync('consumet.html', html);
