const fs = require('fs');

const watchdogScript = `<script id="maintenance-watchdog">
(function() {
    if (window.__maintenanceWatchdogActive) return;
    window.__maintenanceWatchdogActive = true;

    function createOverlay(data) {
        var existing = document.getElementById('globalMaintenanceOverlay');
        if (existing) return existing;

        var title = (data && data.activeTemplate) || "Maintenance Mode Active";
        var isKilled = data && (data.systemStatus === 'offline' || data.systemStatus === 'killed');
        var badgeText = isKilled ? "SYSTEM LOCKDOWN / OFFLINE" : "MAINTENANCE MODE ACTIVE";
        var descText = isKilled 
            ? "The Stalker Pro network has been completely taken offline by the administrator for deep maintenance or security protocols."
            : "Stalker Pro is currently undergoing scheduled maintenance. Services are temporarily paused until access is restored by the administrator.";

        var overlay = document.createElement('div');
        overlay.id = 'globalMaintenanceOverlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:999999;background:rgba(9,9,11,0.96);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);display:flex;align-items:center;justify-content:center;padding:1.5rem;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#ffffff;box-sizing:border-box;animation:maintFadeIn 0.3s ease-out;';

        overlay.innerHTML = \`
            <style>
                @keyframes maintFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
                @keyframes maintPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.15); } }
            </style>
            <div style="max-width:30rem;width:100%;text-align:center;background:rgba(24,24,27,0.75);border:1px solid rgba(245,158,11,0.3);box-shadow:0 25px 50px -12px rgba(0,0,0,0.8), 0 0 50px rgba(245,158,11,0.12);border-radius:1.75rem;padding:2.5rem 1.75rem;position:relative;overflow:hidden;">
                <!-- Ambient blur -->
                <div style="position:absolute;top:-50px;left:50%;transform:translateX(-50%);width:180px;height:180px;background:rgba(245,158,11,0.18);filter:blur(50px);border-radius:50%;pointer-events:none;"></div>
                
                <!-- Badge -->
                <div style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.4rem 1rem;border-radius:9999px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.3);margin-bottom:1.5rem;">
                    <span style="width:8px;height:8px;border-radius:50%;background:#f59e0b;animation:maintPulse 1.5s infinite ease-in-out;display:inline-block;"></span>
                    <span style="font-size:0.75rem;font-weight:800;letter-spacing:0.1em;color:#fbbf24;text-transform:uppercase;">\${badgeText}</span>
                </div>

                <!-- Icon -->
                <div style="width:4.5rem;height:4.5rem;margin:0 auto 1.5rem auto;border-radius:1.25rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);display:flex;align-items:center;justify-content:center;color:#f59e0b;">
                    <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>

                <!-- Header & Description -->
                <h2 style="font-size:1.65rem;font-weight:800;letter-spacing:-0.02em;margin:0 0 0.75rem 0;color:#ffffff;line-height:1.2;">\${title}</h2>
                <p style="font-size:0.875rem;color:#a1a1aa;line-height:1.6;margin:0 0 1.5rem 0;">\${descText}</p>

                <!-- Status Pill -->
                <div style="background:rgba(9,9,11,0.7);border:1px solid rgba(255,255,255,0.06);border-radius:1rem;padding:0.85rem 1rem;display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;">
                    <div style="display:flex;align-items:center;gap:0.6rem;color:#e4e4e7;font-size:0.8rem;font-weight:600;">
                        <svg width="16" height="16" fill="none" stroke="#a1a1aa" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>System Status</span>
                    </div>
                    <span style="font-size:0.7rem;font-weight:700;color:#f59e0b;letter-spacing:0.05em;text-transform:uppercase;background:rgba(245,158,11,0.15);padding:0.25rem 0.6rem;border-radius:0.5rem;border:1px solid rgba(245,158,11,0.25);">Standby Mode</span>
                </div>

                <!-- Admin Link -->
                <div style="font-size:0.8rem;color:#71717a;">
                    Admin? <a href="/hari.html" style="color:#fbbf24;text-decoration:none;font-weight:700;margin-left:0.25rem;">Open Hari Console &rarr;</a>
                </div>
            </div>
        \`;
        document.body.appendChild(overlay);

        try {
            var vids = document.querySelectorAll('video, audio');
            vids.forEach(function(m) { if (m.pause) m.pause(); });
        } catch(e) {}

        return overlay;
    }

    function removeOverlay() {
        var existing = document.getElementById('globalMaintenanceOverlay');
        if (existing) {
            existing.remove();
        }
    }

    async function checkStatus() {
        try {
            var currentPath = window.location.pathname || '/';
            if (currentPath.includes('hari.html')) {
                removeOverlay();
                return;
            }

            var res = await fetch('/api/system/public-status?page=' + encodeURIComponent(currentPath), {
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            var data = await res.json();
            if (data && typeof data.maintenance === 'boolean') {
                if (data.maintenance) {
                    createOverlay(data);
                } else {
                    removeOverlay();
                }
            }
        } catch(e) {}
    }

    var _origFetch = window.fetch;
    if (_origFetch) {
        window.fetch = async function() {
            try {
                var res = await _origFetch.apply(this, arguments);
                if (res && res.status === 503) {
                    checkStatus();
                }
                return res;
            } catch(err) {
                throw err;
            }
        };
    }

    setInterval(checkStatus, 1000);
    checkStatus();
})();
</script>`;

// Patch HTML/PHP files
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

filesToPatch.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace existing maintenance-watchdog script if present
        if (content.includes('id="maintenance-watchdog"')) {
            content = content.replace(/<script id="maintenance-watchdog">[\s\S]*?<\/script>/g, watchdogScript);
        } else {
            if (content.includes('</body>')) {
                content = content.replace('</body>', watchdogScript + '\n</body>');
            } else {
                content += '\n' + watchdogScript;
            }
        }
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated instant popup watchdog in ${file}`);
    }
});

// Update server.ts
let serverCode = fs.readFileSync('server.ts', 'utf8');

if (serverCode.includes('id="maintenance-watchdog"')) {
    serverCode = serverCode.replace(/<script id="maintenance-watchdog">[\s\S]*?<\/script>/g, watchdogScript);
} else {
    serverCode = serverCode.replace(
        /res\.setHeader\('Content-Type', 'text\/html'\);\s*res\.send\(content\);/g,
        `res.setHeader('Content-Type', 'text/html');
    if (content.includes('</body>')) {
        content = content.replace('</body>', \`${watchdogScript}\\n</body>\`);
    } else {
        content += \`${watchdogScript}\`;
    }
    res.send(content);`
    );
}

fs.writeFileSync('server.ts', serverCode, 'utf8');
console.log('Updated server.ts with instant popup watchdog');

