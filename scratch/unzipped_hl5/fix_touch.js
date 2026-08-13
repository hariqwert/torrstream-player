const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const target = `                // If it was a tap (not a drag/scroll)
                if (Math.abs(touchEndY - touchStartY) < 10 && Math.abs(touchEndX - touchStartX) < 10) {
                    const card = e.target.closest('.group[onclick], .cursor-pointer[onclick]');
                    if (card) {
                        e.preventDefault(); // Stop iOS from turning tap into hover
                        card.click(); // Force the click
                    }
                }`;

const replacement = `                // If it was a tap (not a drag/scroll)
                if (Math.abs(touchEndY - touchStartY) < 10 && Math.abs(touchEndX - touchStartX) < 10) {
                    let target = e.target;
                    while (target && target !== document.body) {
                        if (target.onclick || target.getAttribute('onclick') || target.classList.contains('cursor-pointer')) {
                            e.preventDefault(); // Stop iOS from turning tap into hover
                            target.click(); // Force the click
                            break;
                        }
                        target = target.parentElement;
                    }
                }`;

html = html.replace(target, replacement);
fs.writeFileSync('consumet.html', html);
