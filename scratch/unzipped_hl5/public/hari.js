// State Variables
let currentTab = 'portals';
let heartbeatInterval = null;
let heartbeatTimeLeft = 60;
let token = localStorage.getItem('admin_token') || '';

// DOM Elements
const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const loginErrorText = document.getElementById('loginErrorText');

const securityIpDisplay = document.getElementById('securityIpDisplay');
const heartbeatTimer = document.getElementById('heartbeatTimer');

// Tabs
const tabContents = {
    overview: document.getElementById('tabContent-overview'),
    portals: document.getElementById('tabContent-portals'),
    m3u: document.getElementById('tabContent-m3u'),
    monitor: document.getElementById('tabContent-monitor'),
    system: document.getElementById('tabContent-system'),
    sports: document.getElementById('tabContent-sports'),
    liveevents: document.getElementById('tabContent-liveevents')
};

// Dashboard Elements
const statActivePortal = document.getElementById('stat-activePortal');
const statTotalChannels = document.getElementById('stat-totalChannels');
const statActiveSessions = document.getElementById('stat-activeSessions');
const statBlockedIps = document.getElementById('stat-blockedIps');
const dashboardLogs = document.getElementById('dashboard-logs');

// Monitor Elements
const activeSessionsList = document.getElementById('activeSessionsList');
const activeSessionsCount = document.getElementById('activeSessionsCount');
const blacklistList = document.getElementById('blacklistList');
const incidentsList = document.getElementById('incidentsList');
const manualBlockIp = document.getElementById('manualBlockIp');

// Portal Manager Elements
const portalForm = document.getElementById('portalForm');
const portalEditId = document.getElementById('portalEditId');
const portalName = document.getElementById('portalName');
const portalUrl = document.getElementById('portalUrl');
const portalMac = document.getElementById('portalMac');
const portalModel = document.getElementById('portalModel');
const portalSn = document.getElementById('portalSn');
const portalD1 = document.getElementById('portalD1');
const portalD2 = document.getElementById('portalD2');
const portalSig = document.getElementById('portalSig');
const portalImageVersion = document.getElementById('portalImageVersion');
const portalToken = document.getElementById('portalToken');
const portalUserAgent = document.getElementById('portalUserAgent');
const portalsTableBody = document.getElementById('portalsTableBody');
const formTitle = document.getElementById('formTitle');
const savePortalBtnText = document.getElementById('savePortalBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');

// M3U Vault Elements
const m3uUploadForm = document.getElementById('m3uUploadForm');
const m3uName = document.getElementById('m3uName');
const m3uFileInput = document.getElementById('m3uFileInput');
const dropZone = document.getElementById('dropZone');
const dropZoneText = document.getElementById('dropZoneText');
const uploadStatus = document.getElementById('uploadStatus');
const m3uTableBody = document.getElementById('m3uTableBody');

// Maintenance Elements
const maintenanceForm = document.getElementById('maintenanceForm');
const maintenanceToggle = document.getElementById('maintenanceToggle');
const maintenanceTemplate = document.getElementById('maintenanceTemplate');

// Feature Toggles
const featureToggles = {
    m3uEnabled: document.getElementById('feat-m3u'),
    stalkerEnabled: document.getElementById('feat-stalker'),
    firewallEnabled: document.getElementById('feat-firewall'),
    publicPlaylistEnabled: document.getElementById('feat-public')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initApp();
    setupKeyboardShortcuts();
});

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Only trigger if not typing in an input or textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key.toLowerCase();
        
        // Tab Navigation
        if (key === '1') switchTab('overview');
        if (key === '2' || key === 't') switchTab('portals');
        if (key === '3' || key === 'm') switchTab('m3u');
        if (key === '4') switchTab('monitor');
        if (key === '5') switchTab('system');

        // Actions
        if (key === 'r') {
            e.preventDefault();
            switchTab(currentTab);
            showToast('Refreshing', `Updating ${currentTab} data...`, 'info');
        }
        if (key === 'l') {
            e.preventDefault();
            handleLogout();
        }
        if (key === 'p' && currentTab === 'monitor') {
            e.preventDefault();
            toggleSystemPower();
        }
    });
}

function initApp() {
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
}

// --- VIEW CONTROLS ---
function showLogin() {
    loginView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    stopHeartbeat();
}

function showDashboard() {
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    
    // Switch to first tab (Overview)
    switchTab('overview');
    startHeartbeat();
}

// --- DASHBOARD & ANALYTICS ---
async function fetchStats() {
    try {
        const res = await secureFetch('/api/admin/stats');
        const data = await res.json();
        
        if (data.status === 'success') {
            const s = data.stats;
            statActivePortal.innerText = s.activePortal;
            statTotalChannels.innerText = (s.m3uChannels).toLocaleString();
            statActiveSessions.innerText = s.activeSessions;
            statBlockedIps.innerText = s.totalBlacklisted;
            
            addDashboardLog(`[STATS] Health check: ${s.activeSessions} active streams, ${s.totalBlacklisted} IPs blocked.`);
        }
    } catch (e) {
        console.error('Failed to fetch stats:', e);
    }
}

function addDashboardLog(msg) {
    if (!dashboardLogs) return;
    const time = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = 'hover:text-white transition-colors cursor-default mb-1';
    entry.innerHTML = `<span class="text-gray-700 mr-2">[${time}]</span> ${msg}`;
    dashboardLogs.prepend(entry);
    
    if (dashboardLogs.children.length > 30) {
        dashboardLogs.removeChild(dashboardLogs.lastChild);
    }
}

async function clearSystemCache() {
    if (!confirm('Optimize System: Purge all temporary API cache files? This will force fresh portal synchronization.')) return;
    
    try {
        const res = await secureFetch('/api/admin/system/clear-cache', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Cache Purged', data.message, 'success');
            addDashboardLog(`[CLEANUP] ${data.message}`);
        }
    } catch (e) {}
}

// --- SECURE AUTHENTICATION ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            token = data.token;
            localStorage.setItem('admin_token', token);
            passwordInput.value = '';
            showToast('Success', 'IP-bound session activated!', 'success');
            showDashboard();
        } else {
            showLoginError(data.message || 'Authentication failed');
        }
    } catch (err) {
        showLoginError('Network connection failed. Please try again.');
    }
});

function showLoginError(msg) {
    loginErrorText.textContent = msg;
    loginError.classList.remove('hidden');
}

function handleLogout() {
    token = '';
    localStorage.removeItem('admin_token');
    showLogin();
    showToast('Session Closed', 'You have been securely logged out.', 'info');
}

// --- 1-MINUTE SECURITY HEARTBEAT LOOP ---
function startHeartbeat() {
    stopHeartbeat();
    
    // Initial immediate ping
    pingHeartbeat();
    
    heartbeatTimeLeft = 60;
    heartbeatInterval = setInterval(() => {
        heartbeatTimeLeft--;
        heartbeatTimer.textContent = `${heartbeatTimeLeft}s`;
        
        if (heartbeatTimeLeft <= 0) {
            pingHeartbeat();
            heartbeatTimeLeft = 60;
        }
    }, 1000);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

async function pingHeartbeat() {
    try {
        const res = await fetch('/api/admin/heartbeat', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            // Heartbeat failed (IP mismatch or expired token)
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Session verification failed');
        }
        
        const data = await res.json();
        securityIpDisplay.textContent = data.ip;
    } catch (err) {
        console.error('Security Breach or Session Timeout:', err.message);
        token = '';
        localStorage.removeItem('admin_token');
        showLogin();
        
        // Show urgent warning modal/alert
        alert(`SESSION TERMINATED:\n${err.message || 'IP mismatch or session expired. Safety gate triggered.'}`);
    }
}

// --- TAB ROUTING ---
function switchTab(tabId) {
    currentTab = tabId;
    
    // Update active tab styles
    ['overview', 'portals', 'm3u', 'monitor', 'system', 'sports', 'liveevents'].forEach(id => {
        const btn = document.getElementById(`tabBtn-${id}`);
        if (!btn) return;
        if (id === tabId) {
            btn.classList.add('bg-red-500/10', 'text-white', 'border-l-4', 'border-red-500', 'rounded-l-none');
            btn.classList.remove('text-gray-400', 'hover:bg-gray-900/50');
            if (tabContents[id]) tabContents[id].classList.remove('hidden');
        } else {
            btn.classList.remove('bg-red-500/10', 'text-white', 'border-l-4', 'border-red-500', 'rounded-l-none');
            btn.classList.add('text-gray-400', 'hover:bg-gray-900/50');
            if (tabContents[id]) tabContents[id].classList.add('hidden');
        }
    });

    // Refresh dynamic data
    if (tabId === 'overview') { fetchStats(); fetchSystemStatus(); }
    if (tabId === 'portals') fetchPortals();
    if (tabId === 'm3u') fetchPlaylists();
    if (tabId === 'monitor') {
        loadActivity();
        loadBlacklist();
        loadIncidents();
    }
    if (tabId === 'system') { fetchSystemStatus();
        fetchMaintenanceSettings();
        fetchDeveloperSettings();
        fetchFeatures();
    }
    if (tabId === 'sports') {
        loadSportsStreams();
    }

    lucide.createIcons();
}

// --- API HELPER FOR SECURE REQUESTS ---
async function secureFetch(url, options = {}) {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string' && !options.headers['Content-Type'] && !options.headers['content-type']) {
        options.headers['Content-Type'] = 'application/json';
    }
    
    try {
        const res = await fetch(url, options);
        if (res.status === 401 || res.status === 418) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || 'Session expired');
        }
        return res;
    } catch (err) {
        if (err.message.includes('Session expired') || err.message.includes('Session hijacked')) {
            token = '';
            localStorage.removeItem('admin_token');
            showLogin();
            alert(`Access Revoked: ${err.message}`);
        }
        throw err;
    }
}

