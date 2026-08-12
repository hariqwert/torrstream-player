const { spawn } = require('child_process');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9230;
const filePath = 'file:///' + path.join(__dirname, '..', 'consumet.html').replace(/\\/g, '/');

console.log('Testing URL:', filePath);

const chromeProcess = spawn(edgePath, [
  '--headless',
  `--remote-debugging-port=${port}`,
  '--disable-gpu',
  filePath
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
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Console.messageAdded') {
          console.log('CONSOLE MESSAGE:', data.params.message.level, data.params.message.text);
        } else if (data.method === 'Runtime.consoleAPICalled') {
          console.log('CONSOLE API:', data.params.type, data.params.args.map(a => a.value || a.description));
        } else if (data.method === 'Runtime.exceptionThrown') {
          console.error('JS EXCEPTION THROWN:', JSON.stringify(data.params.exceptionDetails, null, 2));
        }
      };

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Runtime.evaluate',
          params: {
            expression: `
              JSON.stringify({
                activeTab: typeof activeTab !== 'undefined' ? activeTab : null,
                top10Items: document.getElementById('top10Shelf')?.children.length || 0,
                trendingMoviesItems: document.getElementById('trendingMoviesShelf')?.children.length || 0,
                searchPaletteHidden: document.getElementById('searchPalette')?.classList.contains('hidden')
              })
            `
          }
        }));
      }, 4000);

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 4) {
          console.log('\nEVAL RESULT ON FILE PROTOCOL:', data.result?.result?.value);
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
