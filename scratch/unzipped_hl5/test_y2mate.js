const axios = require('axios');
const qs = require('querystring');

async function testY2Mate(videoId) {
    try {
        console.log('Testing Y2Mate API for video:', videoId);
        const analyzeUrl = 'https://www.y2mate.com/mates/analyzeV2/ajax';
        const analyzeRes = await axios.post(analyzeUrl, qs.stringify({
            k_query: `https://www.youtube.com/watch?v=${videoId}`,
            k_type: 'videos',
            q_auto: 0,
            ajax: 1
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        console.log('Analyze Status:', analyzeRes.data.status);
        if (analyzeRes.data && analyzeRes.data.links && analyzeRes.data.links.mp4) {
            const mp4Keys = Object.keys(analyzeRes.data.links.mp4);
            console.log('Available MP4 Formats:', mp4Keys);
            const firstFormat = analyzeRes.data.links.mp4[mp4Keys[0]];
            console.log('Selected Format Key:', firstFormat.k);

            const convertUrl = 'https://www.y2mate.com/mates/convertV2/index';
            const convertRes = await axios.post(convertUrl, qs.stringify({
                vid: videoId,
                k: firstFormat.k
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            console.log('Convert Status:', convertRes.data.status);
            console.log('Direct Download URL:', convertRes.data.dlink);
            return convertRes.data.dlink;
        }
    } catch (e) {
        console.error('Y2Mate Error:', e.message);
    }
}

testY2Mate('P3Lq_iFeYF0');