// --- LIVE ACTIVITY MONITOR ---

async function fetchSystemStatus() {
    try {
        const res = await secureFetch('/api/admin/system/status');
        const data = await res.json();
        if (data.status === 'success') {
            updatePowerUI(data.systemStatus);
        }
    } catch (e) {}
}

async function toggleSystemPower() {
    const btn = document.getElementById('powerBtn');
    const btnText = document.getElementById('powerBtnText');
    const originalText = btnText.innerText;
    
    if (!confirm("CRITICAL ACTION: Are you sure you want to change the Global System Power State? This affects all users immediately.")) return;
    
    try {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btnText.innerText = 'PROCESSING...';
        
        const res = await secureFetch('/api/admin/system/toggle', { method: 'POST' });
        const data = await res.json();
        
        if (data.status === 'success') {
            updatePowerUI(data.systemStatus);
            const msg = data.systemStatus === 'active' ? 'System restored and online.' : 'System successfully locked down.';
            showToast('System Power Updated', msg, data.systemStatus === 'active' ? 'success' : 'error');
            addDashboardLog(`[SYSTEM] Power state changed to ${data.systemStatus.toUpperCase()}`);
        } else {
            throw new Error(data.message || 'Toggle failed');
        }
    } catch (e) {
        showToast('System Error', e.message || 'Failed to toggle power state.', 'error');
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
}

function updatePowerUI(status) {
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
}

async function loadActivity() {
    fetchSystemStatus(); // Update power switch state too
    try {
        const res = await secureFetch('/api/admin/sessions');
        const data = await res.json();
        
        if (data.status === 'success') {
            activeSessionsCount.innerText = `${data.sessions.length} ONLINE`;
            
            if (data.sessions.length === 0) {
                activeSessionsList.innerHTML = `
                    <tr>
                        <td colspan="4" class="px-6 py-12 text-center text-gray-500 text-sm">
                            <div class="flex flex-col items-center gap-3 opacity-50">
                                <i data-lucide="wifi-off" class="w-8 h-8"></i>
                                <p>No active stream connections detected.</p>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                activeSessionsList.innerHTML = data.sessions.map(s => `
                    <tr class="hover:bg-gray-900/20 transition-colors">
                        <td class="px-6 py-4">
                            <div class="flex flex-col">
                                <span class="font-bold text-white mono text-sm">${s.ip}</span>
                                <span class="text-[10px] text-gray-500 uppercase tracking-tighter">Authorized Client</span>
                            </div>
                        </td>
                        <td class="px-6 py-4">
                             <div class="flex flex-col">
                                <span class="font-bold text-emerald-400 text-xs">${s.channelId || 'Unknown'}</span>
                                <span class="text-[9px] text-gray-500 uppercase font-bold tracking-widest">${s.type || 'Source'}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-xs text-gray-400">
                            ${new Date(s.startTime).toLocaleTimeString()}
                        </td>
                        <td class="px-6 py-4 text-right">
                            <span class="text-[10px] text-gray-500 truncate max-w-[200px] block" title="${s.userAgent}">${s.userAgent}</span>
                        </td>
                    </tr>
                `).join('');
            }
            lucide.createIcons();
        }
    } catch (e) {
        console.error('Failed to load activity:', e);
    }
}

async function loadBlacklist() {
    try {
        const res = await secureFetch('/api/admin/blacklist');
        const data = await res.json();
        
        if (data.status === 'success') {
            if (data.blacklist.length === 0) {
                blacklistList.innerHTML = `
                    <tr>
                        <td colspan="2" class="px-6 py-8 text-center text-gray-600 text-xs italic">
                            No blocked IP addresses.
                        </td>
                    </tr>
                `;
            } else {
                blacklistList.innerHTML = data.blacklist.map(ip => `
                    <tr class="hover:bg-red-500/5 transition-colors text-xs">
                        <td class="px-6 py-4 font-mono text-red-400">${ip}</td>
                        <td class="px-6 py-4 text-right">
                            <button onclick="unblockIp('${ip}')" class="text-[10px] font-bold text-gray-400 hover:text-white transition-colors bg-gray-800 px-3 py-1.5 rounded-lg">
                                Unblock
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load blacklist:', e);
    }
}

async function loadIncidents() {
    try {
        const res = await secureFetch('/api/admin/incidents');
        const data = await res.json();
        
        if (data.status === 'success') {
            if (data.incidents.length === 0) {
                incidentsList.innerHTML = `
                    <tr>
                        <td colspan="3" class="px-6 py-8 text-center text-gray-600 text-[10px] italic">
                            Clean security slate.
                        </td>
                    </tr>
                `;
            } else {
                incidentsList.innerHTML = data.incidents.map(inc => `
                    <tr class="hover:bg-amber-500/5 transition-colors text-[10px]">
                        <td class="px-6 py-3">
                            <div class="flex flex-col">
                                <span class="font-bold text-amber-500 mono">${inc.ip}</span>
                                <span class="text-gray-500">Tried: "${inc.username}"</span>
                            </div>
                        </td>
                        <td class="px-6 py-3 text-gray-500">
                            ${new Date(inc.timestamp).toLocaleString()}
                        </td>
                        <td class="px-6 py-3 text-right">
                            <button onclick="unblockIp('${inc.ip}')" class="text-white bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-[9px] font-bold">
                                Restore
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        }
    } catch (e) {
        console.error('Failed to load incidents:', e);
    }
}

async function terminateSession(ip) {
    if (!confirm(`Are you sure you want to drop connection for ${ip}?`)) return;
    try {
        const res = await secureFetch('/api/admin/sessions/terminate', {
            method: 'POST',
            body: JSON.stringify({ ip })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Session Terminated', `IP ${ip} removed from monitor.`, 'info');
            loadActivity();
        }
    } catch (e) {}
}

async function blockIp(ip) {
    if (!confirm(`PERMANENT BLOCK: Block IP ${ip} and all future access?`)) return;
    try {
        const res = await secureFetch('/api/admin/blacklist', {
            method: 'POST',
            body: JSON.stringify({ ip })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('IP Blocked', `Address ${ip} added to firewall blacklist.`, 'error');
            loadActivity();
            loadBlacklist();
        }
    } catch (e) {}
}

async function blockIpManually() {
    const ip = manualBlockIp.value.trim();
    if (!ip) return;
    await blockIp(ip);
    manualBlockIp.value = '';
}

async function unblockIp(ip) {
    try {
        const res = await secureFetch(`/api/admin/blacklist/${ip}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('IP Unblocked', `Address ${ip} restored to access list.`, 'success');
            loadBlacklist();
            loadIncidents();
            loadActivity();
        }
    } catch (e) {}
}

// --- PORTAL MANAGER LOGIC ---
async function fetchPortals() {
    try {
        const res = await secureFetch('/api/admin/portals');
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            renderPortals(data.portals);
        }
    } catch (err) {
        console.error('Failed to load portals:', err);
    }
}

function renderPortals(portals) {
    window.portalsData = portals;
    portalsTableBody.innerHTML = '';
    
    if (!portals || portals.length === 0) {
        portalsTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="py-12 text-center text-gray-500 font-medium">
                    <div class="flex flex-col items-center justify-center gap-2">
                        <i data-lucide="server-off" class="w-8 h-8 text-gray-600"></i>
                        <span>No portals registered yet. Add one to get started!</span>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    portals.forEach(portal => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-800/40 hover:bg-gray-900/30 transition-colors';
        row.innerHTML = `
            <td class="py-4 pl-2 font-bold text-white max-w-[150px] truncate">
                <div class="flex items-center gap-2">
                    <span>${portal.name}</span>
                    ${portal.isDefault ? `
                        <span class="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Active Default
                        </span>
                    ` : ''}
                </div>
            </td>
            <td class="py-4 max-w-[200px] truncate text-gray-400 mono text-xs">${portal.url}</td>
            <td class="py-4 text-gray-400 mono text-xs">${portal.type === 'xtream' ? `<span class="bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">XTREAM</span> <span class="ml-1 text-slate-300 font-bold">${portal.username}</span>` : `<span class="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold px-2 py-0.5 rounded-md uppercase text-[10px]">STALKER</span> <span class="ml-1 text-slate-300 font-bold">${portal.mac || ''}</span>`}</td>
            <td class="py-4 text-right pr-2">
                <div class="inline-flex gap-1.5">
                    ${!portal.isDefault ? `
                        <button onclick="setDefaultPortal('${portal.id}')" class="text-xs bg-gray-900 hover:bg-blue-600 hover:text-white border border-gray-800 text-gray-400 px-2.5 py-1.5 rounded-lg transition-all" title="Set Active Default">
                            Set Active
                        </button>
                    ` : ''}
                    <button onclick="editPortal('${portal.id}')" class="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors" title="Edit Portal">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deletePortal('${portal.id}')" class="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Portal">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        portalsTableBody.appendChild(row);
    });
    lucide.createIcons();
}

portalForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = portalEditId.value;
    const payload = {
        name: portalName.value.trim(),
        url: portalUrl.value.trim(),
        type: document.getElementById('portalType').value,
        username: document.getElementById('portalUsername').value.trim(),
        password: document.getElementById('portalPassword').value.trim(),
        mac: portalMac.value.trim(),
        model: portalModel.value,
        sn: portalSn ? portalSn.value.trim() : "",
        device_id1: portalD1 ? portalD1.value.trim() : "",
        device_id2: portalD2 ? portalD2.value.trim() : "",
        signature: portalSig ? portalSig.value.trim() : "",
        image_version: portalImageVersion ? portalImageVersion.value.trim() : "",
        token: portalToken ? portalToken.value.trim() : "",
        user_agent: portalUserAgent ? portalUserAgent.value.trim() : ""
    };

    const isEdit = !!id;
    const endpoint = isEdit ? `/api/admin/portals/${id}` : '/api/admin/portals';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await secureFetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            showToast('Success', isEdit ? 'Portal updated!' : 'Portal registered!', 'success');
            resetPortalForm();
            fetchPortals();
        } else {
            showToast('Error', data.message || 'Operation failed', 'error');
        }
    } catch (err) {
        showToast('Error', 'API request failed.', 'error');
    }
});

function editPortal(id) {
    const portal = (window.portalsData || []).find(p => p.id === id);
    if (!portal) return;

    portalEditId.value = id;
    portalName.value = portal.name || '';
    portalUrl.value = portal.url || '';
    
    document.getElementById('portalType').value = portal.type || 'stalker';
    togglePortalTypeFields();

    if (portal.type === 'xtream') {
        document.getElementById('portalUsername').value = portal.username || '';
        document.getElementById('portalPassword').value = portal.password || '';
    } else {
        portalMac.value = portal.mac || '';
    }
    
    portalModel.value = portal.model || 'MAG250';
    
    if (portalSn) portalSn.value = portal.sn || '';
    if (portalD1) portalD1.value = portal.device_id1 || '';
    if (portalD2) portalD2.value = portal.device_id2 || '';
    if (portalSig) portalSig.value = portal.signature || '';
    if (portalImageVersion) portalImageVersion.value = portal.image_version || '';
    if (portalToken) portalToken.value = portal.token || '';
    if (portalUserAgent) portalUserAgent.value = portal.user_agent || '';

    formTitle.textContent = 'Edit Portal Settings';
    savePortalBtnText.textContent = 'Apply Updates';
    cancelEditBtn.classList.remove('hidden');
    portalName.focus();
}

function resetPortalForm() {
    portalEditId.value = '';
    portalForm.reset();
    document.getElementById('portalType').value = 'stalker';
    document.getElementById('portalUsername').value = '';
    document.getElementById('portalPassword').value = '';
    togglePortalTypeFields();
    if(portalSn) portalSn.value = "";
    if(portalD1) portalD1.value = "";
    if(portalD2) portalD2.value = "";
    if(portalSig) portalSig.value = "";
    if(portalImageVersion) portalImageVersion.value = "";
    if(portalToken) portalToken.value = "";
    if(portalUserAgent) portalUserAgent.value = "";
    formTitle.textContent = 'Register Portal';
    savePortalBtnText.textContent = 'Save Portal';
    cancelEditBtn.classList.add('hidden');
}

async function setDefaultPortal(id) {
    try {
        const res = await secureFetch(`/api/admin/portals/${id}/default`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast('Active Portal Configured', data.message, 'success');
            fetchPortals();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (err) {
        console.error('Failed to set default portal:', err);
    }
}

async function deletePortal(id) {
    if (!confirm('Are you absolutely sure you want to delete this portal config from the system database?')) return;
    try {
        const res = await secureFetch(`/api/admin/portals/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast('Deleted', 'Portal config unlinked.', 'success');
            fetchPortals();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (err) {
        console.error('Failed to delete portal:', err);
    }
}


// --- M3U LOCAL VAULT LOGIC ---

// Drag and drop events
['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('border-emerald-500', 'bg-emerald-500/5');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-emerald-500', 'bg-emerald-500/5');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length) {
        m3uFileInput.files = files;
        updateDropZoneText(files[0].name);
    }
});

m3uFileInput.addEventListener('change', () => {
    if (m3uFileInput.files.length) {
        updateDropZoneText(m3uFileInput.files[0].name);
    }
});

function updateDropZoneText(filename) {
    dropZoneText.innerHTML = `Selected: <span class="text-emerald-400 font-bold">${filename}</span>`;
}

let currentAdminM3UMethod = 'file';

window.setAdminM3UMethod = function(method) {
    currentAdminM3UMethod = method;
    const btnUrl = document.getElementById('adminMethodUrl');
    const btnFile = document.getElementById('adminMethodFile');
    const urlGroup = document.getElementById('adminM3uUrlGroup');
    const fileGroup = document.getElementById('adminM3uFileGroup');

    if (method === 'url') {
        btnUrl.className = 'flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold transition-all border border-red-500';
        btnFile.className = 'flex-1 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold transition-all border border-gray-800';
        urlGroup.classList.remove('hidden');
        fileGroup.classList.add('hidden');
    } else {
        btnFile.className = 'flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold transition-all border border-red-500';
        btnUrl.className = 'flex-1 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold transition-all border border-gray-800';
        fileGroup.classList.remove('hidden');
        urlGroup.classList.add('hidden');
    }
}

m3uUploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = m3uName.value.trim();
    const url = document.getElementById('m3uUrlInput') ? document.getElementById('m3uUrlInput').value.trim() : '';
    const file = m3uFileInput.files[0];

    if (currentAdminM3UMethod === 'url') {
        if (!url) {
            showUploadStatus('Please enter a valid M3U URL.', 'error');
            return;
        }
        await submitM3U(name, url, '');
    } else {
        if (!file) {
            showUploadStatus('Please select or drop an M3U file.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            let base64Data = event.target.result;
            if (base64Data.includes('base64,')) {
                base64Data = base64Data.split('base64,')[1];
            }
            await submitM3U(name, '', base64Data);
        };
        reader.onerror = () => showUploadStatus('Failed to read file locally.', 'error');
        reader.readAsDataURL(file);
    }
});

async function submitM3U(name, url, file_content) {
    showUploadStatus('Processing and security scanning...', 'info');

    try {
        const payload = {
            action: 'm3u_save',
            name: name,
            url: url,
            file_content: file_content,
            password: '2008' // Use the fallback or verify bypass
        };

        const res = await fetch('/stalker_api.php?action=m3u_save', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok && data.status === 'success') {
            showUploadStatus('Playlist parsed and secured in Vault successfully!', 'success');
            m3uUploadForm.reset();
            dropZoneText.innerHTML = `Drag file here or click to browse`;
            fetchPlaylists();
            showToast('Vault Updated', 'Local M3U secured', 'success');
        } else {
            showUploadStatus(data.message || 'File upload rejected.', 'error');
        }
    } catch (err) {
        showUploadStatus('File processing failed due to severe size or server timeout.', 'error');
    }
}

function showUploadStatus(msg, type) {
    uploadStatus.classList.remove('hidden', 'bg-blue-500/10', 'text-blue-400', 'border-blue-500/20', 'bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20', 'bg-red-500/10', 'text-red-400', 'border-red-500/20');
    
    if (type === 'info') {
        uploadStatus.classList.add('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20');
    } else if (type === 'success') {
        uploadStatus.classList.add('bg-emerald-500/10', 'text-emerald-400', 'border-emerald-500/20');
    } else if (type === 'error') {
        uploadStatus.classList.add('bg-red-500/10', 'text-red-400', 'border-red-500/20');
    }
    uploadStatus.textContent = msg;
    uploadStatus.classList.remove('hidden');
}

async function fetchPlaylists() {
    try {
        const res = await secureFetch('/api/admin/m3u/playlists');
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            renderPlaylists(data.playlists, data.activeId);
        }
    } catch (err) {
        console.error('Failed to load playlists:', err);
    }
}

function renderPlaylists(playlists, activeId) {
    m3uTableBody.innerHTML = '';
    
    if (!playlists || playlists.length === 0) {
        m3uTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="py-12 text-center text-gray-500 font-medium">
                    <div class="flex flex-col items-center justify-center gap-2">
                        <i data-lucide="folder-search" class="w-8 h-8 text-gray-600"></i>
                        <span>No files saved in Local Vault.</span>
                    </div>
                </td>
            </tr>
        `;
        lucide.createIcons();
        return;
    }

    playlists.forEach(pl => {
        const isSelected = activeId === pl.id;
        const row = document.createElement('tr');
        row.className = `border-b border-gray-800/40 hover:bg-gray-900/30 transition-colors ${isSelected ? 'bg-emerald-500/[0.03]' : ''}`;
        row.innerHTML = `
            <td class="py-4 pl-2 font-bold text-white max-w-[150px] truncate">
                <div class="flex flex-col gap-0.5">
                    <span class="text-white flex items-center gap-2">
                        ${pl.name}
                        ${isSelected ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>' : ''}
                    </span>
                    <span class="text-[10px] text-gray-500 font-medium">Uploaded: ${new Date(pl.uploadedAt).toLocaleString()}</span>
                </div>
            </td>
            <td class="py-4 font-mono font-bold text-gray-300 text-xs">${pl.channelsCount} Channels</td>
            <td class="py-4 max-w-[150px] truncate text-gray-400 mono text-xs" title="${pl.filePath}">${pl.filePath}</td>
            <td class="py-4 text-right pr-2">
                <div class="inline-flex items-center gap-3">
                    <!-- Master Toggle -->
                    <div class="flex items-center gap-2 mr-2">
                        <span class="text-[9px] font-black uppercase tracking-widest ${isSelected ? 'text-emerald-500' : 'text-gray-600'}">${isSelected ? 'Active' : 'Disabled'}</span>
                        <button onclick="togglePlaylistState('${pl.id}', ${isSelected})" 
                            class="relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${isSelected ? 'bg-emerald-500' : 'bg-gray-800'}">
                            <span class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform ${isSelected ? 'translate-x-5' : 'translate-x-1'}"></span>
                        </button>
                    </div>

                    <button onclick="deletePlaylist('${pl.id}')" class="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Delete Playlist Permanent">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        m3uTableBody.appendChild(row);
    });
    lucide.createIcons();
}

async function activatePlaylist(id) {
    try {
        const res = await secureFetch(`/api/admin/m3u/playlists/${id}/activate`, { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast('Activated', data.message, 'success');
            fetchPlaylists();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (err) {
        console.error('Failed to activate playlist:', err);
    }
}

async function togglePlaylistState(id, currentlyActive) {
    // If it's active, toggle it off by switching back to Stalker Portal mode
    const targetId = currentlyActive ? 'portal' : id;
    await activatePlaylist(targetId);
}

async function deletePlaylist(id) {
    if (!confirm('Are you sure you want to permanently delete this playlist from secure local storage?')) return;
    try {
        const res = await secureFetch(`/api/admin/m3u/playlists/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
            showToast('Deleted', 'Playlist completely unlinked and uninstalled.', 'success');
            fetchPlaylists();
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (err) {
        console.error('Failed to delete playlist:', err);
    }
}


// --- DEVELOPER MODE LOGIC ---
async function fetchDeveloperSettings() {
    try {
        const res = await secureFetch('/api/admin/developer');
        const data = await res.json();
        
        document.getElementById('developerModeToggle').checked = !!data.developerMode;
        renderDevWhitelist(data.allowedDeveloperIps || []);
    } catch (err) {
        console.error('Failed to load developer settings:', err);
    }
}

async function toggleDeveloperMode(enabled) {
    try {
        await secureFetch('/api/admin/developer', {
            method: 'POST',
            body: JSON.stringify({ developerMode: enabled })
        });
        showToast(`Developer mode ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } catch (err) {
        showToast('Failed to update developer mode', 'error');
        document.getElementById('developerModeToggle').checked = !enabled;
    }
}

function renderDevWhitelist(ips) {
    const tbody = document.getElementById('devWhitelistTableBody');
    if (!tbody) return;
    
    if (ips.length === 0) {
        tbody.innerHTML = `<tr><td class="p-3 text-center text-xs text-gray-500 italic">No IPs whitelisted. External access is fully blocked.</td></tr>`;
        return;
    }

    tbody.innerHTML = ips.map(ip => `
        <tr class="hover:bg-gray-800/30 transition-colors">
            <td class="p-3 font-mono text-xs text-indigo-400">${ip}</td>
            <td class="p-3 text-right">
                <button onclick="removeDevWhitelistIp('${ip}')" class="text-gray-500 hover:text-red-500 transition-colors" title="Remove IP">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </td>
        </tr>
    `).join('');
    lucide.createIcons();
}

async function addDevWhitelistIp(event) {
    event.preventDefault();
    const input = document.getElementById('devWhitelistInput');
    const ip = input.value.trim();
    if (!ip) return;

    try {
        const res = await secureFetch('/api/admin/developer/whitelist', {
            method: 'POST',
            body: JSON.stringify({ ip })
        });
        const data = await res.json();
        if (data.status === 'success') {
            input.value = '';
            renderDevWhitelist(data.allowedDeveloperIps);
            showToast('IP added to whitelist', 'success');
        }
    } catch (err) {
        showToast('Failed to add IP', 'error');
    }
}

async function removeDevWhitelistIp(ip) {
    if (!confirm(`Are you sure you want to remove ${ip} from the developer whitelist?`)) return;
    
    try {
        const res = await secureFetch('/api/admin/developer/whitelist', {
            method: 'DELETE',
            body: JSON.stringify({ ip })
        });
        const data = await res.json();
        if (data.status === 'success') {
            renderDevWhitelist(data.allowedDeveloperIps);
            showToast('IP removed from whitelist', 'success');
        }
    } catch (err) {
        showToast('Failed to remove IP', 'error');
    }
}

// --- SYSTEM MAINTENANCE LOGIC ---
async function fetchMaintenanceSettings() {
    try {
        const res = await secureFetch('/api/admin/maintenance');
        const data = await res.json();
        
        maintenanceToggle.checked = !!data.maintenanceMode;
        if (document.getElementById('consumetMaintenanceToggle')) document.getElementById('consumetMaintenanceToggle').checked = !!data.consumetMaintenance;
        if (document.getElementById('playMaintenanceToggle')) document.getElementById('playMaintenanceToggle').checked = !!data.playMaintenance;
        if (document.getElementById('playConsumetMaintenanceToggle')) document.getElementById('playConsumetMaintenanceToggle').checked = !!data.playConsumetMaintenance;
        maintenanceTemplate.value = data.activeTemplate || 'Scheduled Downtime';
        
        const musicMode = data.maintenanceMusicMode || 'query';
        const musicQuery = data.maintenanceMusicQuery || 'lofi relax';
        
        document.getElementById('maintenanceMusicMode').value = musicMode;
        document.getElementById('maintenanceMusicQuery').value = musicQuery;
        
        if (document.getElementById('powerMusicMode')) {
            document.getElementById('powerMusicMode').value = musicMode;
            document.getElementById('powerMusicQuery').value = musicQuery;
        }

        window.adminSavedPlaylist = data.maintenanceMusicPlaylist || [];
        window.renderAdminSavedPlaylist();
        if (document.getElementById('powerSavedPlaylist')) {
            window.renderAdminSavedPlaylist('power');
        }
        toggleMusicInputs();
    } catch (err) {
        console.error('Failed to fetch maintenance details:', err);
    }
}

// Sync music settings between sections
window.syncMusicSettings = function(source) {
    const mode = document.getElementById(source === 'power' ? 'powerMusicMode' : 'maintenanceMusicMode').value;
    const query = document.getElementById(source === 'power' ? 'powerMusicQuery' : 'maintenanceMusicQuery').value;
    
    document.getElementById('maintenanceMusicMode').value = mode;
    document.getElementById('maintenanceMusicQuery').value = query;
    if (document.getElementById('powerMusicMode')) {
        document.getElementById('powerMusicMode').value = mode;
        document.getElementById('powerMusicQuery').value = query;
    }
    toggleMusicInputs();
};

window.saveMusicOnly = async function() {
    const payload = {
        maintenanceMode: maintenanceToggle.checked,
        consumetMaintenance: document.getElementById('consumetMaintenanceToggle') ? document.getElementById('consumetMaintenanceToggle').checked : false,
        playMaintenance: document.getElementById('playMaintenanceToggle') ? document.getElementById('playMaintenanceToggle').checked : false,
        playConsumetMaintenance: document.getElementById('playConsumetMaintenanceToggle') ? document.getElementById('playConsumetMaintenanceToggle').checked : false,
        activeTemplate: maintenanceTemplate.value,
        maintenanceMusicMode: document.getElementById('maintenanceMusicMode').value,
        maintenanceMusicQuery: document.getElementById('maintenanceMusicQuery').value.trim(),
        maintenanceMusicPlaylist: window.adminSavedPlaylist || []
    };

    try {
        const res = await secureFetch('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Success', 'Music settings saved globally', 'success');
        }
    } catch (e) {
        showToast('Error', 'Failed to save music settings', 'error');
    }
};

maintenanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        maintenanceMode: maintenanceToggle.checked,
        consumetMaintenance: document.getElementById('consumetMaintenanceToggle') ? document.getElementById('consumetMaintenanceToggle').checked : false,
        playMaintenance: document.getElementById('playMaintenanceToggle') ? document.getElementById('playMaintenanceToggle').checked : false,
        playConsumetMaintenance: document.getElementById('playConsumetMaintenanceToggle') ? document.getElementById('playConsumetMaintenanceToggle').checked : false,
        activeTemplate: maintenanceTemplate.value,
        maintenanceMusicMode: document.getElementById('maintenanceMusicMode').value,
        maintenanceMusicQuery: document.getElementById('maintenanceMusicQuery').value.trim(),
        maintenanceMusicPlaylist: window.adminSavedPlaylist || []
    };

    try {
        const res = await secureFetch('/api/admin/maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            showToast('System Updated', 'Maintenance Mode configurations saved!', 'success');
        } else {
            showToast('Error', data.message, 'error');
        }
    } catch (err) {
        showToast('Error', 'API save failed.', 'error');
    }
});

async function triggerCleanup(type) {
    const typesLabels = {
        cache: 'Clear Server Cache files',
        history: 'Clear Play History Logs',
        favorites: 'Clear Favorites alignment'
    };
    
    if (!confirm(`Are you sure you want to run cleanup action: "${typesLabels[type]}"?`)) return;

    try {
        const res = await secureFetch('/api/admin/system/cleanup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
        const data = await res.json();
        
        if (res.ok && data.status === 'success') {
            showToast('Purge Successful', data.message, 'success');
        } else {
            showToast('Cleanup Rejected', data.message, 'error');
        }
    } catch (err) {
        showToast('Error', 'Cleanup command execution failed.', 'error');
    }
}

// --- FEATURE MANAGEMENT ---
async function fetchFeatures() {
    try {
        const res = await secureFetch('/api/admin/features');
        const data = await res.json();
        if (data.status === 'success') {
            const f = data.features;
            featureToggles.m3uEnabled.checked = f.m3uEnabled;
            featureToggles.stalkerEnabled.checked = f.stalkerEnabled;
            featureToggles.firewallEnabled.checked = f.firewallEnabled;
            featureToggles.publicPlaylistEnabled.checked = f.publicPlaylistEnabled;
        }
    } catch (e) {
        console.error('Failed to fetch features:', e);
    }
}

async function updateFeature(name, value) {
    try {
        const res = await secureFetch('/api/admin/features', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [name]: value })
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Security Update', `Module ${name} state changed.`, 'info');
            addDashboardLog(`[SECURITY] Feature ${name} updated to ${value}`);
        }
    } catch (e) {
        showToast('Update Failed', 'Could not sync feature state to server.', 'error');
    }
}


