const axios = require('axios');
async function run() {
    const doubleProxied = 'http://localhost:3000/live.php?id=' + encodeURIComponent('http://localhost:3000/live.php?token=STALKER_PRO&id=https://logic.icelanders.st/embed/abc-usa&m3u=1');
    const r = await axios.get(doubleProxied);
    console.log(r.data);
}
run();
