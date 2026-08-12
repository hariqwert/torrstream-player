const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9225;

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
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Runtime.evaluate',
            params: {
              awaitPromise: true,
              expression: `
                fetchTMDB('trending/all/day')
                  .then(res => ({ success: true, count: res.results.length }))
                  .catch(err => ({ success: false, err: err.message }))
              `
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 4) {
          console.log('\nFULL RESULT:', JSON.stringify(data.result, null, 2));
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };
    }
  } catch(e) {
    console.error('Error:', e);
    chromeProcess.kill();
  }
}, 2000);
