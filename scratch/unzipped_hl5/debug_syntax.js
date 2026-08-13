const fs = require('fs');
const { execSync } = require('child_process');

function checkFile(file) {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf8');
    const scriptRegex = /<script.*?>([\s\S]*?)<\/script>/gi;
    let match;
    let i = 0;
    while ((match = scriptRegex.exec(content)) !== null) {
        const scriptContent = match[1];
        if (scriptContent.trim()) {
            const tempFile = `temp_${file.replace(/[/\\.]/g, '_')}_${i}.js`;
            fs.writeFileSync(tempFile, scriptContent);
            try {
                execSync(`node -c ${tempFile}`);
            } catch (e) {
                console.log(`\n--- ERROR IN ${file} BLOCK ${i} ---`);
                console.log(e.stdout.toString() || e.stderr.toString());
            }
            fs.unlinkSync(tempFile);
        }
        i++;
    }
}
checkFile('consumet.html');
checkFile('play.php');
