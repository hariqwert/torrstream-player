const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const script = `
        // Fix iOS/Mobile Touch Double-Tap Hover Issue
        let touchStartY = 0, touchStartX = 0;
        document.addEventListener('touchstart', (e) => {
            if(e.touches && e.touches.length > 0) {
                touchStartY = e.touches[0].clientY;
                touchStartX = e.touches[0].clientX;
            }
        }, {passive: true});

        document.addEventListener('touchend', (e) => {
            if(e.changedTouches && e.changedTouches.length > 0) {
                const touchEndY = e.changedTouches[0].clientY;
                const touchEndX = e.changedTouches[0].clientX;
                // If it was a tap (not a drag/scroll)
                if (Math.abs(touchEndY - touchStartY) < 10 && Math.abs(touchEndX - touchStartX) < 10) {
                    const card = e.target.closest('.group[onclick], .cursor-pointer[onclick]');
                    if (card) {
                        e.preventDefault(); // Stop iOS from turning tap into hover
                        card.click(); // Force the click
                    }
                }
            }
        }, {passive: false});
`;

html = html.replace('// Run On Start', script + '\n        // Run On Start');
fs.writeFileSync('consumet.html', html);
