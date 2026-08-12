const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

code = code.replace(
  /function openTorrentPlayerForItem\(title\) \{[^\}]+\}/,
  `function openTorrentPlayerForItem(title, tmdbId, type, year) {
    let query = title;
    if (year && type === 'movie') query += ' ' + year;
    let url = "/torrent.html?play=" + encodeURIComponent(query);
    if (tmdbId) url += "&tmdb=" + encodeURIComponent(tmdbId);
    if (type) url += "&type=" + encodeURIComponent(type);
    showToast("Opening BitTorrent Swarm Stream for " + title + "...");
    window.location.href = url;
}`
);

// update hero slider
code = code.split("openTorrentPlayerForItem('${title.replace(/'/g, \"\\\\'\")}')").join("openTorrentPlayerForItem('${title.replace(/'/g, \"\\\\'\")}', '${item.id}', '${type}', '${year}')");

// update grid card
code = code.split("openTorrentPlayerForItem('${safeTitle}')").join("openTorrentPlayerForItem('${safeTitle}', '${item.id}', '${type}', '${year}')");

fs.writeFileSync('consumet.html', code);
console.log("Patched correctly!");
