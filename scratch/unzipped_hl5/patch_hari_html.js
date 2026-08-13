const fs = require('fs');

let code = fs.readFileSync('public/hari.html', 'utf8');

if (!code.includes('consumetMaintenanceToggle')) {
    const replacement = `                                </label>
                            </div>
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900/40 border border-gray-800">
                                <div class="flex items-center gap-3">
                                    <div class="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                                        <i data-lucide="monitor" class="w-5 h-5"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-white">Consumet HTML Maintenance</p>
                                        <p class="text-[11px] text-gray-500">Locks consumet.html behind a 503 template.</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="consumetMaintenanceToggle" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900/40 border border-gray-800">
                                <div class="flex items-center gap-3">
                                    <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                        <i data-lucide="play-circle" class="w-5 h-5"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-white">Play PHP Maintenance</p>
                                        <p class="text-[11px] text-gray-500">Locks play.php behind a 503 template.</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="playMaintenanceToggle" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                            <div class="flex items-center justify-between p-4 rounded-xl bg-gray-900/40 border border-gray-800">
                                <div class="flex items-center gap-3">
                                    <div class="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400">
                                        <i data-lucide="play-circle" class="w-5 h-5"></i>
                                    </div>
                                    <div>
                                        <p class="font-bold text-sm text-white">Play Consumet PHP Maintenance</p>
                                        <p class="text-[11px] text-gray-500">Locks play_consumet.php behind a 503 template.</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="playConsumetMaintenanceToggle" class="sr-only peer">
                                    <div class="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
                                </label>
                            </div>`;
    code = code.replace(
        /                                <label class="relative inline-flex items-center cursor-pointer">\s*<input type="checkbox" id="maintenanceToggle" class="sr-only peer">\s*<div class="[^"]+"><\/div>\s*<\/label>\s*<\/div>/,
        match => match + replacement
    );
    fs.writeFileSync('public/hari.html', code);
}
