const fs = require('fs');
let bakCode = fs.readFileSync('consumet.html.bak', 'utf8');
let currentCode = fs.readFileSync('consumet.html', 'utf8');

// Find the block in backup
const startString = "async function openFullscreenPlayer(sportsUrl = null, sportsName = null) {";
const endString = "        function renderPlayerEpisodesList() {"; // Let's see what's after
const match1 = bakCode.indexOf(startString);
const match2 = bakCode.indexOf(endString);
const blockToRestore = bakCode.substring(match1, match2);

// Find the block in current
const match3 = currentCode.indexOf(startString);
const endStringInCurrent = "        function renderPlayerEpisodesList() {";
const match4 = currentCode.indexOf(endStringInCurrent);

// But wait, did I remove renderPlayerEpisodesList? Let's check!
