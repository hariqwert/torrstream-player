const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

// add to select options
code = code.replace(
    '<option value="smashystream">⚡ Smashy</option>',
    '<option value="smashystream">⚡ Smashy</option>\n                    <option value="embedsu">⚡ Embed.su</option>\n                    <option value="vidbinge">⚡ VidBinge</option>'
);

// add to buildIframeUrl logic
code = code.replace(
    "} else if (currentServer === 'smashystream') {",
    "} else if (currentServer === 'embedsu') {\n                url = type === 'movie' ? `https://embed.su/embed/movie/${tmdbId}` : `https://embed.su/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;\n            } else if (currentServer === 'vidbinge') {\n                url = type === 'movie' ? `https://vidbinge.dev/embed/movie/${tmdbId}` : `https://vidbinge.dev/embed/tv/${tmdbId}/${selectedSeason}/${selectedEpisode}`;\n            } else if (currentServer === 'smashystream') {"
);

fs.writeFileSync('consumet.html', code);
