const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

// 1. Add /api/system/public-status to bypass list in firewall middleware if not present
if (!code.includes("req.path === '/api/system/public-status'")) {
    code = code.replace(
        /req\.path === '\/api\/music\/proxy' \|\|/g,
        `req.path === '/api/music/proxy' ||\n            req.path === '/api/system/public-status' ||`
    );
}

// 2. Add /api/system/public-status endpoint
if (!code.includes("app.get('/api/system/public-status'")) {
    const endpointCode = `
app.get('/api/system/public-status', (req: Request, res: Response) => {
    const targetPage = (req.query.page as string) || req.headers.referer || '/';
    let urlPath = targetPage;
    try {
        if (targetPage.startsWith('http')) {
            urlPath = new URL(targetPage).pathname;
        }
    } catch(e) {}

    let isSpecific = false;
    if (systemState.consumetMaintenance && (urlPath === '/consumet.html' || urlPath === '/consumet' || urlPath === '/')) isSpecific = true;
    if (systemState.playMaintenance && urlPath === '/play.php') isSpecific = true;
    if (systemState.playConsumetMaintenance && urlPath === '/play_consumet.php') isSpecific = true;

    const isMaintenance = systemState.status === 'offline' || systemState.status === 'killed' || systemState.maintenanceMode || isSpecific;

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
        status: "success",
        maintenance: isMaintenance,
        systemStatus: systemState.status,
        maintenanceMode: systemState.maintenanceMode,
        consumetMaintenance: systemState.consumetMaintenance,
        playMaintenance: systemState.playMaintenance,
        playConsumetMaintenance: systemState.playConsumetMaintenance
    });
});
`;
    code = code.replace("app.get('/api/live_events'", endpointCode + "\napp.get('/api/live_events'");
}

// 3. Inject watchdog script into servePhpFile
if (!code.includes('maintenance-watchdog')) {
    const watchdogScriptTag = `<script id="maintenance-watchdog">
(function() {
    if (window.__maintenanceWatchdogActive) return;
    window.__maintenanceWatchdogActive = true;

    var is503Page = !!(document.title && (document.title.includes('Maintenance Mode') || document.title.includes('System Offline'))) ||
                      !!document.getElementById('startOverlay');

    async function checkStatus() {
        try {
            var currentPath = window.location.pathname || '/';
            var res = await fetch('/api/system/public-status?page=' + encodeURIComponent(currentPath), {
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            var data = await res.json();
            if (data && typeof data.maintenance === 'boolean') {
                if (!is503Page && data.maintenance) {
                    window.location.reload();
                } else if (is503Page && !data.maintenance) {
                    window.location.reload();
                }
            }
        } catch(e) {}
    }

    if (!is503Page) {
        var _origFetch = window.fetch;
        if (_origFetch) {
            window.fetch = async function() {
                try {
                    var res = await _origFetch.apply(this, arguments);
                    if (res && res.status === 503) {
                        window.location.reload();
                    }
                    return res;
                } catch(err) {
                    throw err;
                }
            };
        }
    }

    setInterval(checkStatus, 1200);
})();
</script>`;

    code = code.replace(
        /res\.setHeader\('Content-Type', 'text\/html'\);\s*res\.send\(content\);/g,
        `res.setHeader('Content-Type', 'text/html');
    if (content.includes('</body>')) {
        content = content.replace('</body>', \`${watchdogScriptTag}\\n</body>\`);
    } else {
        content += \`${watchdogScriptTag}\`;
    }
    res.send(content);`
    );

    // Also inject watchdog script into the 503 HTML string in server.ts
    code = code.replace(
        /<canvas id="fullscreenVisualizerCanvas" class="w-full h-full opacity-50"><\/canvas>\s*<\/div>\s*<\/body>/g,
        `<canvas id="fullscreenVisualizerCanvas" class="w-full h-full opacity-50"></canvas>
        </div>
        ${watchdogScriptTag}
    </body>`
    );
}

fs.writeFileSync('server.ts', code);
console.log('server.ts patched with public status and watchdog');
