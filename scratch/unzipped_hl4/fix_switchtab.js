const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const newSwitchTab = `        function switchTab(tab) {
            // Automatically close open details modals and stop trailers when switching tabs/pages
            if (typeof closeDetailsModal === 'function') {
                closeDetailsModal();
            }
            activeTab = tab;
            const views = ['home', 'movies', 'tv', 'anime', 'sports', 'channels', 'watchlist', 'search', 'player', 'epg'];
            
            document.querySelectorAll('.nav-link').forEach(btn => {
                btn.classList.remove('active-tab', 'text-white', 'font-semibold', 'after:absolute', 'after:-bottom-1', 'after:left-0', 'after:right-0', 'after:h-0.5', 'after:bg-white');
                btn.classList.add('text-zinc-400', 'font-medium');
            });
            
            views.forEach(v => {
                const el = document.getElementById(\`view-\${v}\`);
                if (el) el.classList.add('hidden');
            });
            
            const activeEl = document.getElementById(\`view-\${tab}\`);
            if (activeEl) activeEl.classList.remove('hidden');
            
            const tabBtn = document.getElementById('tab-' + tab);
            if (tabBtn) {
                tabBtn.classList.remove('text-zinc-400', 'font-medium');
                tabBtn.classList.add('active-tab', 'text-white', 'font-semibold', 'after:absolute', 'after:-bottom-1', 'after:left-0', 'after:right-0', 'after:h-0.5', 'after:bg-white');
            }
            
            // Re-run specific data loaders if switching back to empty views`;

html = html.replace(/function switchTab\(tab\) \{[\s\S]*?\/\/ Re-run specific data loaders if switching back to empty views/, newSwitchTab);

fs.writeFileSync('consumet.html', html, 'utf8');
