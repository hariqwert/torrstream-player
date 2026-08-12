const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. ADD handleModalClose FUNCTION DEFINITION IN JAVASCRIPT
const handleModalCloseDef = `
// Universal Modal Closer & Cleanup Engine
function handleModalClose(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    if (window.lenis && typeof window.lenis.start === 'function') window.lenis.start();

    if (modal.id === 'detailsModal') {
        const trailerBgIframe = document.getElementById('trailerBgIframe');
        if (trailerBgIframe) trailerBgIframe.src = '';
        const trailerBgContainer = document.getElementById('trailerBgContainer');
        if (trailerBgContainer) {
            trailerBgContainer.classList.add('opacity-0');
            trailerBgContainer.style.opacity = '0';
        }
        const detailsTrailerControls = document.getElementById('detailsTrailerControls');
        if (detailsTrailerControls) detailsTrailerControls.classList.add('hidden');
        const detailBackdrop = document.getElementById('detailBackdrop');
        if (detailBackdrop) detailBackdrop.style.opacity = '1';
    }
}
`;

// Insert handleModalClose right before closeDetailsModal
const closeDetailsIdx = html.indexOf('function closeDetailsModal()');
if (closeDetailsIdx !== -1) {
    html = html.substring(0, closeDetailsIdx) + handleModalCloseDef + '\n\n' + html.substring(closeDetailsIdx);
    console.log('Successfully added handleModalClose function definition!');
} else {
    console.error('FAILED to find closeDetailsModal boundary!');
}

// 2. SUPPRESS TAILWIND PRODUCTION WARNING IN BROWSER CONSOLE
const tailwindWarningSuppress = `
<script>
// Suppress Tailwind Play CDN production notice in console
if (typeof console !== 'undefined' && console.warn) {
    const origWarn = console.warn;
    console.warn = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('cdn.tailwindcss.com should not be used in production')) {
            return;
        }
        origWarn.apply(console, args);
    };
}
</script>
`;

const tailwindScriptTag = '<script src="https://cdn.tailwindcss.com"></script>';
if (html.includes(tailwindScriptTag) && !html.includes('cdn.tailwindcss.com should not be used in production')) {
    html = html.replace(tailwindScriptTag, tailwindWarningSuppress + '\n' + tailwindScriptTag);
    console.log('Successfully added Tailwind console warning suppressor!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with modal error fix!');
