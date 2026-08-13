const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const newNav = '<nav class="hidden md:flex items-center gap-8 lg:gap-10">\n' +
'    <button onclick="switchTab(\'home\')" id="tab-home" class="nav-link active-tab text-[15px] font-semibold text-white relative py-2 transition-all after:absolute after:-bottom-1 after:left-0 after:right-0 after:h-0.5 after:bg-white tracking-wide">Home</button>\n' +
'    <button onclick="switchTab(\'movies\')" id="tab-movies" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">Movies</button>\n' +
'    <button onclick="switchTab(\'tv\')" id="tab-tv" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">TV Shows</button>\n' +
'    <button onclick="switchTab(\'anime\')" id="tab-anime" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">Anime</button>\n' +
'    <button onclick="switchTab(\'sports\')" id="tab-sports" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">Sports</button>\n' +
'    <button onclick="switchTab(\'watchlist\')" id="tab-watchlist" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">My List</button>\n' +
'    <button onclick="switchTab(\'epg\')" id="tab-epg" class="nav-link text-[15px] font-medium text-zinc-400 hover:text-white relative py-2 transition-all tracking-wide">Guide</button>\n' +
'</nav>';

const newSwitchTab = "function switchTab(tabId) {\n" +
"    document.querySelectorAll('.nav-link').forEach(btn => {\n" +
"        btn.classList.remove('active-tab', 'text-white', 'font-semibold', 'after:absolute', 'after:-bottom-1', 'after:left-0', 'after:right-0', 'after:h-0.5', 'after:bg-white');\n" +
"        btn.classList.add('text-zinc-400', 'font-medium');\n" +
"    });\n" +
"    const tabBtn = document.getElementById('tab-' + tabId);\n" +
"    if (tabBtn) {\n" +
"        tabBtn.classList.remove('text-zinc-400', 'font-medium');\n" +
"        tabBtn.classList.add('active-tab', 'text-white', 'font-semibold', 'after:absolute', 'after:-bottom-1', 'after:left-0', 'after:right-0', 'after:h-0.5', 'after:bg-white');\n" +
"    }";

html = html.replace(/<nav class="hidden md:flex items-center gap-6 lg:gap-8">[\s\S]*?<\/nav>/, newNav);

// Find the function switchTab(tabId) { ... } and replace it. 
// Note: It's safer to just replace the whole function block.
const funcStart = html.indexOf('function switchTab(tabId) {');
if (funcStart !== -1) {
    const nextFunc = html.indexOf('function ', funcStart + 10);
    if (nextFunc !== -1) {
        // We will just do string replacement of the specific known lines to avoid deleting too much.
        // Wait, the previous function had a specific structure. Let's just use regex.
        html = html.replace(/function switchTab\(tabId\) \{[\s\S]*?\/\/ Update views/, newSwitchTab + '\n    // Update views');
    }
}

fs.writeFileSync('consumet.html', html, 'utf8');
