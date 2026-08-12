const fs = require('fs');

let code = fs.readFileSync('public/hari.js', 'utf8');

// Update updatePowerUI
const oldUpdatePowerUI = /function updatePowerUI\(status\) \{[\s\S]*?lucide\.createIcons\(\);\s*\}/;

const newUpdatePowerUI = `function updatePowerUI(status) {
    const card = document.getElementById('systemPowerCard');
    const iconContainer = document.getElementById('powerIconContainer');
    const statusText = document.getElementById('powerStatusText');
    const btn = document.getElementById('powerBtn');
    const btnText = document.getElementById('powerBtnText');
    
    if (status === 'active') {
        if (card) {
            card.classList.remove('border-red-500/50', 'bg-red-500/5');
            card.classList.add('border-green-500/50', 'bg-green-500/5');
        }
        if (iconContainer) {
            iconContainer.className = 'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg bg-green-500 text-white';
            iconContainer.innerHTML = '<i data-lucide="zap" class="w-8 h-8"></i>';
        }
        if (statusText) {
            statusText.innerText = 'ONLINE';
            statusText.className = 'uppercase tracking-widest text-sm bg-green-500/10 text-green-500 px-3 py-1 rounded-full border border-green-500/20 ml-2';
        }
        if (btn) {
            btn.className = 'px-8 py-4 rounded-2xl font-black text-sm tracking-widest flex items-center gap-3 transition-all active:scale-[0.95] shadow-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer';
        }
        if (btnText) btnText.innerText = 'TURN SYSTEM OFF';
    } else {
        if (card) {
            card.classList.remove('border-green-500/50', 'bg-green-500/5');
            card.classList.add('border-red-500/50', 'bg-red-500/5');
        }
        if (iconContainer) {
            iconContainer.className = 'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg bg-gray-800 text-red-500 border border-red-500/20';
            iconContainer.innerHTML = '<i data-lucide="shield-off" class="w-8 h-8"></i>';
        }
        if (statusText) {
            statusText.innerText = 'OFFLINE';
            statusText.className = 'uppercase tracking-widest text-sm bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20 ml-2';
        }
        if (btn) {
            btn.className = 'px-8 py-4 rounded-2xl font-black text-sm tracking-widest flex items-center gap-3 transition-all active:scale-[0.95] shadow-xl bg-green-600 hover:bg-green-700 text-white cursor-pointer';
        }
        if (btnText) btnText.innerText = 'RESTORE SYSTEM';
    }
    if (window.lucide && window.lucide.createIcons) lucide.createIcons();
}`;

code = code.replace(oldUpdatePowerUI, newUpdatePowerUI);

// Update switchTab overview to call fetchSystemStatus
code = code.replace(
    /if \(tabId === 'overview'\) fetchStats\(\);/,
    `if (tabId === 'overview') { fetchStats(); fetchSystemStatus(); }`
);

code = code.replace(
    /if \(tabId === 'system'\) \{/,
    `if (tabId === 'system') { fetchSystemStatus();`
);

fs.writeFileSync('public/hari.js', code);
console.log('patched hari.js successfully');
