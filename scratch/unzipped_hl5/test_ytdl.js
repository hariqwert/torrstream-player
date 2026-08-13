const ytdl = require('@distube/ytdl-core');

async function testYtdl() {
    try {
        console.log('Testing @distube/ytdl-core for P3Lq_iFeYF0...');
        const info = await ytdl.getInfo('P3Lq_iFeYF0');
        console.log('SUCCESS! Title:', info.videoDetails.title);
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        console.log('Direct MP4 Stream URL:', format.url);
    } catch (e) {
        console.error('ytdl error:', e.message);
    }
}

testYtdl();
