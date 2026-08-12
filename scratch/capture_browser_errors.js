const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9274;

const chromeProcess = spawn(edgePath, [
  '--headless',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  'file:///c:/Users/HP/Documents/antigravity/brave-maxwell/consumet.html'
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
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `window.__pageErrors || []`
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Runtime.exceptionThrown') {
          console.log('\nEXCEPTION THROWN:', JSON.stringify(data.params.exceptionDetails, null, 2));
        }
        if (data.id === 3) {
          console.log('\nEVAL RESULT:', data.result);
          setTimeout(() => {
            ws.close();
            chromeProcess.kill();
            process.exit(0);
          }, 1000);
        }
      };
    }
  } catch(e) {
    console.error('Error:', e);
    chromeProcess.kill();
  }
}, 2000);
