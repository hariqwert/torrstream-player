const http = require('http');

http.get('http://localhost:3000/stalker_pro_logo.png', (res) => {
  console.log('Logo URL Status Code:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
}).on('error', err => {
  console.error('Error fetching logo:', err);
});
