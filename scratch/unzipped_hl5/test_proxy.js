const axios = require('axios');
axios.get('http://localhost:3000/api/music/proxy?url=https://aac.saavncdn.com/123/test.mp3&download=1').catch(e => console.log(e.response.status, e.response.data));
