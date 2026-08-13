const fs = require('fs');

const filesToPatch = [
    'consumet.html',
    'books.html',
    'music.html',
    'hero.html',
    'play_media.html',
    'sample_maintenance.html',
    'index.php',
    'play.php',
    'play_consumet.php',
    'login.php'
];

const watchdogScript = `<script id="maintenance-watchdog">
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

filesToPatch.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        if (!content.includes('maintenance-watchdog')) {
            if (content.includes('</body>')) {
                content = content.replace('</body>', watchdogScript + '\n</body>');
            } else {
                content += '\n' + watchdogScript;
            }
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Patched ${file}`);
        } else {
            console.log(`Already patched ${file}`);
        }
    }
});
