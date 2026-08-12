const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// 1. FIX openDetails SYNTAX: Change `function openDetails` to `async function openDetails`
const oldOpenDetails = 'function openDetails(id, type = \'movie\') {';
const newOpenDetails = 'async function openDetails(id, type = \'movie\') {';

if (html.includes(oldOpenDetails)) {
    html = html.replace(oldOpenDetails, newOpenDetails);
    console.log('SUCCESS: Changed function openDetails to async function openDetails!');
} else {
    console.warn('Could not find exact oldOpenDetails string, searching pattern...');
    html = html.replace(/function\s+openDetails\s*\(/, 'async function openDetails(');
    console.log('Pattern replacement applied for openDetails!');
}

// 2. ADD launchTabSearch FUNCTION DEFINITION
const launchTabSearchDef = `
// Tab Search Launcher
async function launchTabSearch(query) {
    if (!query) return;
    switchTab('search');
    const label = document.getElementById('searchQueryLabel');
    if (label) label.textContent = query;
    const grid = document.getElementById('searchGrid');
    if (grid) grid.innerHTML = '<div class="col-span-full py-16 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">Searching catalog for "' + query.replace(/"/g, '&quot;') + '"...</div>';

    try {
        const data = await fetchTMDB('search/multi', { query: query });
        const items = (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
        if (items && items.length > 0) {
            renderFilterGrid(items, 'searchGrid', 'movie');
        } else {
            if (grid) grid.innerHTML = '<div class="col-span-full py-16 text-center text-xs font-bold uppercase tracking-widest text-zinc-400">No matching movies or TV shows found.</div>';
        }
    } catch (e) {
        if (grid) grid.innerHTML = '<div class="col-span-full py-16 text-center text-xs font-bold uppercase tracking-widest text-red-500">Failed to fetch search results. Check network connection.</div>';
    }
}
`;

// Insert launchTabSearchDef right before executeSearch
const executeSearchIdx = html.indexOf('function executeSearch()');
if (executeSearchIdx !== -1) {
    html = html.substring(0, executeSearchIdx) + launchTabSearchDef + '\n\n' + html.substring(executeSearchIdx);
    console.log('SUCCESS: Added launchTabSearch function definition!');
} else {
    console.error('FAILED to find executeSearch boundary!');
}

// 3. ENSURE handleModalOpen DEFINITION EXISTS
if (!html.includes('function handleModalOpen')) {
    const handleModalOpenDef = `
function handleModalOpen(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    if (window.lenis && typeof window.lenis.stop === 'function') window.lenis.stop();
}
`;
    const handleModalCloseIdx = html.indexOf('function handleModalClose');
    if (handleModalCloseIdx !== -1) {
        html = html.substring(0, handleModalCloseIdx) + handleModalOpenDef + '\n\n' + html.substring(handleModalCloseIdx);
        console.log('SUCCESS: Added handleModalOpen function definition!');
    }
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with grid click and search fixes!');
