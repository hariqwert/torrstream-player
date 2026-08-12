const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
const code = fs.readFileSync(filePath, 'utf8');

// Match <script> tags specifically
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;
while ((match = scriptRegex.exec(code)) !== null) {
  count++;
  const fullTag = match[0];
  const content = match[1];
  const srcMatch = fullTag.match(/^<script\b[^>]*\bsrc=["']([^"']+)["']/i);
  if (srcMatch) {
    console.log(`Script ${count}: external (${srcMatch[1]})`);
  } else {
    console.log(`Script ${count}: inline JS, length: ${content.length}`);
    try {
      new Function(content);
      console.log(`Script ${count}: SYNTAX OK!`);
    } catch (err) {
      console.error(`Script ${count}: SYNTAX ERROR!`, err.message);
    }
  }
}
