const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9273;

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
                (async () => {
                  try {
                    // Test 1: openDetails
                    openDetails(19995, 'movie');
                    await new Promise(r => setTimeout(r, 1000));
                    const detailsModalHidden = document.getElementById('detailsModal').classList.contains('hidden');
                    const titleText = document.getElementById('detailTitle').textContent;
                    closeDetailsModal();

                    // Test 2: launchTabSearch
                    await launchTabSearch('Avatar');
                    await new Promise(r => setTimeout(r, 1500));
                    const searchViewHidden = document.getElementById('view-search').classList.contains('hidden');
                    const searchGridChildren = document.getElementById('searchGrid').children.length;

                    return JSON.stringify({
                      detailsOpened: !detailsModalHidden,
                      titleText,
                      searchTabOpened: !searchViewHidden,
                      searchResultCards: searchGridChildren,
                      success: true
                    });
                  } catch(e) {
                    return JSON.stringify({ success: false, error: e.message });
                  }
                })()
              `,
              awaitPromise: true
            }
          }));
        }, 2000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.id === 2) {
          console.log('\nGRID CLICK & SEARCH TEST RESULT:\n', data.result?.result?.value);
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
