const localtunnel = require('localtunnel');

(async () => {
  console.log('Requesting public HTTPS tunnel URL for port 3000...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    console.log(`[PUBLIC LIVE URL] ${tunnel.url}`);

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });
  } catch (err) {
    console.error('[Tunnel Error]', err.message);
  }
})();
