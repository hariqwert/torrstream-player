const { spawn } = require('child_process');
const ffmpeg = spawn('ffmpeg', [
    '-loglevel', 'error',
    '-ss', '10',
    '-i', 'http://ftp.nluug.nl/pub/graphics/blender/demo/movies/BBB/BBB_1080p_mp4.mp4',
    '-f', 'null', '-'
]);
ffmpeg.stderr.on('data', d => console.error(d.toString()));
ffmpeg.on('close', code => console.log('Exited', code));
