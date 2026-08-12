const http = require('http');

function checkServer() {
  http.get('http://localhost:3000/consumet.html', (res) => {
    console.log('Server status code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Downloaded bytes:', data.length);
      console.log('Includes title:', data.includes('<title>Stalker Cinema | Premium Movie & IPTV Hub</title>'));
    });
  }).on('error', (err) => {
    console.log('Server not currently running on port 3000:', err.message);
  });
}

checkServer();
