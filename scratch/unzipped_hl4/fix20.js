const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const lines = html.split('\n');
let count = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('? `<button onclick="event.stopPropagation(); showToast(\'Added ${title.replace(')) {
        count++;
        lines[i] = lines[i].replace('">`', '">');
    }
}

console.log("Matched 3751:", count);
fs.writeFileSync('consumet.html', lines.join('\n'), 'utf8');
