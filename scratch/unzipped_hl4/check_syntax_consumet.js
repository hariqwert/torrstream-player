const fs = require('fs');
const html = fs.readFileSync('play_consumet.php', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    fs.writeFileSync(`temp_${i}.js`, match[1]);
    try {
        require('child_process').execSync(`node -c temp_${i}.js`);
        console.log(`Script ${i} OK`);
    } catch (e) {
        console.error(`Script ${i} Syntax Error:\n` + e.stderr.toString());
    }
    i++;
}
