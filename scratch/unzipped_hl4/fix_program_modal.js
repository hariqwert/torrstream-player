const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const modalRegex = /<hr class="border-white\/5">[\s\S]*?<h3 class="text-\[10px\] font-black uppercase tracking-widest text-slate-400">Description<\/h3>[\s\S]*?<p id="epgModalDesc"[^>]*>[\s\S]*?<\/p>[\s\S]*?<\/div>/;

const modalReplacement = `<hr class="border-white/5">
                <div class="space-y-2">
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</h3>
                    <p id="epgModalDesc" class="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                        No description is available for this broadcast program.
                    </p>
                </div>
                <div id="epgModalPlayBtnContainer"></div>`;

html = html.replace(modalRegex, modalReplacement);

const jsRegex = /function openEpgProgramDetails\(prog, channelName\) \{[\s\S]*?document\.getElementById\('epgModalDesc'\)\.textContent = prog\.desc \? prog\.desc : "No program description has been provided by the external broadcaster\.";/;

const jsReplacement = `function openEpgProgramDetails(prog, channelName, channelUrl) {
            const modal = document.getElementById('epgProgramModal');
            if (!modal) return;

            document.getElementById('epgModalTitle').textContent = prog.title;
            document.getElementById('epgModalChannel').innerHTML = \`<i data-lucide="tv" class="w-3.5 h-3.5 text-amber-400"></i> \${channelName}\`;
            
            const startLabel = prog.start ? formatTime12h(prog.start) : "";
            const endLabel = prog.end ? formatTime12h(prog.end) : "";
            document.getElementById('epgModalTime').textContent = \`\${startLabel} - \${endLabel}\`;
            
            if (prog.start && prog.end) {
                const durationMins = Math.round((prog.end.getTime() - prog.start.getTime()) / (60 * 1000));
                document.getElementById('epgModalDuration').textContent = \`\${durationMins} Mins\`;
            } else {
                document.getElementById('epgModalDuration').textContent = "Unknown Duration";
            }

            document.getElementById('epgModalCategory').textContent = prog.category || "Broadcast";
            document.getElementById('epgModalDesc').textContent = prog.desc ? prog.desc : "No program description has been provided by the external broadcaster.";

            const playBtnContainer = document.getElementById('epgModalPlayBtnContainer');
            if (playBtnContainer) {
                if (channelUrl) {
                    playBtnContainer.innerHTML = \`<button onclick="closeEpgProgramModal(); openFullscreenPlayer('\${channelUrl.replace(/'/g, "\\\\'")}', '\${channelName.replace(/'/g, "\\\\'")}')" class="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"><i data-lucide="play" class="w-4 h-4 fill-white"></i> Play Live Channel</button>\`;
                } else {
                    playBtnContainer.innerHTML = '';
                }
            }`;

html = html.replace(jsRegex, jsReplacement);

// also update the call in timeline rendering
html = html.replace(/card\.onclick = \(\) => openEpgProgramDetails\(prog, chan\.name\);/g, `card.onclick = () => openEpgProgramDetails(prog, chan.name, chan.url);`);
html = html.replace(/onclick="openEpgProgramDetails\(\{title: '\$\{prog\.title\.replace/g, `onclick="openEpgProgramDetails({title: '\${prog.title.replace`);
// wait, the channel modal also calls it. Let's fix that one too.
// onclick="openEpgProgramDetails({title: '${prog.title.replace(/'/g, "\\'")}', start: new Date('${prog.start}'), end: new Date('${prog.end}'), desc: '${(prog.desc || "").replace(/'/g, "\\'")}', category: '${(prog.category || "").replace(/'/g, "\\'")}'}, '${channelName.replace(/'/g, "\\'")}')"
// to pass channelUrl

fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
