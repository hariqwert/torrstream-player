const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9227;

const chromeProcess = spawn(edgePath, [
  '--headless',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  'http://localhost:3000/consumet.html'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch(`http://localhost:${port}/json/list`);
    const tabs = await listRes.json();
    const pageTab = tabs.find(t => t.url.includes('consumet.html'));

    if (pageTab) {
      const wsUrl = pageTab.webSocketDebuggerUrl;
      const ws = new globalThis.WebSocket(wsUrl);

      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Network.enable' }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Network.responseReceived') {
          const res = data.params.response;
          if (res.status >= 400) {
            console.log('NETWORK ERROR 400+:', res.status, res.url);
          }
        }
      };

      setTimeout(() => {
        ws.close();
        chromeProcess.kill();
        process.exit(0);
      }, 4000);
    }
  } catch(e) {
    console.error('Error:', e);
    chromeProcess.kill();
  }
}, 2000);
