const fs = require('fs');
let code = fs.readFileSync('consumet.html', 'utf8');

const target = `                    for (let p of progs) {
                        if (p.title && p.title.toLowerCase().includes(q)) return true;
                    }
                         // Horizontal Mouse Wheel & Drag-to-Scroll for Shelves`;

const replacement = `                    for (let p of progs) {
                        if (p.title && p.title.toLowerCase().includes(q)) return true;
                    }
                    return false;
                });
            }
            
            const cardsGrid = document.getElementById('epgCardsGrid');
            const channelCountText = document.getElementById('epgChannelCountText');
            
            if (cardsGrid) cardsGrid.innerHTML = '';
            if (channelCountText) channelCountText.textContent = window.epgFilteredChannels.length;
            
            window.epgRenderIndex = 0;
            if (window.renderNextEpgChunk) window.renderNextEpgChunk();
        }

        // Enhanced Lenis Smooth Scroll & Interaction Engine
        if (typeof Lenis !== 'undefined') {
            window.lenis = new Lenis({
                duration: 1.1,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
                wheelMultiplier: 0.95,
                touchMultiplier: 1.5,
                infinite: false,
            });

            function rafLenis(time) {
                if (window.lenis) window.lenis.raf(time);
                requestAnimationFrame(rafLenis);
            }
            requestAnimationFrame(rafLenis);
        }

        // Horizontal Mouse Wheel & Drag-to-Scroll for Shelves`;

code = code.replace(target, replacement);
fs.writeFileSync('consumet.html', code);
