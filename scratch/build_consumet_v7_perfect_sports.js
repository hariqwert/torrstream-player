const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

const sportsHtmlMarkup = fs.readFileSync(path.join(__dirname, 'extracted_sports_section.html'), 'utf8');
let sportsJsEngine = fs.readFileSync(path.join(__dirname, 'extracted_sports_engine.js'), 'utf8');

// Ensure filterSportsCategory is appended if missing in extracted_sports_engine.js
if (!sportsJsEngine.includes('function filterSportsCategory')) {
    sportsJsEngine += `
window.activeSportsCategory = 'all';
function filterSportsCategory(cat) {
    window.activeSportsCategory = cat;
    const cats = ['all', 'saved', 'cricket', 'football', 'sky', 'f1', 'us', 'sony', 'hbo', 'kids'];
    cats.forEach(c => {
        const btn = document.getElementById('btn-sport-' + c);
        if (btn) {
            if (c === cat) {
                btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-amber-600 text-white border border-amber-500/30";
            } else {
                btn.className = "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all bg-zinc-900 text-slate-400 hover:text-white border border-white/5";
            }
        }
    });

    const homeLayout = document.getElementById('sportsHomeLayout');
    const catalogLayout = document.getElementById('sportsCatalogLayout');

    if (cat === 'all' && (!document.getElementById('sportsSearch')?.value?.trim())) {
        if (homeLayout) homeLayout.classList.remove('hidden');
        if (catalogLayout) catalogLayout.classList.add('hidden');
        return;
    }

    if (homeLayout) homeLayout.classList.add('hidden');
    if (catalogLayout) catalogLayout.classList.remove('hidden');

    let list = cat === 'saved' ? getSavedSports() : (window.allSportsChannels || []);
    if (cat !== 'all' && cat !== 'saved') {
        if (cat === 'sky') {
            list = list.filter(ch => ch.name.toLowerCase().includes('sky'));
        } else if (cat === 'football') {
            list = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('sports 1') || ch.name.toLowerCase().includes('sports 2') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
        } else if (cat === 'cricket') {
            list = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric'));
        } else if (cat === 'f1') {
            list = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
        } else if (cat === 'us') {
            list = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
        } else if (cat === 'sony') {
            list = list.filter(ch => ch.name.toLowerCase().includes('sony'));
        } else if (cat === 'hbo') {
            list = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
        } else if (cat === 'kids') {
            list = list.filter(ch => ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
        }
    }
    renderSportsGrid(list);
}
`;
}

// Ensure sportsSavedShelfContainer is present in HTML
let sportsSectionHtml = sportsHtmlMarkup;
if (!sportsSectionHtml.includes('id="sportsSavedShelfContainer"')) {
    const savedShelfMarkup = `
<!-- Shelf: Saved Sports Channels -->
<div class="space-y-4 animate-fade-in" id="sportsSavedShelfContainer" style="display: none;">
<div class="flex items-center gap-2">
<span class="w-1.5 h-5 bg-pink-500 rounded-full shadow-lg shadow-pink-500/50 animate-pulse"></span>
<h2 class="text-lg font-extrabold uppercase tracking-wider text-white flex items-center gap-2"><i data-lucide="heart" class="w-4 h-4 text-pink-500 fill-pink-500"></i> Saved Channels</h2>
</div>
<div class="scroller-container">
<button class="scroller-btn scroller-left" onclick="scrollShelf('sportsSavedShelf', 'left')"><i data-lucide="chevron-left"></i></button>
<div id="sportsSavedShelf" class="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"></div>
<button class="scroller-btn scroller-right" onclick="scrollShelf('sportsSavedShelf', 'right')"><i data-lucide="chevron-right"></i></button>
</div>
</div>
`;
    const m3uCardEnd = sportsSectionHtml.indexOf('</div>', sportsSectionHtml.indexOf('id="customM3uLauncherCard"')) + 6;
    if (m3uCardEnd !== -1) {
        sportsSectionHtml = sportsSectionHtml.substring(0, m3uCardEnd) + '\n' + savedShelfMarkup + sportsSectionHtml.substring(m3uCardEnd);
    }
}

// 1. Replace Sports Section HTML
const sportsSectionStart = html.indexOf('<section id="view-sports"');
const sportsSectionEnd = html.indexOf('</section>', sportsSectionStart) + 10;

if (sportsSectionStart !== -1 && sportsSectionEnd !== -1) {
    html = html.substring(0, sportsSectionStart) + sportsSectionHtml + html.substring(sportsSectionEnd);
    console.log('Successfully replaced <section id="view-sports"> HTML with saved shelf');
} else {
    console.error('FAILED to locate <section id="view-sports"> in consumet.html');
}

// 2. Replace Sports JS Engine
const jsStart = html.indexOf('// 3. SPORTS CHANNELS ENGINE');
const jsEnd = html.indexOf('function playStreamDirect(', jsStart);

if (jsStart !== -1 && jsEnd !== -1) {
    html = html.substring(0, jsStart) + sportsJsEngine + '\n\n' + html.substring(jsEnd);
    console.log('Successfully replaced Sports JS Engine with complete 45KB engine!');
} else {
    console.error('FAILED to locate Sports JS Engine boundaries in consumet.html');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html v7 perfect successfully!');
