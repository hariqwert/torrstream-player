import { spawn } from 'child_process';

const urlStr = 'http://127.0.0.1:8090/stream?link=5b3e623f443bb241ff978cd4f42418b20494cc01&index=1&play=1';
const startTime = '0'; // seconds
const mode = 'transcode';

let pipelineArgs = [
    'curlhttpsrc', `location=${urlStr}`
];

if (startTime && startTime !== '0') {
    // Actually curlhttpsrc has no property for seeking... wait!
    // GStreamer seeking in pipeline is tricky via CLI unless we use something like `playbin` or `gst-play-1.0` or write a python script.
    // However, if we just want to replace ffmpeg entirely, we can use a small python or node script using node-gstreamer-superficial? No.
    // wait, we can just pass python script? Or just accept that seek won't work in CLI without a custom app, 
    // OR we can pass Range header in curl! `extra-headers="Range: bytes=..."` ? No, we need time-based seek.
    // wait, `uridecodebin` has no seek. 
}

console.log(pipelineArgs);
