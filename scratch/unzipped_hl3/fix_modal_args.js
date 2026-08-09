const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// For 2392
// onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(title).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}')"
// Need to add: '${encodeURIComponent(rawUrl).replace(/'/g, "%27")}'
const regex1 = /openEpgChannelModal\('\$\{ch\.id \|\| ""\}', '\$\{encodeURIComponent\(title\)\.replace\(\/'\/g, "%27"\)\}', '\$\{encodeURIComponent\(poster\)\.replace\(\/'\/g, "%27"\)\}'\)/g;
html = html.replace(regex1, `openEpgChannelModal('\${ch.id || ""}', '\${encodeURIComponent(title).replace(/'/g, "%27")}', '\${encodeURIComponent(poster).replace(/'/g, "%27")}', '\${encodeURIComponent(rawUrl).replace(/'/g, "%27")}')`);

// For 2786 and 2844
// onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}')"
// Need to add: '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}'
const regex2 = /openEpgChannelModal\('\$\{ch\.id \|\| ""\}', '\$\{encodeURIComponent\(ch\.name\)\.replace\(\/'\/g, "%27"\)\}', '\$\{encodeURIComponent\(poster\)\.replace\(\/'\/g, "%27"\)\}'\)/g;
html = html.replace(regex2, `openEpgChannelModal('\${ch.id || ""}', '\${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '\${encodeURIComponent(poster).replace(/'/g, "%27")}', '\${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}')`);

// For 6056
// openEpgChannelModal(chan.id, chan.name, chan.logo);
// Need to add: chan.url
const regex3 = /openEpgChannelModal\(chan\.id, chan\.name, chan\.logo\);/g;
html = html.replace(regex3, `openEpgChannelModal(chan.id, chan.name, chan.logo, chan.url);`);


fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
