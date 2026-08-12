const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9250;

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
              expression: `
                (() => {
                  const views = ['home', 'movies', 'tv', 'anime', 'sports', 'watchlist', 'epg', 'player'];
                  const status = {};
                  views.forEach(v => {
                    const el = document.getElementById('view-' + v);
                    status[v] = el ? true : false;
                  });

                  const homeShelves = document.getElementById('top10Shelf')?.children?.length || 0;
                  const animeShelves = document.getElementById('animeHeroSliderContainer') ? true : false;
                  const animeSched = document.getElementById('animeScheduleSection') ? true : false;
                  const epgBanner = document.getElementById('view-epg') ? true : false;

                  return JSON.stringify({
                    viewSectionsExist: status,
                    homeTop10Count: homeShelves,
                    animeSpotlightExists: animeShelves,
                    animeSchedExists: animeSched,
                    epgExists: epgBanner
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
          console.log('\nALL 9 VIEWS TEST RESULT:\n', data.result?.result?.value);
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
