const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Define loadHomeSpotlight function
const loadHomeSpotlightDef = `
// Home Hero Spotlight Fetcher & Slider Manager
let spotlightSlides = [];
let currentSlideIndex = 0;

async function loadHomeSpotlight() {
    try {
        const data = await fetchTMDB('trending/all/day');
        if (data && data.results && data.results.length > 0) {
            spotlightSlides = data.results.slice(0, 10);
            renderSpotlightSlider(0);
            if (window.spotlightAutoInterval) clearInterval(window.spotlightAutoInterval);
            window.spotlightAutoInterval = setInterval(() => {
                if (activeTab === 'home' && spotlightSlides.length > 0) {
                    const nextIdx = (currentSlideIndex + 1) % spotlightSlides.length;
                    renderSpotlightSlider(nextIdx);
                }
            }, 8000);
        }
    } catch(e) {
        console.error("Failed to load Home Spotlight", e);
    }
}
`;

// Insert loadHomeSpotlightDef right before renderSpotlightSlider
const renderSpotlightIdx = html.indexOf('function renderSpotlightSlider');
if (renderSpotlightIdx !== -1) {
    html = html.substring(0, renderSpotlightIdx) + loadHomeSpotlightDef + '\n\n' + html.substring(renderSpotlightIdx);
    console.log('Successfully added loadHomeSpotlight function definition!');
} else {
    console.error('FAILED to find renderSpotlightSlider boundary!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with loadHomeSpotlight fix!');
