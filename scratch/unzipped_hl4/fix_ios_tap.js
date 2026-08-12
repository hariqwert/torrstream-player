const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const injection = `
        // Fix iOS Double-Tap Hover Issue
        document.addEventListener('touchstart', function(e) {
            const clickableCard = e.target.closest('[onclick]');
            if (clickableCard && !clickableCard.dataset.touchFixed) {
                clickableCard.dataset.touchFixed = 'true';
                clickableCard.addEventListener('touchend', function(te) {
                    if (!window.isScrolling) {
                        // Let native click happen, or force it if it's a known card
                        // Actually, just removing hover classes or triggering click
                    }
                });
            }
        });
`;
