const { execFile } = require('child_process');
const path = require('path');

const ytdlpBin = path.join(__dirname, 'bin', 'ytdlp.exe');
const videoUrl = 'https://youtu.be/P3Lq_iFeYF0?si=5hV88RcGf46ssQb8';

execFile(ytdlpBin, ['-g', '-f', 'best', videoUrl], (error, stdout, stderr) => {
    if (error) {
        console.error('Exec error:', error.message);
        console.error('Stderr:', stderr);
        return;
    }
    console.log('SUCCESS DIRECT STREAM URL WITH -f best:');
    console.log(stdout.trim());
});