// --- DYNAMIC UI TOAST ---
function showToast(title, message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastIconBg = document.getElementById('toastIconBg');
    const toastIcon = document.getElementById('toastIcon');

    toastTitle.textContent = title;
    toastMessage.textContent = message;

    // Reset styles
    toastIconBg.className = 'p-2 rounded-xl';
    toastIcon.className = 'w-4 h-4';

    if (type === 'success') {
        toastIconBg.classList.add('bg-emerald-500/10', 'text-emerald-400');
        toastIcon.setAttribute('data-lucide', 'check');
    } else if (type === 'error') {
        toastIconBg.classList.add('bg-red-500/10', 'text-red-400');
        toastIcon.setAttribute('data-lucide', 'shield-x');
    } else {
        toastIconBg.classList.add('bg-blue-500/10', 'text-blue-400');
        toastIcon.setAttribute('data-lucide', 'info');
    }

    lucide.createIcons();

    // Slide up and fade in
    toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        // Slide down and fade out
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 4000);
}

function togglePortalTypeFields() {
    const type = document.getElementById('portalType').value;
    const stalkerFields = document.getElementById('stalkerFields');
    const xtreamFields = document.getElementById('xtreamFields');
    
    if (type === 'xtream') {
        stalkerFields.classList.add('hidden');
        xtreamFields.classList.remove('hidden');
        document.getElementById('portalMac').removeAttribute('required');
        document.getElementById('portalUsername').setAttribute('required', 'true');
        document.getElementById('portalPassword').setAttribute('required', 'true');
    } else {
        stalkerFields.classList.remove('hidden');
        xtreamFields.classList.add('hidden');
        document.getElementById('portalMac').setAttribute('required', 'true');
        document.getElementById('portalUsername').removeAttribute('required');
        document.getElementById('portalPassword').removeAttribute('required');
    }
}

