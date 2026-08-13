const localtunnel = require('localtunnel');

async function startTunnel() {
  console.log('Requesting public HTTPS tunnel URL for port 3000...');
  try {
    const tunnel = await localtunnel({ port: 3000 });
    console.log(`\n====================================================`);
    console.log(`🌍 PUBLIC LIVE URL: ${tunnel.url}`);
    console.log(`====================================================\n`);

    tunnel.on('close', () => {
      console.log('Public HTTPS tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });
    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err?.message || err);
      try { tunnel.close(); } catch(e) {}
    });
  } catch (err) {
    console.error('Error starting public tunnel:', err?.message || err);
    setTimeout(startTunnel, 3000);
  }
}

startTunnel();
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Tunnel Exception]', err?.message || err);
  setTimeout(startTunnel, 3000);
});
