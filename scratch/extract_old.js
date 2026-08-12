const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'bff9159b-d5fd-430a-993b-aac97aaed6b8', '.system_generated', 'logs', 'transcript_full.jsonl');
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('compare with full functinal old version')) {
    console.log('Found line at index:', i);
    const htmlIdx = lines[i].indexOf('<!DOCTYPE html>');
    if (htmlIdx !== -1) {
      let raw = lines[i].substring(htmlIdx);
      // Unescape json string encoding if needed
      try {
        // Try parsing string
        const parsed = JSON.parse(`"${raw.replace(/\\"/g, '"').replace(/"/g, '\\"')}"`);
        fs.writeFileSync('scratch/old_consumet.html', parsed, 'utf8');
        console.log('Saved old_consumet.html via JSON parse, length:', parsed.length);
      } catch(e) {
        // Unescape backslashes manually
        let html = raw.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\\\/g, '\\');
        const endTag = html.lastIndexOf('</html>');
        if (endTag !== -1) {
          html = html.substring(0, endTag + 7);
        }
        fs.writeFileSync('scratch/old_consumet.html', html, 'utf8');
        console.log('Saved old_consumet.html manually, length:', html.length);
      }
      break;
    }
  }
}