function toggleMusicInputs() {
    const mode = document.getElementById('maintenanceMusicMode').value;
    const container = document.getElementById('musicQueryContainer');
    if (mode === 'query') {
        if (container) container.classList.remove('hidden');
    } else {
        if (container) container.classList.add('hidden');
    }
}

// Initial binding
window.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('portalType')) togglePortalTypeFields();
    if (document.getElementById('maintenanceMusicMode')) toggleMusicInputs();
    
    // Start drawing static admin visualizer wave
    drawAdminWaveform();
});

let adminAnimationId = null;
let adminTracksQueue = [];
window.adminSavedPlaylist = [];

window.drawAdminWaveform = function() {
    const canvas = document.getElementById('adminVisualizer');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.clientWidth;
    const height = canvas.height = canvas.clientHeight;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    const audio = document.getElementById('adminMusicPlayer');
    const isPlaying = audio && !audio.paused && audio.currentTime > 0;

    ctx.lineWidth = 3.5;
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#f472b6'); // Pink
    gradient.addColorStop(0.5, '#3b82f6'); // Blue
    gradient.addColorStop(1, '#14b8a6'); // Teal
    ctx.strokeStyle = gradient;
    ctx.shadowBlur = isPlaying ? 10 : 0;
    ctx.shadowColor = '#14b8a6';

    ctx.beginPath();
    const pointsCount = 100;
    const sliceWidth = width / pointsCount;
    let x = 0;
    const time = Date.now() * 0.005;

    for (let i = 0; i < pointsCount; i++) {
        let amplitude = 2;
        if (isPlaying) {
            const centerFactor = 1 - Math.abs(i - pointsCount/2) / (pointsCount/2);
            amplitude = 4 + (Math.sin(i * 0.2 + time) * Math.cos(i * 0.08 - time * 0.6) * 14 * centerFactor);
        } else {
            amplitude = Math.sin(i * 0.1 + time * 0.2) * 2.5;
        }
        const y = centerY + amplitude;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
    }

    ctx.lineTo(width, centerY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    adminAnimationId = requestAnimationFrame(window.drawAdminWaveform);
};

window.addTrackToAdminPlaylist = function(idx, target = 'maintenance') {
    const track = adminTracksQueue[idx];
    if (!track) return;

    if (window.adminSavedPlaylist.length >= 10) {
        showToast('Error', 'Saved playlist limit is 10 tracks!', 'error');
        return;
    }

    if (window.adminSavedPlaylist.some(t => t.url === track.url)) {
        showToast('Info', 'Track is already in the playlist!', 'info');
        return;
    }

    window.adminSavedPlaylist.push(track);
    window.renderAdminSavedPlaylist();
    if (document.getElementById('powerSavedPlaylist')) {
        window.renderAdminSavedPlaylist('power');
    }
    showToast('Success', 'Track added to saved playlist', 'success');
};

window.removeTrackFromAdminPlaylist = function(idx) {
    window.adminSavedPlaylist.splice(idx, 1);
    window.renderAdminSavedPlaylist();
    if (document.getElementById('powerSavedPlaylist')) {
        window.renderAdminSavedPlaylist('power');
    }
};

window.renderAdminSavedPlaylist = function(target = 'maintenance') {
    const container = document.getElementById(target === 'power' ? 'powerSavedPlaylist' : 'adminSavedPlaylist');
    if (!container) return;

    if (window.adminSavedPlaylist.length === 0) {
        container.innerHTML = '<div class="text-slate-500 text-center py-2 text-[10px]">No saved tracks</div>';
        return;
    }

    container.innerHTML = window.adminSavedPlaylist.map((track, idx) => `
        <div class="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg border border-white/5">
            <div onclick="playAdminSavedTrack(${idx}, '${target}')" class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                <img src="${track.img}" class="w-7 h-7 rounded object-cover">
                <div class="flex-1 min-w-0">
                    <div class="font-bold truncate text-[10px] text-slate-100">${track.title}</div>
                    <div class="text-[8px] text-slate-500 truncate">${track.artist}</div>
                </div>
            </div>
            <button type="button" onclick="removeTrackFromAdminPlaylist(${idx})" class="bg-red-950/40 hover:bg-red-900/60 text-red-400 font-bold px-2 py-1 rounded text-[8px] ml-2 cursor-pointer">
                Delete
            </button>
        </div>
    `).join('');
};

window.playAdminSavedTrack = function(idx, target = 'maintenance') {
    const track = window.adminSavedPlaylist[idx];
    if (!track) return;

    const audio = document.getElementById('adminMusicPlayer');
    const playIcon = document.getElementById(target === 'power' ? 'powerPlayIcon' : 'adminPlayIcon');
    const pauseIcon = document.getElementById(target === 'power' ? 'powerPauseIcon' : 'adminPauseIcon');
    const titleEl = document.getElementById(target === 'power' ? 'powerMusicTitle' : 'adminMusicTitle');
    const artistEl = document.getElementById(target === 'power' ? 'powerMusicArtist' : 'adminMusicArtist');
    
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;

    audio.src = track.url;
    audio.load();
    
    audio.play().then(() => {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }).catch(err => console.warn("Auto preview play blocked:", err));
};

window.toggleAdminMusic = function(target = 'maintenance') {
    const audio = document.getElementById('adminMusicPlayer');
    const playIcon = document.getElementById(target === 'power' ? 'powerPlayIcon' : 'adminPlayIcon');
    const pauseIcon = document.getElementById(target === 'power' ? 'powerPauseIcon' : 'adminPauseIcon');
    if (!audio) return;

    if (audio.paused) {
        audio.play().then(() => {
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        }).catch(err => console.warn("Play blocked", err));
    } else {
        audio.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    }
};

window.searchAdminMusic = async function(target = 'maintenance') {
    const query = document.getElementById(target === 'power' ? 'powerMusicQuery' : 'maintenanceMusicQuery').value.trim();
    const resultsDiv = document.getElementById(target === 'power' ? 'powerMusicResults' : 'adminMusicResults');
    if (!query) {
        showToast('Info', 'Please enter a search query or track URL first', 'info');
        return;
    }

    resultsDiv.innerHTML = '<div class="text-center py-2 text-slate-500 animate-pulse">Searching tracks...</div>';
    resultsDiv.classList.remove('hidden');

    try {
        let tracks = [];
        let fetchedSuccess = false;

        try {
            const searchRes = await fetch(`https://jiosaavn-api-private.vercel.app/search/songs?q=${encodeURIComponent(query)}`);
            const searchData = await searchRes.json();
            if (searchData && searchData.data && Array.isArray(searchData.data.results) && searchData.data.results.length > 0) {
                tracks = searchData.data.results;
                fetchedSuccess = true;
            }
        } catch (e) {
            console.warn("JioSaavn search/songs failed, trying iTunes API...", e);
        }

        if (!fetchedSuccess) {
            try {
                const searchRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=15`);
                const responseJson = await searchRes.json();
                if (responseJson && responseJson.results && responseJson.results.length > 0) {
                    adminTracksQueue = responseJson.results.map(item => ({
                        id: 'itunes_' + item.trackId,
                        title: item.trackName,
                        artist: item.artistName || 'iTunes Artist',
                        img: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '300x300bb') : 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=100',
                        url: item.previewUrl
                    })).filter(t => t.url);
                    fetchedSuccess = true;
                }
            } catch (e) {
                console.warn("iTunes API fallback failed...", e);
            }
        }

        if (tracks && tracks.length > 0) {
            adminTracksQueue = tracks.map(track => {
                let img = 'https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=100';
                if (track.image && Array.isArray(track.image)) {
                    const imgObj = track.image.find(i => i.quality === '150x150') || track.image[0];
                    img = imgObj ? (imgObj.link || imgObj.url || img) : img;
                }
                let downloadUrl = '';
                if (track.download_url && track.download_url.length > 0) {
                    const dlObj = track.download_url.find(d => d.quality === '160kbps' || d.quality === '320kbps');
                    downloadUrl = dlObj ? (dlObj.link || dlObj.url) : track.download_url[track.download_url.length - 1].link;
                } else if (track.downloadUrl && track.downloadUrl.length > 0) {
                    const dlObj = track.downloadUrl.find(d => d.quality === '160kbps' || d.quality === '320kbps');
                    downloadUrl = dlObj ? (dlObj.url || dlObj.link) : track.downloadUrl[track.downloadUrl.length - 1].url;
                }
                let artistName = track.subtitle || (track.artist_map?.primary_artists ? track.artist_map.primary_artists.map(a => a.name).join(', ') : 'Unknown Artist');
                return {
                    id: track.id,
                    title: track.name || track.song || 'Unknown Track',
                    artist: artistName,
                    img: img,
                    url: downloadUrl
                };
            }).filter(t => t.url);
        }

        if (adminTracksQueue.length === 0) {
            resultsDiv.innerHTML = '<div class="text-center py-2 text-red-500">Error: Could not retrieve playable audio URLs</div>';
            return;
        }

        resultsDiv.innerHTML = adminTracksQueue.map((track, idx) => `
            <div class="flex items-center justify-between p-1.5 hover:bg-white/5 rounded-lg border border-transparent hover:border-teal-500/30">
                <div onclick="selectAdminTrack(${idx}, '${target}')" class="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <img src="${track.img}" class="w-8 h-8 rounded object-cover">
                    <div class="flex-1 min-w-0">
                        <div class="font-bold truncate text-[11px] text-slate-100">${track.title}</div>
                        <div class="text-[9px] text-slate-500 truncate">${track.artist}</div>
                    </div>
                </div>
                <button type="button" onclick="addTrackToAdminPlaylist(${idx}, '${target}')" class="bg-teal-600 hover:bg-teal-500 text-black font-bold p-1 rounded-md text-[9px] ml-2 cursor-pointer flex items-center justify-center" title="Add to Playlist">
                    <svg class="w-3.5 h-3.5 fill-black" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
                </button>
            </div>
        `).join('');

    } catch (err) {
        console.warn(err);
        resultsDiv.innerHTML = '<div class="text-center py-2 text-red-500">Failed to connect to music service</div>';
    }
};

window.selectAdminTrack = function(idx, target = 'maintenance') {
    const track = adminTracksQueue[idx];
    if (!track) return;

    const audio = document.getElementById('adminMusicPlayer');
    const playIcon = document.getElementById(target === 'power' ? 'powerPlayIcon' : 'adminPlayIcon');
    const pauseIcon = document.getElementById(target === 'power' ? 'powerPauseIcon' : 'adminPauseIcon');
    const titleEl = document.getElementById(target === 'power' ? 'powerMusicTitle' : 'adminMusicTitle');
    const artistEl = document.getElementById(target === 'power' ? 'powerMusicArtist' : 'adminMusicArtist');
    
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    document.getElementById('maintenanceMusicQuery').value = track.url; // Save direct URL to DB on submit
    if (document.getElementById('powerMusicQuery')) {
        document.getElementById('powerMusicQuery').value = track.url;
    }

    if (audio) {
        audio.crossOrigin = 'anonymous';
        audio.src = track.url && track.url.startsWith('http') ? '/api/music/proxy?url=' + encodeURIComponent(track.url) : track.url;
        audio.load();
    }

    // Setup visualizer if not already
    const canvas = document.getElementById('adminVisualizer');
    if (canvas) {
       // visualizer is already running in drawAdminWaveform loop
    }
    
    audio.play().then(() => {
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    }).catch(err => console.warn("Auto preview play blocked:", err));

    const resultsDiv = document.getElementById(target === 'power' ? 'powerMusicResults' : 'adminMusicResults');
    resultsDiv.classList.add('hidden');
};

// --- SPORTS SECTION MANAGEMENT ---
async function loadSportsStreams() {
    const list = document.getElementById('adminSportsList');
    if (!list) return;
    list.innerHTML = `
        <div class="col-span-full text-center py-12 animate-pulse text-gray-500 text-xs uppercase tracking-widest">
            Loading Custom Sports Streams...
        </div>
    `;
    try {
        const res = await secureFetch('/api/admin/sports');
        const data = await res.json();
        if (data.status === 'success' && data.sports) {
            renderSportsStreams(data.sports);
        } else {
            list.innerHTML = `<p class="col-span-full text-center text-red-400 text-xs py-4">Failed to fetch: ${data.message || 'unknown error'}</p>`;
        }
    } catch (err) {
        list.innerHTML = `<p class="col-span-full text-center text-red-400 text-xs py-4">Error loading sports section</p>`;
    }
}

function renderSportsStreams(sports) {
    const list = document.getElementById('adminSportsList');
    if (!list) return;

    if (sports.length === 0) {
        list.innerHTML = `
            <div class="col-span-full p-12 border border-dashed border-gray-800 rounded-2xl text-center text-gray-500 text-xs">
                <i data-lucide="trophy" class="w-8 h-8 mx-auto text-gray-700 mb-2"></i>
                <p class="font-bold text-gray-400">No Custom Sports Streams</p>
                <p class="text-gray-600 mt-0.5">Click "Add Sports Stream" to define your global sports library streams.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    list.innerHTML = sports.map(s => {
        const isUrl = s.icon && (s.icon.startsWith('http://') || s.icon.startsWith('https://') || s.icon.startsWith('/') || s.icon.includes('.'));
        const iconHtml = isUrl 
            ? `<img src="${s.icon}" class="w-5 h-5 object-contain rounded-md" onerror="this.onerror=null; this.src='https://img.icons8.com/color/120/sports.png';" />` 
            : `<i data-lucide="${s.icon || 'trophy'}" class="w-5 h-5"></i>`;
        
        return `
        <div class="p-6 rounded-2xl border border-gray-800 bg-gray-950/40 hover:bg-gray-900/40 transition-all flex flex-col justify-between gap-4 text-left relative overflow-hidden group">
            <div class="flex items-start justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div class="p-3 w-fit rounded-xl bg-gray-900 text-red-500 flex items-center justify-center">
                        ${iconHtml}
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-white tracking-wide truncate max-w-[180px]">${s.title}</h4>
                        <p class="text-[9px] font-mono text-gray-500 mt-0.5 truncate max-w-[200px]" title="${s.url}">${s.url}</p>
                    </div>
                </div>
                <div class="flex items-center gap-1.5">
                    <span id="badge_${s.id}" class="px-2 py-0.5 rounded bg-gray-900 text-gray-500 text-[8px] font-black uppercase tracking-widest border border-gray-800">UNCHECKED</span>
                </div>
            </div>
            
            <div class="flex items-center justify-between border-t border-gray-800/60 pt-4 mt-1">
                <div class="flex items-center gap-2">
                    <button onclick="checkSportsStream('${s.id}', '${s.url}')" class="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-[9px] font-bold uppercase tracking-wider text-gray-300 rounded-lg transition-all flex items-center gap-1">
                        <i data-lucide="refresh-cw" class="w-3 h-3"></i> Check Status
                    </button>
                    <button onclick="playSportsStream('${s.url}', '${s.title}')" class="px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider text-red-400 rounded-lg transition-all flex items-center gap-1">
                        <i data-lucide="play" class="w-3 h-3"></i> Dummy Play
                    </button>
                </div>
                <div class="flex items-center gap-1">
                    <button onclick="openEditSportsModal('${s.id}', '${s.title.replace(/'/g, "\\'")}', '${s.icon.replace(/'/g, "\\'")}', '${s.url}')" class="p-1.5 hover:bg-gray-900 rounded-lg text-gray-400 hover:text-white transition-colors" title="Edit">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteSportsStream('${s.id}')" class="p-1.5 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>
        `;
    }).join('');
    lucide.createIcons();
}

function toggleSportsModal(show) {
    document.getElementById('sportsModal').classList.toggle('hidden', !show);
}

async function extractSportsM3u() {
    const btn = document.getElementById('extractSportsBtn');
    if(btn) {
        btn.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i> Extracting...';
        btn.disabled = true;
    }
    
    try {
        const res = await secureFetch('/api/admin/sports/extract', { method: 'POST' });
        if (res.status === 'success') {
            pushToast('Sports M3U extracted successfully', 'success');
        } else {
            pushToast('Failed to extract: ' + res.message, 'error');
        }
    } catch (e) {
        pushToast('Error connecting to extraction API', 'error');
    }
    
    if(btn) {
        btn.innerHTML = '<i data-lucide="refresh-cw" class="w-4 h-4"></i> Extract Sports M3U';
        btn.disabled = false;
    }
    lucide.createIcons();
}

function openNewSportsModal() {
    document.getElementById('sportsModalTitle').innerText = "Add Sports Stream";
    document.getElementById('sportsId').value = "";
    document.getElementById('sportsTitle').value = "";
    document.getElementById('sportsIcon').value = "trophy";
    document.getElementById('sportsUrl').value = "";
    toggleSportsModal(true);
}

function openEditSportsModal(id, title, icon, url) {
    document.getElementById('sportsModalTitle').innerText = "Edit Sports Stream";
    document.getElementById('sportsId').value = id;
    document.getElementById('sportsTitle').value = title;
    document.getElementById('sportsIcon').value = icon;
    document.getElementById('sportsUrl').value = url;
    toggleSportsModal(true);
}

async function saveSportsStream(e) {
    e.preventDefault();
    const id = document.getElementById('sportsId').value;
    const title = document.getElementById('sportsTitle').value;
    const icon = document.getElementById('sportsIcon').value;
    const url = document.getElementById('sportsUrl').value;

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/admin/sports/${id}` : '/api/admin/sports';

    try {
        const res = await secureFetch(endpoint, {
            method: method,
            body: JSON.stringify({ title, icon, url })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast("Success", id ? "Stream Updated" : "Stream Added", "success");
            toggleSportsModal(false);
            loadSportsStreams();
        } else {
            showToast("Error", result.message || "Failed to save", "error");
        }
    } catch (err) {
        showToast("Error", "Error saving sports stream", "error");
    }
}

async function deleteSportsStream(id) {
    if (!confirm("Are you sure you want to delete this sports stream?")) return;
    try {
        const res = await secureFetch(`/api/admin/sports/${id}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.status === 'success') {
            showToast("Success", "Stream Deleted", "success");
            loadSportsStreams();
        } else {
            showToast("Error", result.message || "Delete failed", "error");
        }
    } catch (err) {
        showToast("Error", "Error deleting stream", "error");
    }
}

async function checkSportsStream(id, url) {
    const badge = document.getElementById(`badge_${id}`);
    if (badge) {
        badge.className = "px-2 py-0.5 rounded bg-gray-900 text-yellow-400 text-[8px] font-black uppercase tracking-widest animate-pulse border border-gray-800";
        badge.innerText = "CHECKING";
    }

    try {
        const res = await secureFetch(`/api/admin/sports/check?url=${encodeURIComponent(url)}`);
        const result = await res.json();
        
        if (badge) {
            if (result.status === 'active') {
                badge.className = "px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-black uppercase tracking-widest";
                badge.innerText = "ACTIVE";
            } else {
                badge.className = "px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-widest";
                badge.innerText = "DAMAGED";
            }
        }
    } catch (err) {
        if (badge) {
            badge.className = "px-2 py-0.5 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[8px] font-black uppercase tracking-widest";
            badge.innerText = "DAMAGED";
        }
    }
}

// Inline video preview logic
let hlsInstance = null;

function playSportsStream(url, title) {
    const container = document.getElementById('dummyPlayContainer');
    const video = document.getElementById('dummyVideoPlayer');
    const info = document.getElementById('dummyVideoInfo');
    
    container.classList.remove('hidden');
    info.innerText = `Stream Target: ${url}`;
    container.scrollIntoView({ behavior: 'smooth' });

    // Stop existing Hls instance
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }

    // Play stream
    let streamUrl = url;
    
    // If the browser supports Native HLS (like Safari)
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
        video.play().catch(err => console.warn("Native HLS failed:", err));
    } 
    // If Hls.js is supported
    else if (Hls.isSupported()) {
        hlsInstance = new Hls({
            maxBufferLength: 10,
            enableWorker: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function() {
            video.play().catch(err => console.warn("Hls.js autoplay failed:", err));
        });
        hlsInstance.on(Hls.Events.ERROR, function(event, data) {
            console.warn("Hls.js error:", data);
        });
    } else {
        video.src = streamUrl;
        video.play().catch(err => console.warn("Direct video load failed:", err));
    }
}

function closeDummyPlayer() {
    const container = document.getElementById('dummyPlayContainer');
    const video = document.getElementById('dummyVideoPlayer');
    
    container.classList.add('hidden');
    video.pause();
    video.src = "";
    
    if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
    }
}

