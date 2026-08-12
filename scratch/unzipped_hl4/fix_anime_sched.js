const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

if (!html.includes('function switchAnimeScheduleDay')) {
    html = html.replace('async function loadAnimeSchedule(dayFilter', 
`window.switchAnimeScheduleDay = function(day) {
            loadAnimeSchedule(day);
        }

        async function loadAnimeSchedule(dayFilter`);
}

// Fix tab classes in loadAnimeSchedule
html = html.replace(/document\.querySelectorAll\('\.anime-schedule-btn'\)/g, "document.querySelectorAll('.sched-tab-btn')");
html = html.replace(/btn\.className = "anime-schedule-btn .*?"/g, 'btn.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 shrink-0"');
html = html.replace(/const activeTab = document\.getElementById\(\`animeSchedule-\$\{dayFilter\}\`\)/g, 'const activeTab = document.getElementById(`schedTab-${dayFilter}`)');
html = html.replace(/activeTab\.className = "anime-schedule-btn .*?"/g, 'activeTab.className = "sched-tab-btn px-3.5 py-1.5 rounded-full text-xs font-bold transition-all bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 shrink-0"');

fs.writeFileSync('consumet.html', html);
