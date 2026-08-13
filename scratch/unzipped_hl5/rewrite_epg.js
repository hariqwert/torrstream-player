const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /window\.epgChannels = allChannels;[\s\S]*?window\.epgProgrammesByChannel\[c\.id\]\.push\(p\);\s*\}/g;

// Wait, I need to see exactly the lines up to where `allChannels` is processed.
