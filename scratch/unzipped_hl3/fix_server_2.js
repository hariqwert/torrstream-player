const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const target = `    servePhpFile(path.join(process.cwd(), 'play_consumet.php'), res, {
        '<?php echo htmlspecialchars($name); ?>': name,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '<?php echo htmlspecialchars($source); ?>': source,
        '{{STREAM_URL}}': stream_url,
        '{{NAME}}': name,
        '{{SOURCE}}': source
    });app.get('/play_torrent.php', (req, res) => {`;

const replacement = `    servePhpFile(path.join(process.cwd(), 'play_consumet.php'), res, {
        '<?php echo htmlspecialchars($name); ?>': name,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '<?php echo htmlspecialchars($source); ?>': source,
        '{{STREAM_URL}}': stream_url,
        '{{NAME}}': name,
        '{{SOURCE}}': source
    });
});

app.get('/play_torrent.php', (req, res) => {`;

code = code.replace(target, replacement);

const target2 = `    servePhpFile(path.join(process.cwd(), 'play_torrent.php'), res, {
        '<?php echo htmlspecialchars($name); ?>': name,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '{{STREAM_URL}}': stream_url,
        '{{NAME}}': name
    });
});});app.get('/play_media.html', (req, res) => {`;

const replacement2 = `    servePhpFile(path.join(process.cwd(), 'play_torrent.php'), res, {
        '<?php echo htmlspecialchars($name); ?>': name,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '{{STREAM_URL}}': stream_url,
        '{{NAME}}': name
    });
});

app.get('/play_media.html', (req, res) => {`;

code = code.replace(target2, replacement2);

fs.writeFileSync('server.ts', code);
console.log("Fixed server routing syntax again.");
