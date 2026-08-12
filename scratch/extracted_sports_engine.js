// 3. SPORTS CHANNELS ENGINE
async function loadSportsChannels() {
try {
// 1. Fetch custom sports channels from admin API
let customSports = [];
try {
const adminRes = await fetch('/api/sports');
const adminData = await adminRes.json();
if (adminData && Array.isArray(adminData)) {
customSports = adminData.map(s => ({
name: '💎 ' + s.title,
url: s.url,
logo: s.icon && s.icon.startsWith('http') ? s.icon : ''
}));
}
} catch(e) {
console.warn('Failed to fetch admin sports', e);
}
const response = await fetch('/sports.m3u?refresh=1&nocache=' + Date.now());
const text = await response.text();
const lines = text.split('\n');
let current = {};
let tempChannels = [];
for(let line of lines) {
line = line.trim();
if (line.startsWith('#EXTINF')) {
const logoMatch = line.match(/tvg-logo="([^"]+)"/);
if (logoMatch) current.logo = logoMatch[1];
const nameParts = line.split(',');
current.name = nameParts.length > 1 ? nameParts[1].trim() : "Sports Channel";
} else if (line.startsWith('http')) {
current.url = line;
if (current.name) tempChannels.push(Object.assign({}, current));
current = {};
}
}
let liveEvents = [];
try {
const leRes = await fetch('/api/live_events');
const leData = await leRes.json();
if (leData && Array.isArray(leData)) {
liveEvents = leData.map(s => ({
name: '🔴 ' + s.title,
url: s.url,
logo: s.icon && s.icon.startsWith('http') ? s.icon : ''
}));
}
} catch(e) {
console.warn('Failed to fetch admin live events', e);
}
// Add user custom M3U channels and presets
const userCustomFeeds = getUserCustomSportsM3u().map(c => ({
name: '⚡ ' + c.name,
url: c.url,
logo: c.logo
}));
const presets = [];
window.allSportsChannels = userCustomFeeds.concat(liveEvents).concat(customSports).concat(presets).concat(tempChannels);
renderSportsHome();
renderUserCustomSportsChips();
} catch (err) {
console.warn(err);
}
}
// 4. CHANNELS DIRECTORY ENGINE
window.allChannelsData = [];
window.activeChannelsGenre = 'all';
async function loadAllChannelsDirectory() {
const badge = document.getElementById('channelsCountBadge');
if (window.allChannelsData && window.allChannelsData.length > 0) {
renderChannelsDirectoryGrid();
return;
}
try {
if (badge) badge.innerHTML = `<i data-lucide="loader-2" class="w-3.5 h-3.5 text-emerald-400 animate-spin inline mr-1"></i> Loading 249+ channels...`;
const res = await fetch('/api/sports/channels');
const data = await res.json();
if (Array.isArray(data) && data.length > 0) {
window.allChannelsData = data;
} else if (window.allSportsChannels && window.allSportsChannels.length > 0) {
window.allChannelsData = window.allSportsChannels;
}
} catch(e) {
console.warn('Fallback to allSportsChannels for channels directory', e);
if (window.allSportsChannels && window.allSportsChannels.length > 0) {
window.allChannelsData = window.allSportsChannels;
}
}
renderChannelsDirectoryGrid();
}
function setChannelsGenre(genre) {
window.activeChannelsGenre = genre;
const genres = ['all', 'sky', 'football', 'bein', 'f1', 'cricket', 'us', 'entertainment', 'regional', '4k'];
genres.forEach(g => {
const btn = document.getElementById(`btn-chan-${g}`);
if (btn) {
if (g === genre) {
btn.className = "px-4 py-2 rounded-xl transition-all shrink-0 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 border border-emerald-500/30 font-black";
} else {
btn.className = "px-4 py-2 rounded-xl transition-all shrink-0 bg-zinc-900 text-slate-400 hover:text-white border border-white/10 font-bold";
}
}
});
renderChannelsDirectoryGrid();
}
function filterChannelsView() {
renderChannelsDirectoryGrid();
}
function renderChannelsDirectoryGrid() {
const grid = document.getElementById('channelsDirectoryGrid');
const badge = document.getElementById('channelsCountBadge');
if (!grid) return;
let channels = (window.allChannelsData && window.allChannelsData.length > 0)
? window.allChannelsData
: (window.allSportsChannels || []);
// Search Filter
const searchInput = document.getElementById('channelsSearchInput');
const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
if (query) {
channels = channels.filter(ch => {
const name = (ch.name || ch.Name || '').toLowerCase();
const genre = (ch.genre || '').toLowerCase();
const source = (ch.source || '').toLowerCase();
const idStr = (ch.id || '').toString().toLowerCase();
return name.includes(query) || genre.includes(query) || source.includes(query) || idStr.includes(query);
});
}
// Source Filter
const sourceSelect = document.getElementById('channelsSourceSelect');
const sourceVal = sourceSelect ? sourceSelect.value : 'all';
if (sourceVal !== 'all') {
channels = channels.filter(ch => (ch.source || '').toLowerCase() === sourceVal.toLowerCase());
}
// Genre Filter
const genre = window.activeChannelsGenre || 'all';
if (genre !== 'all') {
channels = channels.filter(ch => {
const name = (ch.name || ch.Name || '').toLowerCase();
const g = (ch.genre || '').toLowerCase();
if (genre === 'sky') return name.includes('sky');
if (genre === 'football') return name.includes('football') || name.includes('soccer') || name.includes('premier') || name.includes('laliga') || name.includes('serie') || name.includes('tnt') || name.includes('mutv') || name.includes('barca') || name.includes('real madrid') || name.includes('joj');
if (genre === 'bein') return name.includes('bein');
if (genre === 'f1') return name.includes('f1') || name.includes('racing') || name.includes('grand prix') || name.includes('moto') || name.includes('nascar') || name.includes('speed') || name.includes('v sport');
if (genre === 'cricket') return name.includes('cricket') || name.includes('willow') || name.includes('ipl') || name.includes('icc') || name.includes('star sports') || name.includes('astro cricket');
if (genre === 'us') return name.includes('espn') || name.includes('fox') || name.includes('cbs') || name.includes('nbc') || name.includes('abc') || name.includes('usa') || name.includes('fanduel') || name.includes('tsn');
if (genre === 'entertainment') return g.includes('entertainment') || g.includes('movies') || name.includes('hbo') || name.includes('starz') || name.includes('cinemax') || name.includes('mgm') || name.includes('showtime') || name.includes('bet') || name.includes('ctv') || name.includes('a&e') || name.includes('reelz');
if (genre === 'regional') return g.includes('malayalam') || name.includes('asianet') || name.includes('manorama') || name.includes('mathrubhumi') || name.includes('24') || name.includes('kairali') || name.includes('reporter');
if (genre === '4k') return g.includes('4k') || name.includes('4k') || name.includes('uhd');
return true;
});
}
if (badge) {
badge.innerHTML = `<i data-lucide="tv" class="w-3.5 h-3.5 text-emerald-400 inline mr-1"></i> ${channels.length} Live Channels`;
}
if (channels.length === 0) {
grid.innerHTML = `
<div class="col-span-full py-16 text-center space-y-4 bg-zinc-950/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
<div class="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
<i data-lucide="tv-2" class="w-8 h-8"></i>
</div>
<h3 class="text-base font-black text-white uppercase tracking-wider">No matching channels found</h3>
<p class="text-xs text-zinc-400 max-w-sm mx-auto">Try clearing search filters or picking another channel genre above.</p>
<button onclick="document.getElementById('channelsSearchInput').value=''; setChannelsGenre('all');" class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-600/20">Reset Filters</button>
</div>
`;
if (window.lucide) lucide.createIcons();
return;
}
grid.innerHTML = channels.map(ch => {
const title = (ch.name || ch.Name || '').replace(/⭐️/g, '').trim() || "Live Channel";
const rawUrl = ch.url || ch.stream_url || (`/api/play_stream/` + (ch.id || ''));
const poster = getSportsLogo(ch);
const sourceTag = ch.source || (ch.id ? 'DLHD' : 'TimStreams');
const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
const isSaved = getSavedSports().some(s => s.url === rawUrl);
return `
<div class="bg-zinc-950/80 border border-white/10 hover:border-emerald-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 relative group flex flex-col justify-between p-3.5" onclick="openFullscreenPlayer('${rawUrl}', '${title.replace(/'/g, "\\'")}')">
<div class="flex items-center justify-between gap-1 mb-2.5">
<span class="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[9px] font-black rounded uppercase tracking-wider truncate max-w-[90px]">
${ch.genre || sourceTag}
</span>
<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
<button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(title).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(rawUrl).replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 text-emerald-400" title="View Channel EPG">
<i data-lucide="list" class="w-3.5 h-3.5"></i>
</button>
<button onclick="toggleSavedSport(event, '${encodeURIComponent(title).replace(/'/g, "%27")}', '${encodeURIComponent(rawUrl).replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90">
<i data-lucide="heart" class="w-3.5 h-3.5 ${isSaved ? 'fill-pink-500 text-pink-500' : 'text-zinc-500'}"></i>
</button>
</div>
</div>
<div class="relative aspect-[16/10] bg-gradient-to-b from-zinc-900 to-black/80 rounded-xl p-2.5 flex items-center justify-center border border-white/5 mb-3 group-hover:border-emerald-500/30 transition-all overflow-hidden">
<img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-500">
<!-- Hover Play Overlay -->
<div class="absolute inset-0 bg-emerald-950/60 backdrop-blur-[2px] transition-opacity flex items-center justify-center">
<div class="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/50 transform scale-75 group-hover:scale-100 transition-transform duration-300">
<i data-lucide="play" class="w-5 h-5 fill-white ml-0.5"></i>
</div>
</div>
</div>
<div class="space-y-1">
<h4 class="text-xs font-black text-white group-hover:text-emerald-400 transition-colors truncate" title="${title}">${title}</h4>
<div class="flex items-center justify-between text-[10px] text-zinc-500 font-medium">
<span class="flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE HD</span>
<span class="text-zinc-400 font-mono">${sourceTag}</span>
</div>
</div>
</div>
`;
}).join('');
if (window.lucide) lucide.createIcons();
}
function getUserCustomSportsM3u() {
try {
return JSON.parse(localStorage.getItem('user_custom_sports_m3u_list') || '[]');
} catch(e) {
return [];
}
}
function saveUserCustomSportsM3u(name, url, logo = '') {
if (!url) return;
const list = getUserCustomSportsM3u();
const existingIdx = list.findIndex(item => item.url === url);
const newItem = {
name: name || "Custom Sports Channel",
url: url,
logo: logo || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=300"
};
if (existingIdx >= 0) {
list[existingIdx] = newItem;
} else {
list.unshift(newItem);
}
localStorage.setItem('user_custom_sports_m3u_list', JSON.stringify(list));
renderUserCustomSportsChips();
}
function deleteUserCustomSportsM3u(url) {
let list = getUserCustomSportsM3u();
list = list.filter(item => item.url !== url);
localStorage.setItem('user_custom_sports_m3u_list', JSON.stringify(list));
renderUserCustomSportsChips();
if (typeof loadSportsChannels === 'function') loadSportsChannels();
}
function renderUserCustomSportsChips() {
const container = document.getElementById('userCustomM3uChips');
if (!container) return;
const list = getUserCustomSportsM3u();
if (list.length === 0) {
container.classList.add('hidden');
container.innerHTML = '';
return;
}
container.classList.remove('hidden');
container.innerHTML = `
<span class="text-[10px] font-bold text-zinc-500 uppercase tracking-wider self-center mr-1">Saved Links:</span>
${list.map(item => `
<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/80 border border-white/10 text-xs text-slate-200 hover:border-emerald-500/40 transition-all">
<button onclick="playCustomM3uDirect('${encodeURIComponent(item.url)}', '${encodeURIComponent(item.name)}')" class="font-bold hover:text-emerald-400 transition-colors flex items-center gap-1 truncate max-w-[150px]">
<i data-lucide="play" class="w-3 h-3 text-emerald-400 fill-emerald-400"></i> ${item.name}
</button>
<button onclick="deleteUserCustomSportsM3u('${item.url}')" class="text-zinc-500 hover:text-red-400 p-0.5 rounded transition-colors" title="Remove link">
<i data-lucide="x" class="w-3 h-3"></i>
</button>
</div>
`).join('')}
`;
if (window.lucide) lucide.createIcons();
}
function playCustomM3uDirect(encUrl, encName) {
const url = decodeURIComponent(encUrl);
const name = decodeURIComponent(encName) || "Custom Sports Channel";
window.location.href = `play_consumet.php?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&source=consumet.html`;
}
function playCustomM3uStream() {
const urlInput = document.getElementById('customM3uUrlInput');
const nameInput = document.getElementById('customM3uNameInput');
const url = (urlInput ? urlInput.value : '').trim();
const name = (nameInput ? nameInput.value : '').trim() || "Custom Sports Channel";
if (!url) {
if (typeof showToast === 'function') {
showToast("Please enter a valid M3U or stream URL");
} else {
alert("Please enter a valid M3U or stream URL");
}
return;
}
saveUserCustomSportsM3u(name, url);
window.location.href = `play_consumet.php?url=${encodeURIComponent(url)}&name=${encodeURIComponent(name)}&source=consumet.html`;
}
function getSavedSports() {
return JSON.parse(localStorage.getItem('stalker_saved_sports') || '[]');
}
function toggleSavedSport(event, encName, encUrl, encLogo) {
const name = decodeURIComponent(encName);
const url = decodeURIComponent(encUrl);
const logo = decodeURIComponent(encLogo);
event.stopPropagation();
event.preventDefault();
let saved = getSavedSports();
const index = saved.findIndex(s => s.url === url);
if (index >= 0) {
saved.splice(index, 1);
showToast("Removed from Saved Sports");
} else {
saved.push({ name, url, logo: logo === 'null' ? null : logo });
showToast("Added to Saved Sports");
}
localStorage.setItem('stalker_saved_sports', JSON.stringify(saved));
// Re-render
if (window.activeSportsCategory === 'saved') {
renderSportsGrid(getSavedSports());
} else if (window.activeSportsCategory === 'all') {
renderSportsHome();
} else {
filterSports();
}
lucide.createIcons();
}
let sportsSpotlightSlides = [];
let currentSportsSlideIndex = 0;
let sportsSpotlightInterval = null;
function renderSportsSpotlight(slides) {
sportsSpotlightSlides = slides;
if (slides.length === 0) return;
renderSportsSpotlightSlide(0);
if (sportsSpotlightInterval) clearInterval(sportsSpotlightInterval);
sportsSpotlightInterval = setInterval(() => {
nextSportsSpotlightSlide();
}, 6500);
}
function nextSportsSpotlightSlide() {
if (sportsSpotlightSlides.length === 0) return;
const nextIdx = (currentSportsSlideIndex + 1) % sportsSpotlightSlides.length;
renderSportsSpotlightSlide(nextIdx);
}
window.selectSportsSpotlightSlide = function(index) {
if (sportsSpotlightInterval) clearInterval(sportsSpotlightInterval);
renderSportsSpotlightSlide(index);
sportsSpotlightInterval = setInterval(() => {
nextSportsSpotlightSlide();
}, 6500);
}
function renderSportsSpotlightSlide(index) {
if (sportsSpotlightSlides.length === 0) return;
currentSportsSlideIndex = index;
const container = document.getElementById('sportsHeroSliderContainer');
if (!container) return;
const item = sportsSpotlightSlides[index];
const title = item.name || "Live Sports Showcase";
const backdrop = item.logo && item.logo.startsWith('http') ? item.logo : 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2560';
container.innerHTML = `
<div class="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-100" style="background-image: url('${backdrop}')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
<div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent z-10"></div>
<div class="absolute bottom-6 right-6 flex items-center gap-2 z-20">
${sportsSpotlightSlides.map((_, i) => `
<button onclick="selectSportsSpotlightSlide(${i})" class="w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === index ? 'bg-emerald-500 w-6' : 'bg-white/30 hover:bg-white/50'}"></button>
`).join('')}
</div>
<div class="absolute bottom-0 left-0 p-8 sm:p-14 max-w-2xl z-20 animate-slide-up">
<div class="flex items-center gap-3 mb-4">
<span class="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white rounded border border-emerald-500/50 shadow-lg shadow-emerald-500/20 animate-pulse">🔴 LIVE</span>
<span class="text-xs font-bold text-slate-300 uppercase tracking-widest">Premium Broadcast</span>
</div>
<h2 class="text-4xl sm:text-5xl font-black uppercase tracking-tighter text-white leading-[1.1] drop-shadow-2xl mb-4">${title}</h2>
<p class="text-sm text-slate-300 font-medium leading-relaxed mb-8 max-w-xl line-clamp-3">
Stream live sports networks, main events, Formula 1 broadcasts, and Champions League qualifiers without ad-interruptions.
</p>
<div class="flex flex-wrap items-center gap-4">
<button onclick="openFullscreenPlayer('${item.url}', '${title.replace(/'/g, "\\'")}')" class="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:-translate-y-1 flex items-center gap-2 transform active:scale-95">
<i data-lucide="play" class="w-5 h-5 fill-white"></i> Play Stream
</button>
<button onclick="toggleSavedSport(event, '${encodeURIComponent(title)}', '${item.url}', '${item.logo || ""}')" class="w-14 h-14 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 flex items-center justify-center transition-all hover:border-emerald-500/30 transform active:scale-95">
<i data-lucide="heart" class="w-6 h-6 ${getSavedSports().some(s => s.url === item.url) ? 'fill-pink-500 text-pink-500' : 'text-slate-400'}"></i>
</button>
</div>
</div>
`;
lucide.createIcons();
}
function analyzeStream(url) {
const lower = (url || '').toLowerCase();
let type = 'Native HLS';
let res = '1080p HD';
if (lower.includes('/play/') || lower.includes('.ts') || lower.includes('transcode=1')) {
type = 'MPEG-TS';
} else if (lower.includes('.ism') || lower.includes('fmp4')) {
type = 'fMP4 HLS';
}
if (lower.includes('4k') || lower.includes('uhd') || lower.includes('3840')) {
res = '4K UHD';
} else if (lower.includes('720')) {
res = '720p HD';
}
return { type, res };
}
function renderSportsHome() {
const list = window.allSportsChannels || [];
const skyChannels = list.filter(ch => ch.name.toLowerCase().includes('sky'));
const footballChannels = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('laliga') || ch.name.toLowerCase().includes('premier') || ch.name.toLowerCase().includes('serie') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
const f1Channels = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
const cricketChannels = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric') || ch.name.toLowerCase().includes('unite8'));
const usChannels = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
const sonyChannels = list.filter(ch => ch.name.toLowerCase().includes('sony'));
const hboChannels = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
const fourKChannels = list.filter(ch => ch.genre === '4K Ultra HD' || ch.name.toLowerCase().includes('4k') || ch.name.toLowerCase().includes('uhd'));
const malayalamNewsChannels = list.filter(ch => ch.genre === 'Malayalam News' || ch.name.toLowerCase().includes('news') && (ch.name.toLowerCase().includes('24') || ch.name.toLowerCase().includes('asianet') || ch.name.toLowerCase().includes('manorama') || ch.name.toLowerCase().includes('mathrubhumi') || ch.name.toLowerCase().includes('kairali') || ch.name.toLowerCase().includes('janam') || ch.name.toLowerCase().includes('media one') || ch.name.toLowerCase().includes('news18') || ch.name.toLowerCase().includes('reporter') || ch.name.toLowerCase().includes('zee')));
const malayalamEntChannels = list.filter(ch => ch.genre === 'Malayalam Entertainment' || ch.name.toLowerCase().includes('amrita') || ch.name.toLowerCase().includes('dd malayalam') || ch.name.toLowerCase().includes('mazhavil') || ch.name.toLowerCase().includes('flowers') || ch.name.toLowerCase().includes('jeevan'));
const malayalamMoviesChannels = list.filter(ch => ch.genre === 'Malayalam Movies' || ch.genre === 'Malayalam Music' || ch.genre === 'Malayalam Education' || ch.name.toLowerCase().includes('kappa') || ch.name.toLowerCase().includes('victers') || ch.name.toLowerCase().includes('we'));
const kidsChannels = list.filter(ch => ch.genre === 'Kids' || ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('bean') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
const customChannels = list.filter(ch => ch.name.startsWith('💎 '));
const savedChannels = getSavedSports();
const savedContainer = document.getElementById('sportsSavedShelfContainer');
if (savedChannels.length > 0) {
if (savedContainer) savedContainer.style.display = 'block';
renderSportsShelf(savedChannels, 'sportsSavedShelf');
} else {
if (savedContainer) savedContainer.style.display = 'none';
}
const liveEventsChannels = list.filter(ch => ch.name.startsWith('🔴 '));
const liveEventsContainer = document.getElementById('sportsLiveEventsShelfContainer');
if (liveEventsChannels.length > 0) {
if (liveEventsContainer) liveEventsContainer.style.display = 'block';
renderSportsShelf(liveEventsChannels, 'sportsLiveEventsShelf');
} else {
if (liveEventsContainer) liveEventsContainer.style.display = 'none';
}
const customContainer = document.getElementById('sportsCustomShelfContainer');
if (customChannels.length > 0) {
if (customContainer) customContainer.style.display = 'block';
renderSportsShelf(customChannels, 'sportsCustomShelf');
} else {
if (customContainer) customContainer.style.display = 'none';
}
// Pick 5 random channels for the spotlight
const spotlightChannels = [...list].sort(() => 0.5 - Math.random()).slice(0, 5);
renderSportsSpotlight(spotlightChannels);
renderSportsShelf(skyChannels, 'sportsSkyShelf');
renderSportsShelf(footballChannels, 'sportsFootballShelf');
renderSportsShelf(cricketChannels, 'sportsCricketShelf');
renderSportsShelf(f1Channels, 'sportsF1Shelf');
renderSportsShelf(usChannels, 'sportsUSShelf');
renderSportsShelf(sonyChannels, 'sportsSonyShelf');
renderSportsShelf(hboChannels, 'sportsHBOShelf');
renderSportsShelf(fourKChannels, 'sports4kShelf');
renderSportsShelf(malayalamNewsChannels, 'sportsMalayalamNewsShelf');
renderSportsShelf(malayalamEntChannels, 'sportsMalayalamEntShelf');
renderSportsShelf(malayalamMoviesChannels, 'sportsMalayalamMoviesShelf');
renderSportsShelf(kidsChannels, 'sportsKidsShelf');
lucide.createIcons();
}
function getSportsLogo(ch) {
if (!ch) return 'https://ui-avatars.com/api/?name=Sports&background=05070a&color=10b981&size=256&bold=true';
const title = (ch.name || ch.Name || '').replace(/⭐️/g, '').trim() || "Live Sports";
const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
let logo = ch.logo || ch.Logo || '';
const name = title.toLowerCase();
if (name.includes('abc ny') || name.includes('abc usa') || name === 'abc') return '/assets/logos/abc_usa.svg';
if (name.includes('a&e') || name.includes('a & e')) return '/assets/logos/a_and_e_usa.svg';
if (name.includes('bein sports 1 fr')) return '/assets/logos/bein_sports_1_france.svg';
if (name.includes('bein sports 2 fr')) return '/assets/logos/bein_sports_2_france.svg';
if (name.includes('bein sports 3 fr')) return '/assets/logos/bein_sports_3_france.svg';
if (name.includes('bein sports 1 tr') || name.includes('bein sports 1 turkey')) return '/assets/logos/bein_sports_1_turkey.svg';
if (name.includes('bein sports 2 tr') || name.includes('bein sports 2 turkey')) return '/assets/logos/bein_sports_2_turkey.svg';
if (name.includes('bein sports 3 tr') || name.includes('bein sports 3 turkey')) return '/assets/logos/bein_sports_3_turkey.svg';
if (name.includes('bein sports 4 tr') || name.includes('bein sports 4 turkey')) return '/assets/logos/bein_sports_4_turkey.svg';
if (name.includes('bein')) return '/assets/logos/bein_sports_mena_english_2.svg';
if (name.includes('astro supersport 3')) return '/assets/logos/astro_supersport_3.svg';
if (name.includes('astro supersport 4')) return '/assets/logos/astro_supersport_4.svg';
if (name.includes('astro cricket')) return '/assets/logos/astro_cricket.svg';
if (name.includes('dazn')) return '/assets/logos/dazn_2_spain.svg';
if (name.includes('arena sport 2 cro')) return '/assets/logos/arena_sport_2_croatia.svg';
if (name.includes('arena sport')) return '/assets/logos/arena_sport_2_serbia.svg';
if (name.includes('espn brasil')) return '/assets/logos/espn_brasil.svg';
if (name.includes('fox sports 2')) return '/assets/logos/fox_sports_2_usa.svg';
if (name.includes('fox sports 503')) return '/assets/logos/fox_sports_503_au.svg';
if (name.includes('fanduel')) return '/assets/logos/fanduel_sports_network_midwest.svg';
if (name.includes('sportsnet one')) return '/assets/logos/sportsnet_one.svg';
if (name.includes('sportsnet 360')) return '/assets/logos/sportsnet_360.svg';
if (name.includes('supersport variety')) return '/assets/logos/supersport_variety_1.svg';
if (name.includes('tsn5') || name.includes('tsn 5')) return '/assets/logos/tsn5.svg';
if (name.includes('tnt usa') || name === 'tnt') return '/assets/logos/tnt_usa.svg';
if (name.includes('starz')) return '/assets/logos/starz.svg';
if (name.includes('cinemax')) return '/assets/logos/cinemax_usa.svg';
if (name.includes('mgm+') || name.includes('epix')) return '/assets/logos/mgm_plus_usa_epix.svg';
if (name.includes('showtime')) return '/assets/logos/showtime_showcase_usa.svg';
if (name.includes('bbc america') || name.includes('bbca')) return '/assets/logos/bbc_america_bbca.svg';
if (name.includes('bet usa') || name === 'bet') return '/assets/logos/bet_usa.svg';
if (name.includes('cnbc')) return '/assets/logos/cnbc_usa.svg';
if (name.includes('ctv canada') || name === 'ctv') return '/assets/logos/ctv_canada.svg';
if (name.includes('cbsny') || name.includes('cbs ny') || name === 'cbs') return '/assets/logos/cbsny_usa.svg';
if (name.includes('canal 5') || name.includes('canal5')) return '/assets/logos/canal5_mx.svg';
if (name.includes('sport 1 cz') || name.includes('sport 1')) return '/assets/logos/sport_1_cz.svg';
if (name.includes('joj')) return '/assets/logos/joj_sport_sk.svg';
if (name.includes('discovery life')) return '/assets/logos/discovery_life_channel.svg';
if (name.includes('disney xd')) return '/assets/logos/disney_xd.svg';
if (name.includes('racer tv')) return '/assets/logos/racer_tv_usa.svg';
if (name.includes('nbc sports')) return '/assets/logos/nbc_sports_philadelphia.svg';
if (name.includes('nat geo wild')) return '/assets/logos/nat_geo_wild_usa.svg';
if (name.includes('reelz')) return '/assets/logos/reelz_channel.svg';
if (name.includes('sport 5 plus')) return '/assets/logos/sport_5_plus_israel.svg';
if (name.includes('sport 5 live')) return '/assets/logos/sport_5_live_israel.svg';
if (name.includes('sport 5 star') || name.includes('sport 5')) return '/assets/logos/sport_5_star_israel.svg';
if (name.includes('tv4 sport')) return '/assets/logos/tv4_sport_live_3.svg';
if (name.includes('v sport motor') || name.includes('v sport')) return '/assets/logos/v_sport_motor_sweden.svg';
if (name.includes('fox weather')) return '/assets/logos/fox_weather_channel.svg';
if (name.includes('eurosport 1') || name.includes('eurosport')) return '/assets/logos/eurosport_1_spain.svg';
if (!logo || logo.includes('generic.png')) return fallbackLogo;
return logo;
}
function renderSportsShelf(channels, containerId) {
const grid = document.getElementById(containerId);
if (!grid) return;
grid.innerHTML = '';
// Limit to max 25 items per shelf
const itemsToRender = channels.slice(0, 25);
if (itemsToRender.length === 0) {
grid.innerHTML = '<div class="py-6 px-4 text-xs text-zinc-600 uppercase tracking-widest font-black">No feeds active in this shelf</div>';
return;
}
itemsToRender.forEach(ch => {
const title = ch.name.replace(/⭐️/g, '').trim() || "Live Sports";
const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
const poster = getSportsLogo(ch);
const analysis = analyzeStream(ch.url || ch.stream_url);
const card = document.createElement('div');
card.className = "w-40 sm:w-48 lg:w-52 shrink-0 bg-zinc-900/80 backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden cursor-pointer border border-white/10 transition-all duration-300 transform group-hover:-translate-y-1.5 hover:scale-105 hover:border-emerald-500/50 relative flex flex-col group shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10";
card.onclick = () => openFullscreenPlayer(ch.url || ch.stream_url, title);
card.innerHTML = `
<div class="relative aspect-[2/3] overflow-hidden bg-zinc-950 flex items-center justify-center p-3">
<img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-xl group-hover:scale-110 transition-transform duration-500">
<div class="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
<button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/70 hover:bg-black border border-white/15 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 text-emerald-400 shadow-md" title="View Channel EPG">
<i data-lucide="list" class="w-3.5 h-3.5"></i>
</button>
<button onclick="toggleSavedSport(event, '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-7 h-7 rounded-full bg-black/70 hover:bg-black border border-white/15 backdrop-blur-md flex items-center justify-center transition-all active:scale-90 shadow-md">
<i data-lucide="heart" class="w-3.5 h-3.5 ${getSavedSports().some(s => s.url === (ch.url || ch.stream_url)) ? 'fill-pink-500 text-pink-500' : 'text-zinc-400'}"></i>
</button>
</div>
<div class="absolute bottom-2.5 left-2.5 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[9px] font-bold text-emerald-400 border border-white/15 flex items-center gap-1 shadow-md">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> LIVE
</div>
</div>
<div class="p-3.5 bg-zinc-950/90 flex-grow flex flex-col justify-between border-t border-white/5">
<div>
<h3 class="text-xs sm:text-sm font-bold text-white truncate w-full tracking-tight" title="${title}">${title}</h3>
<div class="flex items-center gap-1.5 mt-1.5 text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">
<span class="bg-white/10 px-1.5 py-0.5 rounded-full text-white">${analysis.type}</span>
<span class="text-emerald-400 font-bold">${analysis.res}</span>
</div>
</div>
</div>
`;
grid.appendChild(card);
});
lucide.createIcons();
}
function renderSportsGrid(channels) {
const grid = document.getElementById('sportsGrid');
if (!grid) return;
grid.innerHTML = '';
if (channels.length === 0) {
grid.innerHTML = `
<div class="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3">
<i data-lucide="info" class="w-10 h-10 text-zinc-600"></i>
<p class="text-sm font-extrabold text-zinc-400 uppercase tracking-wider">No matching feeds found</p>
<p class="text-xs text-zinc-600 max-w-xs">Try adjusting your keywords or switching back to the Hub Arena.</p>
</div>
`;
lucide.createIcons();
return;
}
channels.forEach(ch => {
const title = ch.name.replace(/⭐️/g, '').trim() || "Live Sports";
const fallbackLogo = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(title) + '&background=05070a&color=10b981&size=256&bold=true';
const poster = getSportsLogo(ch);
const card = document.createElement('div');
card.className = "bg-zinc-950 rounded-2xl overflow-hidden cursor-pointer border border-white/5 transition-card relative flex flex-col group hover:border-emerald-500/30 shadow-md";
card.onclick = () => openFullscreenPlayer(ch.url, title);
card.innerHTML = `
<div class="relative aspect-[2/3] overflow-hidden bg-zinc-900 flex items-center justify-center p-2">
<img src="${poster}" alt="${title}" referrerpolicy="no-referrer" onerror="this.src='${fallbackLogo}'" class="max-w-full max-h-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500">
<div class="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
<button onclick="event.stopPropagation(); openEpgChannelModal('${ch.id || ""}', '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(poster).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url || ch.stream_url || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 text-emerald-400" title="View Channel EPG">
<i data-lucide="list" class="w-3 h-3"></i>
</button>
<button onclick="toggleSavedSport(event, '${encodeURIComponent(ch.name).replace(/'/g, "%27")}', '${encodeURIComponent(ch.url).replace(/'/g, "%27")}', '${encodeURIComponent(ch.logo || "").replace(/'/g, "%27")}')" class="w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center transition-all active:scale-90 ">
<i data-lucide="heart" class="w-3 h-3 ${getSavedSports().some(s => s.url === ch.url) ? 'fill-pink-500 text-pink-500' : 'text-zinc-500'}"></i>
</button>
</div>
<div class="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 rounded text-[9px] font-black text-emerald-400 border border-white/5 flex items-center gap-0.5 shadow-md backdrop-blur-sm">
<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
</div>
</div>
<div class="p-3 bg-zinc-950 flex-grow flex flex-col justify-between">
<div>
<h3 class="text-xs font-black text-white truncate w-full uppercase tracking-tight" title="${title}">${title}</h3>
<div class="flex items-center gap-1.5 mt-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
<span>SPORTS</span>
<span class="w-1 h-1 rounded-full bg-slate-600"></span>
<span>LIVE HD</span>
</div>
</div>
</div>
`;
grid.appendChild(card);
});
lucide.createIcons();
}
function filterSports() {
const query = (document.getElementById('sportsSearch')?.value || '').toLowerCase().trim();
const homeLayout = document.getElementById('sportsHomeLayout');
const catalogLayout = document.getElementById('sportsCatalogLayout');
if (query === '') {
if (window.activeSportsCategory === 'all') {
if (homeLayout) homeLayout.classList.remove('hidden');
if (catalogLayout) catalogLayout.classList.add('hidden');
} else {
if (homeLayout) homeLayout.classList.add('hidden');
if (catalogLayout) catalogLayout.classList.remove('hidden');
filterSportsCategory(window.activeSportsCategory);
}
} else {
if (homeLayout) homeLayout.classList.add('hidden');
if (catalogLayout) catalogLayout.classList.remove('hidden');
let list = window.activeSportsCategory === 'saved' ? getSavedSports() : (window.allSportsChannels || []);
if (window.activeSportsCategory !== 'all' && window.activeSportsCategory !== 'saved') {
if (window.activeSportsCategory === 'sky') {
list = list.filter(ch => ch.name.toLowerCase().includes('sky'));
} else if (window.activeSportsCategory === 'football') {
list = list.filter(ch => ch.name.toLowerCase().includes('football') || ch.name.toLowerCase().includes('sports 1') || ch.name.toLowerCase().includes('sports 2') || ch.name.toLowerCase().includes('soccer') || ch.name.toLowerCase().includes('chelsea') || ch.name.toLowerCase().includes('mutv') || ch.name.toLowerCase().includes('barca') || ch.name.toLowerCase().includes('real madrid') || ch.name.toLowerCase().includes('bein') || ch.name.toLowerCase().includes('tnt'));
} else if (window.activeSportsCategory === 'cricket') {
list = list.filter(ch => ch.name.toLowerCase().includes('cricket') || ch.name.toLowerCase().includes('icc') || ch.name.toLowerCase().includes('ipl') || ch.name.toLowerCase().includes('bcci') || ch.name.toLowerCase().includes('willow') || ch.name.toLowerCase().includes('star sports') || ch.name.toLowerCase().includes('cric'));
} else if (window.activeSportsCategory === 'f1') {
list = list.filter(ch => ch.name.toLowerCase().includes('f1') || ch.name.toLowerCase().includes('racing') || ch.name.toLowerCase().includes('grand prix') || ch.name.toLowerCase().includes('moto') || ch.name.toLowerCase().includes('nascar') || ch.name.toLowerCase().includes('speed'));
} else if (window.activeSportsCategory === 'us') {
list = list.filter(ch => ch.name.toLowerCase().includes('us') || ch.name.toLowerCase().includes('espn') || ch.name.toLowerCase().includes('fox') || ch.name.toLowerCase().includes('cbs') || ch.name.toLowerCase().includes('nbc'));
} else if (window.activeSportsCategory === 'sony') {
list = list.filter(ch => ch.name.toLowerCase().includes('sony'));
} else if (window.activeSportsCategory === 'hbo') {
list = list.filter(ch => ch.name.toLowerCase().includes('hbo'));
} else if (window.activeSportsCategory === 'kids') {
list = list.filter(ch => ch.name.toLowerCase().includes('kids') || ch.name.toLowerCase().includes('cartoon') || ch.name.toLowerCase().includes('disney') || ch.name.toLowerCase().includes('nick'));
}
}
const filtered = list.filter(c => c.name.toLowerCase().includes(query));
renderSportsGrid(filtered);
}
}
