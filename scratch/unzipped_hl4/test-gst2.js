const { spawn } = require('child_process');
const urlStr = 'http://127.0.0.1:8090/stream?link=5b3e623f443bb241ff978cd4f42418b20494cc01&index=1&play=1';

const gstArgs = [
    'curlhttpsrc', `location=${urlStr}`,
    '!', 'decodebin', 'name=dec',
    'dec.', '!', 'queue', '!', 'videoconvert', '!', 'x264enc', 'tune=zerolatency', 'speed-preset=ultrafast', '!', 'h264parse', '!', 'mux.',
    'dec.', '!', 'queue', '!', 'audioconvert', '!', 'audioresample', '!', 'voaacenc', '!', 'aacparse', '!', 'mux.',
    'mp4mux', 'name=mux', 'streamable=true', 'fragment-duration=100', '!', 'fdsink', 'fd=1'
];

const gst = spawn('gst-launch-1.0', gstArgs);

gst.stdout.on('data', (d) => console.log('STDOUT bytes:', d.length));
gst.stderr.on('data', (d) => console.log('STDERR:', d.toString()));
setTimeout(() => gst.kill(), 5000);
