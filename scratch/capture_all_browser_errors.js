const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9226;

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
        ws.send(JSON.stringify({ id: 1, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 4, method: 'Page.enable' }));

        // Reload page to capture startup errors
        ws.send(JSON.stringify({ id: 5, method: 'Page.reload' }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.method === 'Runtime.exceptionThrown') {
          console.error('\n--> BROWSER RUNTIME EXCEPTION:', JSON.stringify(data.params.exceptionDetails, null, 2));
        } else if (data.method === 'Console.messageAdded') {
          console.log('\n--> CONSOLE MESSAGE:', data.params.message.level, data.params.message.text);
        } else if (data.method === 'Log.entryAdded') {
          console.log('\n--> LOG ENTRY:', data.params.entry.level, data.params.entry.text);
        }
      };

      setTimeout(() => {
        ws.close();
        chromeProcess.kill();
        process.exit(0);
      }, 5000);
    }
  } catch(e) {
    console.error('Error:', e);
    chromeProcess.kill();
  }
}, 2000);
