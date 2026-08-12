const fs = require('fs');
const path = require('path');

const logFile = path.join('C:', 'Users', 'HP', '.gemini', 'antigravity', 'brain', 'bff9159b-d5fd-430a-993b-aac97aaed6b8', '.system_generated', 'logs', 'transcript_full.jsonl');
const content = fs.readFileSync(logFile, 'utf8');
const lines = content.split('\n');

const line187 = lines[187];
console.log('Extracting line 187, total chars:', line187.length);

const parsedObj = JSON.parse(line187);

let userText = parsedObj.content || '';
if (typeof userText !== 'string' && Array.isArray(userText)) {
  userText = userText.map(c => c.text || '').join('');
}

const htmlStart = userText.indexOf('<!DOCTYPE html>');
if (htmlStart !== -1) {
  let html = userText.substring(htmlStart);
  fs.writeFileSync('scratch/user_old_version.html', html, 'utf8');
  console.log('Successfully saved scratch/user_old_version.html, length:', html.length);
} else {
  console.error('Could not find <!DOCTYPE html> in user content');
}
