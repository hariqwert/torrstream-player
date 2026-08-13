const axios = require('axios');
async function test() {
    try {
        const req = await axios.get('https://logic.icelanders.st/embed/sky-sports-main-event', {
            headers: {
                'Referer': 'https://timstreams.st/'
            }
        });
        console.log(req.data.substring(0, 1000));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
