const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Replace the main loop in renderEpgBoard with a chunked rendering setup
const renderStartRegex = /sidebarContainer\.innerHTML = '';[\s\S]*?channelCountText\.textContent = window\.epgChannels\.length;/;
html = html.replace(renderStartRegex, `
            sidebarContainer.innerHTML = '';
            timelineBody.innerHTML = '';
            
            window.epgFilteredChannels = window.epgChannels || [];
            channelCountText.textContent = window.epgFilteredChannels.length;
            
            window.epgRenderIndex = 0;
            const CHUNK_SIZE = 30;
            
            window.renderNextEpgChunk = async function() {
                const slice = window.epgFilteredChannels.slice(window.epgRenderIndex, window.epgRenderIndex + CHUNK_SIZE);
                if (slice.length === 0) return;
                
                for (let i = 0; i < slice.length; i++) {
                    const chan = slice[i];
`);

const renderLoopStartRegex = /for \(let i = 0; i < window\.epgChannels\.length; i\+\+\) \{\s+const chan = window\.epgChannels\[i\];/;
html = html.replace(renderLoopStartRegex, ``);

const renderLoopEndRegex = /\/\/ Chunk rendering to avoid browser freeze[\s\S]*?await new Promise\(r => setTimeout\(r, 0\)\);\s+\}\s+\}/;
html = html.replace(renderLoopEndRegex, `
                    // Yield to avoid freeze
                    if (i % 10 === 0) await new Promise(r => setTimeout(r, 0));
                }
                
                window.epgRenderIndex += CHUNK_SIZE;
                
                // If there are more channels, add an IntersectionObserver sentinel
                if (window.epgRenderIndex < window.epgFilteredChannels.length) {
                    const sentinel = document.createElement('div');
                    sentinel.className = 'h-10 w-full shrink-0 flex items-center justify-center';
                    sentinel.innerHTML = '<div class="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>';
                    
                    const tSentinel = document.createElement('div');
                    tSentinel.className = 'h-10 w-full shrink-0';
                    
                    const observer = new IntersectionObserver((entries) => {
                        if (entries[0].isIntersecting) {
                            observer.disconnect();
                            sentinel.remove();
                            tSentinel.remove();
                            window.renderNextEpgChunk();
                        }
                    }, { root: sidebarContainer, rootMargin: '100px' });
                    
                    sidebarContainer.appendChild(sentinel);
                    timelineBody.appendChild(tSentinel);
                    observer.observe(sentinel);
                }
                lucide.createIcons();
            }
            
            await window.renderNextEpgChunk();
`);

const filterRegex = /function filterEpgGrid\(\) \{[\s\S]*?if \(match\) \{[\s\S]*?\}\s+\}\s+\}\)/;
html = html.replace(filterRegex, `
        function filterEpgGrid() {
            const q = document.getElementById('epgSearchInput').value.toLowerCase().trim();
            
            if (q === '') {
                window.epgFilteredChannels = window.epgChannels;
            } else {
                window.epgFilteredChannels = window.epgChannels.filter(chan => {
                    if (chan.name.toLowerCase().includes(q)) return true;
                    
                    const progs = window.epgProgrammesByChannel[chan.id] || [];
                    for (let p of progs) {
                        if (p.title && p.title.toLowerCase().includes(q)) return true;
                    }
                    return false;
                });
            }
            
            const sidebarContainer = document.getElementById('epgSidebarChannels');
            const timelineBody = document.getElementById('epgTimelineBody');
            const channelCountText = document.getElementById('epgChannelCountText');
            
            if (sidebarContainer) sidebarContainer.innerHTML = '';
            if (timelineBody) timelineBody.innerHTML = '';
            if (channelCountText) channelCountText.textContent = window.epgFilteredChannels.length;
            
            window.epgRenderIndex = 0;
            window.renderNextEpgChunk();
`);

fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
