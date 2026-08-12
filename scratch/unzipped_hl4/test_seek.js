const { spawn } = require('child_process');
const fs = require('fs');

const videoArgs = ['-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'zerolatency', '-crf', '24', '-threads', '0', '-pix_fmt', 'yuv420p'];
const audioArgs = ['-c:a', 'aac', '-ac', '2', '-b:a', '128k', '-ar', '44100'];

const ffmpegArgs = [
    '-loglevel', 'warning',
    '-ss', '500',
    '-fflags', '+nobuffer+genpts+discardcorrupt+igndts',
    '-f', 'lavfi', '-i', 'testsrc=duration=1000:size=1280x720:rate=30', 
    ...videoArgs,
    ...audioArgs,
    '-avoid_negative_ts', 'make_zero',
    '-f', 'mp4',
    '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
    'pipe:1'
];

console.log('Spawning ffmpeg...');
const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);
const writeStream = fs.createWriteStream('test_seek.mp4');

ffmpegProcess.stdout.pipe(writeStream);

ffmpegProcess.stderr.on('data', (d) => {
    console.error('[FFmpeg Error]', d.toString());
});

ffmpegProcess.on('close', (code) => {
    console.log('FFmpeg exited with code', code);
});
