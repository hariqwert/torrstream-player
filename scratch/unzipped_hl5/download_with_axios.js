const fs = require('fs');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');

async function downloadVideo() {
    try {
        console.log('Resolving video formats...');
        const info = await ytdl.getInfo('https://youtu.be/P3Lq_iFeYF0?si=5hV88RcGf46ssQb8');
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        console.log('Got stream format URL:', format.url.substring(0, 100) + '...');

        const outputPath = 'C:\\Users\\HP\\Downloads\\Khalifa_Glimpse_P3Lq_iFeYF0.mp4';
        const fileWriter = fs.createWriteStream(outputPath);

        console.log('Downloading video via Axios stream with YouTube headers...');
        const res = await axios({
            method: 'GET',
            url: format.url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Encoding': 'identity',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://www.youtube.com',
                'Referer': 'https://www.youtube.com/'
            }
        });

        res.data.pipe(fileWriter);

        fileWriter.on('finish', () => {
            console.log('\n[SUCCESS] Download completed! File saved at:', outputPath);
            console.log('File Size:', (fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2), 'MB');
            process.exit(0);
        });

    } catch (e) {
        console.error('[AXIOS DOWNLOAD ERROR]', e.response ? e.response.status : e.message);
        process.exit(1);
    }
}

downloadVideo();