// Expose to window globally
window.loadSportsStreams = loadSportsStreams;
window.renderSportsStreams = renderSportsStreams;
window.toggleSportsModal = toggleSportsModal;
window.openNewSportsModal = openNewSportsModal;
window.openEditSportsModal = openEditSportsModal;
window.saveSportsStream = saveSportsStream;
window.deleteSportsStream = deleteSportsStream;
window.checkSportsStream = checkSportsStream;
window.playSportsStream = playSportsStream;
window.closeDummyPlayer = closeDummyPlayer;


// --- LIVE EVENTS MANAGER ---
let adminLiveEvents = [];

async function fetchLiveEvents() {
    try {
        const res = await secureFetch('/api/admin/live_events');
        const data = await res.json();
        adminLiveEvents = data.liveEvents || [];
        renderLiveEventsList();
    } catch (err) {
        showToast('Error', 'Failed to fetch Live Events', 'error');
    }
}

function renderLiveEventsList() {
    const list = document.getElementById('adminLiveEventsList');
    if (!list) return;
    list.innerHTML = '';
    
    if (adminLiveEvents.length === 0) {
        list.innerHTML = '<p class="text-sm text-gray-500 col-span-full">No live events available. Add one.</p>';
        return;
    }
    
    adminLiveEvents.forEach(evt => {
        const iconHtml = evt.icon && evt.icon.startsWith('http') 
            ? `<img src="${evt.icon}" class="w-8 h-8 rounded-full border border-gray-700 shadow-lg">`
            : `<div class="w-8 h-8 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center border border-red-500/30"><i data-lucide="${evt.icon || 'zap'}" class="w-4 h-4"></i></div>`;
            
        const card = document.createElement('div');
        card.className = "bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="flex items-center gap-4 mb-4">
                    ${iconHtml}
                    <div>
                        <h4 class="text-white font-bold text-base">${evt.title}</h4>
                        <p class="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mt-1">🔴 LIVE EVENT</p>
                    </div>
                </div>
                <div class="bg-gray-950 rounded-lg p-3 border border-gray-800 mb-4 overflow-hidden relative group">
                    <p class="text-xs text-gray-400 font-mono truncate cursor-pointer hover:text-white transition-colors" title="${evt.url}" onclick="copyText('${evt.url}')">${evt.url}</p>
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <i data-lucide="copy" class="w-3 h-3 text-gray-400"></i>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 pt-4 border-t border-gray-800">
                <button onclick="playSportsStream('${evt.url}', '${encodeURIComponent(evt.title)}')" class="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                    <i data-lucide="play" class="w-3.5 h-3.5 text-emerald-400"></i> Preview
                </button>
                <button onclick="editLiveEvent('${evt.id}')" class="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors border border-amber-500/20">
                    <i data-lucide="edit" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="deleteLiveEvent('${evt.id}')" class="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors border border-red-500/20">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });
    lucide.createIcons();
}

