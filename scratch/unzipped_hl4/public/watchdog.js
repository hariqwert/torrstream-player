(function() {
    if (window.__maintenanceWatchdogActive) return;
    window.__maintenanceWatchdogActive = true;

    // Detect if current page is the official server-rendered 503 Maintenance / Offline page
    function checkIs503Page() {
        var title = document.title || '';
        if (title.indexOf('Maintenance Mode') !== -1 || title.indexOf('System Offline') !== -1) {
            return true;
        }
        return false;
    }

    var is503Page = checkIs503Page();

    async function checkStatus() {
        try {
            var currentPath = (window.location.pathname || '/') + (window.location.search || '');
            // Never trigger reload on Hari Admin Console
            if (document.cookie.indexOf('admin_auth=') !== -1) return;

            var res = await fetch('/api/system/public-status?page=' + encodeURIComponent(currentPath), {
                cache: 'no-store',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });
            var data = await res.json();
            if (data && typeof data.maintenance === 'boolean') {
                if (!is503Page && data.maintenance) {
                    console.log('[Watchdog] Maintenance Mode activated! Reloading to show full Maintenance Page...');
                    window.location.reload();
                } else if (is503Page && !data.maintenance) {
                    console.log('[Watchdog] Maintenance Mode deactivated! Reloading to restore Stalker Pro Portal...');
                    window.location.reload();
                }
            }
        } catch(e) {}
    }

    // Intercept fetch calls to catch 503 responses immediately
    var _origFetch = window.fetch;
    if (_origFetch) {
        window.fetch = async function() {
            try {
                var res = await _origFetch.apply(this, arguments);
                if (res && res.status === 503 && !is503Page && document.cookie.indexOf('admin_auth=') === -1) {
                    window.location.reload();
                }
                return res;
            } catch(err) {
                throw err;
            }
        };
    }

    // Intercept XHR calls (e.g. HLS.js or video requests) to catch 503 responses immediately
    var _origXSend = XMLHttpRequest.prototype.send;
    if (_origXSend) {
        XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', function() {
                if (this.status === 503 && !is503Page && document.cookie.indexOf('admin_auth=') === -1) {
                    console.log('[Watchdog] 503 detected on XHR request! Reloading page...');
                    window.location.reload();
                }
            });
            return _origXSend.apply(this, arguments);
        };
    }

    setInterval(checkStatus, 1000);
    checkStatus();
})();
