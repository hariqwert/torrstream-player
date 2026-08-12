const { spawn } = require('child_process');
const http = require('http');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9223;

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
    console.log('Target tab:', pageTab);

    if (pageTab) {
      const wsUrl = pageTab.webSocketDebuggerUrl;
      const ws = new globalThis.WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Connected to DevTools WebSocket via native WebSocket');
        ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));

        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 4,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                JSON.stringify({
                  activeTab: typeof activeTab !== 'undefined' ? activeTab : null,
                  searchPaletteHidden: document.getElementById('searchPalette')?.classList.contains('hidden'),
                  searchPaletteFlex: document.getElementById('searchPalette')?.classList.contains('flex'),
                  top10ShelfItems: document.getElementById('top10Shelf')?.children.length || 0,
                  trendingMoviesShelfItems: document.getElementById('trendingMoviesShelf')?.children.length || 0,
                  trendingSeriesShelfItems: document.getElementById('trendingSeriesShelf')?.children.length || 0,
                  animeShelfItems: document.getElementById('animeShelf')?.children.length || 0,
                  hollywoodShelfItems: document.getElementById('hollywoodShelf')?.children.length || 0,
                  scifiShelfItems: document.getElementById('scifiShelf')?.children.length || 0,
                  animeTop10ShelfItems: document.getElementById('animeTop10Shelf')?.children.length || 0,
                  animeTrendingShelfItems: document.getElementById('animeTrendingShelf')?.children.length || 0
                })
              `
            }
          }));
        }, 3000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Console.messageAdded') {
          console.log('CONSOLE LOG:', data.params.message.text);
        } else if (data.method === 'Runtime.consoleAPICalled') {
          console.log('CONSOLE API:', data.params.type, data.params.args.map(a => a.value || a.description));
        } else if (data.method === 'Runtime.exceptionThrown') {
          console.error('JS EXCEPTION THROWN:', JSON.stringify(data.params.exceptionDetails, null, 2));
        } else if (data.id === 4) {
          console.log('\nEVALUATION RESULT:', data.result?.result?.value);
          ws.close();
          chromeProcess.kill();
          process.exit(0);
        }
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
      };
    }
  } catch(e) {
    console.error('Error connecting to browser DevTools:', e);
    chromeProcess.kill();
  }
}, 2000);
