const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'bff9159b-d5fd-430a-993b-aac97aaed6b8', '.system_generated', 'logs', 'transcript_full.jsonl');
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('Stalker Cinema | Premium Movie')) {
    console.log(`Line ${idx}: length = ${line.length}`);
  }
});
