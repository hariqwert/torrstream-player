const localtunnel = require('localtunnel');

(async () => {
  console.log('Requesting public HTTPS tunnel URL for port 3000...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    console.log(`\n====================================================`);
    console.log(`🌍 PUBLIC LIVE URL: ${tunnel.url}`);
    console.log(`====================================================\n`);

    tunnel.on('close', () => {
      console.log('Public HTTPS tunnel closed.');
    });
  } catch (err) {
    console.error('Error starting public tunnel:', err);
  }
})();
