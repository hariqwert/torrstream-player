const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9246;

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
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 2,
            method: 'Runtime.evaluate',
            params: {
              awaitPromise: true,
              expression: `
                (async () => {
                  switchTab('anime');
                  await switchAnimeScheduleDay('today');
                  
                  const animeView = document.getElementById('view-anime');
                  const children = Array.from(animeView.children).map(c => c.id || c.className.substring(0, 30));
                  
                  const schedGrid = document.getElementById('animeScheduleGrid');
                  const schedCardCount = schedGrid ? schedGrid.children.length : -1;

                  return JSON.stringify({
                    animeSectionOrder: children,
                    scheduleCardCount: schedCardCount
                  });
                })()
              `
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 2) {
          console.log('\nANIME SECTION ORDER AND SCHEDULER TEST RESULT:\n', data.result?.result?.value);
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
