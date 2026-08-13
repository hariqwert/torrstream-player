const axios = require('axios');

async function testEndpoint() {
    try {
        console.log('Testing download endpoint for user link...');
        const res = await axios.get('http://localhost:3000/api/v1/youtube/download?v=https://youtu.be/P3Lq_iFeYF0?si=5hV88RcGf46ssQb8');
        console.log('API RESPONSE:', JSON.stringify(res.data, null, 2));

        console.log('\nTesting stream endpoint redirect...');
        const streamRes = await axios.get('http://localhost:3000/api/v1/youtube/stream?v=P3Lq_iFeYF0&type=mp4', { maxRedirects: 0, validateStatus: () => true });
        console.log('STREAM STATUS:', streamRes.status);
        console.log('STREAM REDIRECT LOCATION:', streamRes.headers.location);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testEndpoint();
