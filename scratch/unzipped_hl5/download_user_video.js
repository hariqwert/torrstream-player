const fs = require('fs');
const path = require('path');
const ytdl = require('@distube/ytdl-core');

const videoUrl = 'https://youtu.be/P3Lq_iFeYF0?si=5hV88RcGf46ssQb8';
const outputPath = 'C:\\Users\\HP\\Downloads\\Khalifa_Glimpse_P3Lq_iFeYF0.mp4';

console.log('Downloading video:', videoUrl);
console.log('Saving to:', outputPath);

const stream = ytdl(videoUrl, {
    quality: '18',
    filter: 'videoandaudio'
});

const fileWriter = fs.createWriteStream(outputPath);

let downloadedBytes = 0;

stream.on('data', chunk => {
    downloadedBytes += chunk.length;
    process.stdout.write(`Downloaded: ${(downloadedBytes / (1024 * 1024)).toFixed(2)} MB\r`);
});

stream.pipe(fileWriter);

fileWriter.on('finish', () => {
    console.log('\n[SUCCESS] Download completed! File saved at:', outputPath);
    process.exit(0);
});

stream.on('error', err => {
    console.error('\n[ERROR] Stream download error:', err.message);
    process.exit(1);
});
