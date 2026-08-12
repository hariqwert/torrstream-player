const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /\/\/ Async load posters and backdrops[\s\S]*?\}\s*\}\s*\}\s*function loadAnimeHomeData/g;

// I'll rewrite this part to use an IntersectionObserver.

const newLogic = `
    }
    
    // Lazy load images using IntersectionObserver
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    obs.unobserve(entry.target);
                    // Load this timeline's images with a slight delay
                    const tlId = entry.target.dataset.tlId;
                    const containerId = entry.target.dataset.containerId;
                    const tl = timelinesArray.find(t => t.id === tlId);
                    if (tl) {
                        // Fetch Backdrop
                        if (tl.backdropSource) {
                            fetchTMDB(tl.backdropSource).then(data => {
                                if (data && data.backdrop_path) {
                                    const backdropImg = document.getElementById(\`\${containerId}-backdrop-\${tl.id}\`);
                                    if (backdropImg) backdropImg.src = \`https://image.tmdb.org/t/p/w1280\${data.backdrop_path}\`;
                                } else if (data && data.poster_path) {
                                    const backdropImg = document.getElementById(\`\${containerId}-backdrop-\${tl.id}\`);
                                    if (backdropImg) backdropImg.src = \`https://image.tmdb.org/t/p/w1280\${data.poster_path}\`;
                                }
                            }).catch(e => {});
                        }
                        
                        // Fetch Posters sequentially to avoid flooding
                        let index = 0;
                        const fetchNext = () => {
                            if (index >= tl.items.length) return;
                            const item = tl.items[index];
                            fetchTMDB(\`\${item.tmdbType}/\${item.id}\`).then(data => {
                                if (data && data.poster_path) {
                                    const img = document.getElementById(\`\${containerId}-poster-\${item.id}-\${index}\`);
                                    if (img) img.src = \`https://image.tmdb.org/t/p/w400\${data.poster_path}\`;
                                }
                                index++;
                                setTimeout(fetchNext, 100); // 100ms delay between items
                            }).catch(e => {
                                index++;
                                setTimeout(fetchNext, 100);
                            });
                        };
                        fetchNext();
                    }
                }
            });
        }, { rootMargin: '200px' });
        
        // Add observation target to the container html
        for (const tl of timelinesArray) {
            const el = document.getElementById(\`\${containerId}-backdrop-\${tl.id}\`);
            if (el) {
                const parent = el.closest('.bg-gradient-to-r');
                if (parent) {
                    parent.dataset.tlId = tl.id;
                    parent.dataset.containerId = containerId;
                    observer.observe(parent);
                }
            }
        }
    }
}

`;

html = html.replace(/\/\/ Async load posters and backdrops[\s\S]*?\}\s*\}\s*\}/, newLogic.trim());
fs.writeFileSync('consumet.html', html);
