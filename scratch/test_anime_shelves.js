const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9233;

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
                  await loadAnimeCatalog();
                  const shelfIds = [
                    'animeTop10Shelf',
                    'animeTrendingShelf',
                    'animeShonenShelf',
                    'animeTopRatedShelf',
                    'animeIsekaiShelf',
                    'animeFightingShelf',
                    'animeCozySliceShelf',
                    'animeMechaShelf',
                    'animeSportsShelf',
                    'animeClassicsVaultShelf'
                  ];
                  const counts = {};
                  shelfIds.forEach(id => {
                    const el = document.getElementById(id);
                    counts[id] = el ? el.children.length : -1;
                  });
                  return counts;
                })()
              `
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 2) {
          console.log('\nAWAITED ANIME SHELVES COUNT RESULT:', JSON.stringify(data.result?.result?.value, null, 2));
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