window.toggleLiveEventsModal = toggleLiveEventsModal;
window.openNewLiveEventModal = openNewLiveEventModal;
window.editLiveEvent = editLiveEvent;
window.saveLiveEventStream = saveLiveEventStream;
window.deleteLiveEvent = deleteLiveEvent;

function toggleLiveEventsModal(show) {
    const modal = document.getElementById('liveEventsModal');
    if (show) modal.classList.remove('hidden');
    else modal.classList.add('hidden');
}

function openNewLiveEventModal() {
    document.getElementById('liveEventsModalTitle').innerHTML = '<i data-lucide="zap" class="w-5 h-5 text-red-500"></i> Add Live Event';
    document.getElementById('liveEventsId').value = '';
    document.getElementById('liveEventsTitle').value = '';
    document.getElementById('liveEventsIcon').value = '';
    document.getElementById('liveEventsUrl').value = '';
    toggleLiveEventsModal(true);
    lucide.createIcons();
}

function editLiveEvent(id) {
    const evt = adminLiveEvents.find(s => s.id === id);
    if (!evt) return;
    document.getElementById('liveEventsModalTitle').innerHTML = '<i data-lucide="edit" class="w-5 h-5 text-amber-500"></i> Edit Live Event';
    document.getElementById('liveEventsId').value = evt.id;
    document.getElementById('liveEventsTitle').value = evt.title;
    document.getElementById('liveEventsIcon').value = evt.icon;
    document.getElementById('liveEventsUrl').value = evt.url;
    toggleLiveEventsModal(true);
    lucide.createIcons();
}

