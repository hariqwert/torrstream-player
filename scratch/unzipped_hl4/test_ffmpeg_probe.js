const { spawn } = require('child_process');

function getVideoDuration(url) {
    return new Promise((resolve) => {
        const ffprobe = spawn('ffprobe', [
            '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            url
        ]);
        let out = '';
        ffprobe.stdout.on('data', d => out += d);
        ffprobe.on('close', () => {
            resolve(parseFloat(out) || 0);
        });
    });
}
// We can't really test with TorrServer since we don't have a magnet link ready.
// Let's just exit.
