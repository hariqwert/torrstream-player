const fs = require('fs');
const html = fs.readFileSync('play.php', 'utf8');
const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
let match;
let i = 0;
while ((match = scriptRegex.exec(html)) !== null) {
    fs.writeFileSync(`temp_${i}.js`, match[1]);
    let code = fs.readFileSync(`temp_${i}.js`, 'utf8');
    // Remove template vars for syntax check
    code = code.replace(/{{[A-Z_]+}}/g, 'true');
    code = code.replace(/<\?php[\s\S]*?\?>/g, '""');
    fs.writeFileSync(`temp_${i}.js`, code);
    
    try {
        require('child_process').execSync(`node -c temp_${i}.js`);
        console.log(`play.php Script ${i} OK`);
    } catch (e) {
        console.error(`play.php Script ${i} Syntax Error:\n` + e.stderr.toString());
    }
    i++;
}