async function saveLiveEventStream(e) {
    e.preventDefault();
    const id = document.getElementById('liveEventsId').value;
    const title = document.getElementById('liveEventsTitle').value;
    const icon = document.getElementById('liveEventsIcon').value;
    const url = document.getElementById('liveEventsUrl').value;
    
    const payload = { title, icon, url };
    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/api/admin/live_events/${id}` : '/api/admin/live_events';
    
    try {
        const res = await secureFetch(endpoint, {
            method: method,
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            showToast('Success', id ? 'Live Event updated.' : 'Live Event added.', 'success');
            toggleLiveEventsModal(false);
            fetchLiveEvents();
        } else {
            showToast('Error', data.message || 'Failed to save', 'error');
        }
    } catch (err) {
        showToast('Error', 'API request failed.', 'error');
    }
}

async function deleteLiveEvent(id) {
    if (!confirm("Are you sure you want to delete this live event?")) return;
    try {
        const res = await secureFetch(`/api/admin/live_events/${id}`, {
            method: 'DELETE'
        });
        const data = await res.json();
        if (data.status === 'success') {
            showToast('Deleted', 'Live Event has been removed.', 'success');
            fetchLiveEvents();
        } else {
            showToast('Error', data.message || 'Failed to delete', 'error');
        }
    } catch (err) {
        showToast('Error', 'API request failed.', 'error');
    }
}
