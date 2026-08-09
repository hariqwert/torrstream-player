const fs = require('fs');

let currentCode = fs.readFileSync('consumet.html', 'utf8');
let bakCode = fs.readFileSync('consumet.html.bak', 'utf8');

// Find the block in current code
const currentStart = "        async function openFullscreenPlayer(sportsUrl = null, sportsName = null) {";
const currentEnd = "        function closeFullscreenPlayer() {";
const currentStartIdx = currentCode.indexOf(currentStart);
const currentEndIdx = currentCode.indexOf(currentEnd);

if (currentStartIdx === -1 || currentEndIdx === -1) {
    console.error("Could not find current block");
    process.exit(1);
}

// Find the block in backup code
const bakStartIdx = bakCode.indexOf(currentStart);
const bakEndIdx = bakCode.indexOf(currentEnd);

if (bakStartIdx === -1 || bakEndIdx === -1) {
    console.error("Could not find backup block");
    process.exit(1);
}

const bakBlock = bakCode.substring(bakStartIdx, bakEndIdx);

// Replace
const newCode = currentCode.substring(0, currentStartIdx) + bakBlock + currentCode.substring(currentEndIdx);
fs.writeFileSync('consumet.html', newCode);
console.log("Successfully reverted openFullscreenPlayer!");
