const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9272;

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

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (() => {
                  const fnExists = typeof loadHomeSpotlight === 'function';
                  const slidesLen = spotlightSlides ? spotlightSlides.length : 0;
                  return JSON.stringify({
                    hasLoadHomeSpotlight: fnExists,
                    slidesCount: slidesLen
                  });
                })()
              `
            }
          }));
        }, 2500);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 2) {
          console.log('\nLOAD HOME SPOTLIGHT TEST RESULT:\n', data.result?.result?.value);
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
