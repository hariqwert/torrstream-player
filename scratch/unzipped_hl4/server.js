"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.features = exports.systemStatus = exports.systemState = exports.activeStreamingIps = exports.activeSessions = void 0;
exports.addStreamingIp = addStreamingIp;
exports.removeStreamingIp = removeStreamingIp;
exports.shouldSendUserIp = shouldSendUserIp;
exports.isIpBlocked = isIpBlocked;
exports.refreshBlacklist = refreshBlacklist;
exports.setSecureCookie = setSecureCookie;
exports.serveAdminPasswordGate = serveAdminPasswordGate;
const sportsM3u_1 = __importStar(require("./src/routes/sportsM3u"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const https_1 = __importDefault(require("https"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("./src/middleware/auth");
const stalkerAPI_1 = require("./src/stalkerAPI");
const proxy_1 = require("./src/proxy");
const xtreamProxy_1 = require("./src/xtream/xtreamProxy");
const admin_1 = __importDefault(require("./src/routes/admin"));
const subtitles_1 = __importDefault(require("./src/routes/subtitles"));
const customM3uProxy_1 = __importDefault(require("./src/routes/customM3uProxy"));
const XtreamAPI_1 = require("./src/xtream/XtreamAPI");
const extensions_1 = require("@consumet/extensions");
const genai_1 = require("@google/genai");
const torrent_1 = require("./src/routes/torrent");
dotenv_1.default.config();
// Global In-Memory Stores for Live Monitor
exports.activeSessions = new Map();
exports.activeStreamingIps = new Map();
function addStreamingIp(ip) {
    const count = exports.activeStreamingIps.get(ip) || 0;
    exports.activeStreamingIps.set(ip, count + 1);
}
function removeStreamingIp(ip) {
    const count = exports.activeStreamingIps.get(ip) || 0;
    if (count <= 1) {
        exports.activeStreamingIps.delete(ip);
    }
    else {
        exports.activeStreamingIps.set(ip, count - 1);
    }
}
function shouldSendUserIp(ip) {
    if (exports.activeStreamingIps.size > 1)
        return true;
    if (exports.activeStreamingIps.size === 1 && !exports.activeStreamingIps.has(ip))
        return true;
    return false;
}
let blacklist = [];
// Shared system state to ensure live updates across modules
exports.systemState = {
    status: 'active',
    maintenanceMode: false,
    consumetMaintenance: false,
    playMaintenance: false,
    playConsumetMaintenance: false,
    developerMode: false,
    allowedDeveloperIps: [],
    activeTemplate: 'Scheduled Downtime',
    maintenanceMusicMode: 'query',
    maintenanceMusicQuery: 'lofi relax',
    maintenanceMusicPlaylist: [],
    features: {
        m3uEnabled: true,
        stalkerEnabled: true,
        firewallEnabled: true,
        publicPlaylistEnabled: true
    }
};
// Password verification helper
const verifyAdminPassword = (password) => {
    if (password === process.env.ADMIN_PASSWORD)
        return true;
    const hash = process.env.ADMIN_PASS_HASH || '$2b$10$ylB9n2tlLsBbh5WNoxwYhur2oCMmxBoKJWCT8c8POffRop2SM5iBi';
    try {
        return bcryptjs_1.default.compareSync(password, hash);
    }
    catch (e) {
        return false;
    }
};
// Legacy exports for compatibility
exports.systemStatus = 'active';
exports.features = exports.systemState.features;
// Load System Config from DB
function loadSystemConfig() {
    const dbFile = path_1.default.join(process.cwd(), 'doctor_strange', 'admin_db.json');
    if (fs_1.default.existsSync(dbFile)) {
        try {
            const db = JSON.parse(fs_1.default.readFileSync(dbFile, 'utf8'));
            blacklist = db.blacklist || [];
            exports.systemState.status = db.systemStatus || 'active';
            exports.systemStatus = (exports.systemState.status === 'killed' ? 'offline' : exports.systemState.status);
            exports.systemState.maintenanceMode = !!db.maintenanceMode;
            exports.systemState.consumetMaintenance = !!db.consumetMaintenance;
            exports.systemState.playMaintenance = !!db.playMaintenance;
            exports.systemState.playConsumetMaintenance = !!db.playConsumetMaintenance;
            exports.systemState.developerMode = !!db.developerMode;
            exports.systemState.allowedDeveloperIps = db.allowedDeveloperIps || [];
            exports.systemState.activeTemplate = db.activeTemplate || 'Scheduled Downtime';
            exports.systemState.maintenanceMusicMode = db.maintenanceMusicMode || 'query';
            exports.systemState.maintenanceMusicQuery = db.maintenanceMusicQuery || 'lofi relax';
            exports.systemState.maintenanceMusicPlaylist = db.maintenanceMusicPlaylist || [];
            exports.systemState.features = db.features || exports.systemState.features;
            exports.features = exports.systemState.features;
        }
        catch (e) {
            blacklist = [];
            exports.systemState.status = 'active';
        }
    }
}
loadSystemConfig();
// Helper to check if IP is blocked
function isIpBlocked(ip) {
    const clean = ip.trim().replace('::ffff:', '');
    if (clean === '::1' || clean === 'localhost') {
        return blacklist.includes('127.0.0.1') || blacklist.includes('::1') || blacklist.includes('localhost');
    }
    return blacklist.includes(clean);
}
// Refresh blacklist helper
function refreshBlacklist() {
    loadSystemConfig();
}
// Helper to set cookies with dynamic secure/sameSite options based on HTTP/HTTPS protocol
function setSecureCookie(req, res, name, value, options = {}) {
    const mergedOptions = {
        path: '/',
        sameSite: 'none',
        secure: true,
        ...options
    };
    res.cookie(name, value, mergedOptions);
}
const app = (0, express_1.default)();
app.set('trust proxy', true);
const port = 3000;
const httpsAgent = new https_1.default.Agent({
    rejectUnauthorized: true
});
// Create base cache and credential directories as required by AGENTS.md
const DARK_SIDE = path_1.default.join(process.cwd(), 'doctor_strange');
const LIGHT_SIDE = path_1.default.join(process.cwd(), 'cache_stalker');
[DARK_SIDE, LIGHT_SIDE].forEach(dir => {
    try {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        fs_1.default.chmodSync(dir, 0o777);
    }
    catch (e) {
        console.warn(`Could not setup directory ${dir}:`, e);
    }
});
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '100mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '100mb' }));
// User ID and Cookie Initialization Middleware
app.use((req, res, next) => {
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    // Ensure user_id exists
    if (!cookies.user_id) {
        const userId = crypto_1.default.randomBytes(8).toString('hex');
        setSecureCookie(req, res, 'user_id', userId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
        // Inject for current request
        req.headers.cookie = (req.headers.cookie ? req.headers.cookie + '; ' : '') + `user_id=${userId}`;
    }
    next();
});
// Firewall Middleware: Block Blacklisted IPs and Handle System Status
app.use((req, res, next) => {
    const rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '0.0.0.0';
    const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
    // Normalize IP for comparison
    const cleanIp = clientIp.replace('::ffff:', '');
    // 0. FIREWALL: Block blacklisted IPs (applies to all routes including login)
    if (exports.systemState.features.firewallEnabled && isIpBlocked(cleanIp)) {
        console.warn(`[FIREWALL] Blocked access attempt from blacklisted IP: ${cleanIp}`);
        return res.status(403).send('ACCESS DENIED: Your IP has been blacklisted by system administrator.');
    }
    // 1. ADMIN BYPASS: Always allow access to admin routes, assets, and login actions
    const action = (req.query.action || req.body?.action);
    const isAdminPath = req.path.startsWith('/api/admin') ||
        req.path.includes('/hari.') ||
        req.path === '/login.php' ||
        req.path.startsWith('/assets') ||
        req.path.startsWith('/torrents') ||
        req.path.startsWith('/stream') ||
        req.path.startsWith('/settings') ||
        req.path === '/echo' ||
        req.path.startsWith('/api/v1/search') ||
        req.path.startsWith('/torrent');
    const isLoginAction = req.path === '/stalker_api.php' && action === 'admin_login';
    // 1b. AUTH BYPASS: Allow access if admin_auth cookie OR Bearer token is present
    const cookieHeader = req.headers.cookie || '';
    const cookies = parseCookies(cookieHeader);
    const authHeader = req.headers.authorization;
    const isAuthorizedAdmin = (() => {
        let token = '';
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (cookies.admin_auth) {
            token = cookies.admin_auth;
        }
        else if (req.query.auth) {
            token = req.query.auth;
        }
        if (!token)
            return false;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            return decoded && decoded.role === 'admin';
        }
        catch (e) {
            return false;
        }
    })();
    // Check if the target is a frontend client page
    const isClientPage = ['/', '/index.php', '/play.php', '/play_consumet.php', '/playlist.php', '/hero.html', '/consumet.html', '/books.html', '/music.html', '/play_media.html', '/sample_maintenance.html'].includes(req.path);
    // 1c. ADMIN BYPASS FOR STALKER API: If authorized admin, allow all stalker_api.php actions
    const isStalkerApi = req.path.includes('stalker_api.php');
    if (isAdminPath || isLoginAction || (isAuthorizedAdmin && (isStalkerApi || !isClientPage))) {
        if (req.query.auth && !cookies.admin_auth) {
            setSecureCookie(req, res, 'admin_auth', req.query.auth, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true
            });
        }
        if (isLoginAction) {
            console.log(`[AUTH] Admin login action detected from IP: ${cleanIp}`);
        }
        return next();
    }
    // Refresh system state to ensure maintenance mode is up-to-date
    loadSystemConfig();
    console.log(`[ACCESS CHECK] Path: ${req.path}, Status: ${exports.systemState.status}, Maintenance: ${exports.systemState.maintenanceMode}, DevMode: ${exports.systemState.developerMode}`);
    // 2.5 DEVELOPER MODE: Block non-whitelisted IPs
    if (exports.systemState.developerMode && !isAdminPath && !isLoginAction && req.path !== '/hari.html' && req.path !== '/hari.js' && req.path !== '/watchdog.js' && req.path !== '/api/system/public-status') {
        const isLocalLoopback = cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost';
        const isAllowedDeveloperIp = (exports.systemState.allowedDeveloperIps || []).includes(cleanIp);
        if (!isLocalLoopback && !isAllowedDeveloperIp) {
            console.warn(`[FIREWALL] Blocked access attempt due to Developer Mode active from IP: ${cleanIp}`);
            return res.status(403).send('ACCESS DENIED: System is currently in Developer Mode. Your IP is not whitelisted.');
        }
    }
    // 3. MASTER KILL SWITCH: If system is offline, block public access
    let isSpecificMaintenance = false;
    if (exports.systemState.consumetMaintenance && (req.path === '/consumet.html' || req.path === '/consumet' || req.path === '/'))
        isSpecificMaintenance = true;
    if (exports.systemState.playMaintenance && req.path === '/play.php')
        isSpecificMaintenance = true;
    if (exports.systemState.playConsumetMaintenance && req.path === '/play_consumet.php')
        isSpecificMaintenance = true;
    if (exports.systemState.status === 'offline' || exports.systemState.status === 'killed' || exports.systemState.maintenanceMode || isSpecificMaintenance) {
        // Exclude admin API, music proxy, and admin UI from being blocked
        if (req.path.startsWith('/api/admin') ||
            req.path === '/api/music/proxy' ||
            req.path === '/watchdog.js' ||
            req.path === '/api/system/public-status' ||
            req.path === '/hari.html' ||
            req.path === '/hari.js' ||
            req.path === '/login.php' ||
            (req.path.includes('stalker_api.php') && [
                'admin_login',
                'all_portals',
                'switch_portal',
                'login_details',
                'm3u_save'
            ].includes(action))) {
            return next();
        }
        const isApiRequest = req.path.startsWith('/api/') ||
            req.path.includes('stalker_api.php') ||
            req.path.includes('playlist.php') ||
            (req.path.endsWith('.php') && !['/index.php', '/login.php', '/play.php', '/play_consumet.php', '/'].includes(req.path)) ||
            req.headers['accept']?.includes('application/json') ||
            req.headers['x-requested-with'] === 'XMLHttpRequest';
        if (isApiRequest) {
            console.warn(`[SYSTEM] Returning JSON offline response for API request: ${req.path}`);
            return res.status(503).json({
                status: "error",
                message: exports.systemState.maintenanceMode ? `Maintenance Mode: ${exports.systemState.activeTemplate}` : "System Offline: Access Terminated by Administrator.",
                systemStatus: exports.systemState.status
            });
        }
        const title = exports.systemState.maintenanceMode ? "Maintenance Mode" : "System Offline";
        const description = exports.systemState.maintenanceMode
            ? exports.systemState.activeTemplate
            : "The Stalker Pro network is currently completely disabled by the administrator for deep maintenance or security lockdown.";
        const iconColor = exports.systemState.maintenanceMode ? "text-amber-500" : "text-red-500";
        const iconBg = exports.systemState.maintenanceMode ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";
        const iconSvg = exports.systemState.maintenanceMode
            ? `<svg class="w-10 h-10 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
            : `<svg class="w-10 h-10 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>`;
        const musicMode = exports.systemState.maintenanceMusicMode || 'query';
        const musicQuery = exports.systemState.maintenanceMusicQuery || 'lofi relax';
        const musicPlaylistJson = JSON.stringify(exports.systemState.maintenanceMusicPlaylist || []);
        console.warn(`[SYSTEM] Blocked public access attempt while SYSTEM IS OFFLINE/MAINTENANCE from IP: ${cleanIp} to Path: ${req.path}`);
        return res.status(503).send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Stalker Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background-color: #05070a; overflow-x: hidden; }
        .glass-card {
            background: rgba(13, 17, 23, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
        }
    </style>
</head>
<body class="text-white min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
    <!-- Ambient glows -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div id="bodyGlow1" class="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-pink-500/10 to-transparent blur-[120px] transition-transform duration-[1000ms]"></div>
        <div id="bodyGlow2" class="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-gradient-to-br from-teal-500/10 to-transparent blur-[120px] transition-transform duration-[1000ms]"></div>
    </div>

    <!-- Autoplay Start Experience Overlay -->
    <div id="startOverlay" class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090e]/95 backdrop-blur-xl p-6">
        <div class="max-w-md text-center space-y-6">
            <div class="w-20 h-20 rounded-3xl ${iconBg} border flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/5">
                ${iconSvg}
            </div>
            <h1 class="text-3xl font-black uppercase tracking-tight text-white">${title}</h1>
            <p class="text-slate-400 text-sm leading-relaxed">${description}</p>
            <button onclick="startVisualizerExperience()" class="mt-8 px-8 py-4 bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-extrabold text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-pink-500/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto">
                <i data-lucide="play" class="w-4 h-4 fill-white"></i>
                Start Experience
            </button>
        </div>
    </div>

    <!-- Main Container -->
    <div class="max-w-md w-full z-10 relative space-y-6">
        <!-- Status Indicator -->
        <div class="flex items-center justify-center gap-2.5 bg-white/5 border border-white/5 py-2 px-4 rounded-full w-fit mx-auto backdrop-blur-md">
            <span class="w-2 h-2 rounded-full ${exports.systemState.maintenanceMode ? 'bg-amber-500 animate-pulse' : 'bg-red-500 animate-pulse'}"></span>
            <span class="text-[10px] font-black uppercase tracking-widest text-slate-300">${title}</span>
        </div>

        <!-- Glassmorphic Lounge Card -->
        <div id="musicCard" class="glass-card rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden transition-all duration-700">
            <!-- Ambient Canvas visualizer inside card -->
            <canvas id="visualizerCanvas" class="absolute inset-0 w-full h-full opacity-60 pointer-events-none rounded-[2.5rem]"></canvas>

            <div class="relative z-10 space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between pb-4 border-b border-white/5">
                    <div class="text-left">
                        <h3 class="text-lg font-black tracking-tight text-white">AMBIENT LOUNGE</h3>
                        <p class="text-[9px] uppercase font-bold text-teal-400 tracking-widest mt-0.5">Stalker Pro Music</p>
                    </div>
                    <button onclick="showPlaylistsManager()" class="p-2.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all" title="Manage Playlists">
                        <i data-lucide="list-music" class="w-4.5 h-4.5"></i>
                    </button>
                </div>

                <!-- Search box -->
                <div class="flex gap-2">
                    <input type="text" id="musicSearchIndex" placeholder="Search track or artist..." class="flex-1 bg-black/40 border border-white/5 rounded-2xl py-3 px-4 text-xs font-medium outline-none focus:border-teal-500 transition-colors placeholder:text-gray-600" onkeydown="if(event.key === 'Enter') searchMusicIndex()">
                    <button onclick="searchMusicIndex()" class="bg-teal-500 hover:bg-teal-400 p-3 rounded-2xl font-bold transition-all transform active:scale-95 flex items-center justify-center text-black">
                        <i data-lucide="search" class="w-4.5 h-4.5"></i>
                    </button>
                </div>

                <!-- Search Presets / Quick Filters -->
                <div class="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                    <button onclick="searchMusicIndex('Lofi Chill')" class="whitespace-nowrap bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all text-slate-300">Lofi Chill</button>
                    <button onclick="searchMusicIndex('Top Pop Hits')" class="whitespace-nowrap bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all text-slate-300">Top Hits</button>
                    <button onclick="searchMusicIndex('Arijit Singh')" class="whitespace-nowrap bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all text-slate-300">Arijit Singh</button>
                    <button onclick="searchMusicIndex('Synthwave')" class="whitespace-nowrap bg-white/5 border border-white/5 px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all text-slate-300">Synthwave</button>
                </div>

                <!-- Scrollable results list -->
                <div id="musicResultsIndex" class="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar hidden -mx-1 px-1"></div>

                <!-- Custom Audio Player Interface -->
                <div id="playerContainerIndex" class="pt-4 border-t border-white/5">
                    <div class="flex items-center gap-4 mb-4">
                        <img id="nowPlayingImgIndex" src="https://images.unsplash.com/photo-1614149162883-504ce4d13909?auto=format&fit=crop&q=80&w=150&h=150" class="w-12 h-12 rounded-2xl object-cover bg-black/50 shadow-lg border border-white/5">
                        <div class="flex-1 min-w-0 text-left">
                            <div id="nowPlayingTitleIndex" class="text-sm font-bold text-white truncate tracking-tight">Not Playing</div>
                            <div id="nowPlayingArtistIndex" class="text-[10px] font-bold text-slate-500 truncate uppercase mt-0.5 tracking-wider">Select a track to start</div>
                        </div>
                    </div>

                    <audio id="audioPlayerIndex" class="hidden"></audio>

                    <div class="space-y-4">
                        <!-- Progress Bar & Time -->
                        <div class="flex items-center gap-3">
                            <span id="currentTimeIndex" class="text-[9px] font-mono font-bold text-slate-500 w-8 text-left">0:00</span>
                            <div id="progressBarContainerIndex" class="flex-1 h-1.5 bg-white/5 hover:bg-white/10 rounded-full cursor-pointer relative overflow-hidden group transition-all" onclick="seekAudioIndex(event)">
                                <div id="progressBarIndex" class="h-full bg-teal-500 rounded-full w-0 transition-all duration-100 group-hover:bg-teal-400"></div>
                            </div>
                            <span id="durationTimeIndex" class="text-[9px] font-mono font-bold text-slate-500 w-8 text-right">0:00</span>
                        </div>

                        <!-- Actions -->
                        <div class="flex items-center justify-between px-4">
                            <button onclick="rewindAudioIndex(5)" class="p-2.5 text-slate-400 hover:text-white transition-colors" title="Rewind 5s">
                                <i data-lucide="chevron-left-square" class="w-5 h-5"></i>
                            </button>

                            <button id="playPauseBtnIndex" onclick="togglePlayPauseIndex()" class="w-12 h-12 rounded-full bg-white text-black hover:bg-teal-400 hover:text-black flex items-center justify-center transition-all transform active:scale-95 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                                <i data-lucide="play" id="playIconIndex" class="w-5 h-5 ml-0.5 fill-black"></i>
                                <i data-lucide="pause" id="pauseIconIndex" class="w-5 h-5 hidden"></i>
                            </button>

                            <button onclick="forwardAudioIndex(5)" class="p-2.5 text-slate-400 hover:text-white transition-colors" title="Forward 5s">
                                <i data-lucide="chevron-right-square" class="w-5 h-5"></i>
                            </button>

                            <a id="downloadBtnIndex" href="#" class="p-2.5 text-teal-400 hover:text-white transition-colors" title="Download Track">
                                <i data-lucide="download" class="w-5 h-5"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="pt-8 text-[9px] text-slate-600 uppercase tracking-widest font-black">Stalker Pro &bull; Ambient Firewall Lounge</div>
    </div>

    <script>
        const playerIndex = document.getElementById('audioPlayerIndex');
        const playIconIndex = document.getElementById('playIconIndex');
        const pauseIconIndex = document.getElementById('pauseIconIndex');
        const progressBarIndex = document.getElementById('progressBarIndex');
        const currentTimeElIndex = document.getElementById('currentTimeIndex');
        const durationTimeElIndex = document.getElementById('durationTimeIndex');

        let currentMusicQueueIndex = [];
        let currentPlayingIndex = -1;

        // Web Audio API Analyzer for synchronization
        let audioCtx = null;
        let analyser = null;
        let sourceNode = null;
        let dataArray = null;

        function initAudioAnalyzer(audioElement) {
            if (audioCtx) return;
            try {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                sourceNode = audioCtx.createMediaElementSource(audioElement);
                sourceNode.connect(analyser);
                analyser.connect(audioCtx.destination);
                dataArray = new Uint8Array(analyser.frequencyBinCount);
            } catch (e) {
                console.warn("Web Audio API blocked or not supported:", e);
            }
        }

        // Visualizer config
        function animateVisualizer() {
            const canvas = document.getElementById('visualizerCanvas');
            const isPlaying = !playerIndex.paused && playerIndex.currentTime > 0;
            const time = Date.now() * 0.004;

            // Show/hide background visualizer wrapper
            const fsContainer = document.getElementById('fsVisualizerContainer');
            if (fsContainer) {
                if (isPlaying) {
                    fsContainer.classList.remove('opacity-0');
                    fsContainer.classList.add('opacity-100');
                } else {
                    fsContainer.classList.remove('opacity-100');
                    fsContainer.classList.add('opacity-0');
                }
            }

            // Real-time Web Audio API synchronization
            let volumeFactor = 1;
            if (isPlaying) {
                initAudioAnalyzer(playerIndex);
                if (analyser && dataArray) {
                    analyser.getByteFrequencyData(dataArray);
                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length; // 0 to 255
                    volumeFactor = average / 16; // scale factor
                    if (volumeFactor < 0.2) volumeFactor = 0.2;
                }
            } else {
                volumeFactor = 0;
            }

            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                    canvas.width = canvas.clientWidth;
                    canvas.height = canvas.clientHeight;
                }
                const width = canvas.width;
                const height = canvas.height;
                const centerY = height / 2;
                ctx.clearRect(0, 0, width, height);

                ctx.lineWidth = 3.5;
                const gradient = ctx.createLinearGradient(0, 0, width, 0);
                gradient.addColorStop(0, '#ec4899'); // Pink
                gradient.addColorStop(0.5, '#3b82f6'); // Blue
                gradient.addColorStop(1, '#14b8a6'); // Teal
                ctx.strokeStyle = gradient;
                ctx.shadowBlur = isPlaying ? 12 : 0;
                ctx.shadowColor = '#14b8a6';

                ctx.beginPath();
                const pointsCount = 120;
                const sliceWidth = width / pointsCount;
                let x = 0;

                for (let i = 0; i < pointsCount; i++) {
                    let amplitude = 2;
                    if (isPlaying) {
                        const centerFactor = 1 - Math.abs(i - pointsCount/2) / (pointsCount/2);
                        amplitude = 4 + (Math.sin(i * 0.15 + time) * Math.cos(i * 0.05 - time * 0.5) * 18 * volumeFactor * centerFactor);
                    } else {
                        amplitude = Math.sin(i * 0.02 + time * 0.3) * 3;
                    }
                    const y = centerY + amplitude;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }
                ctx.lineTo(width, centerY);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Draw on fullscreenVisualizerCanvas
            const fsCanvas = document.getElementById('fullscreenVisualizerCanvas');
            if (fsCanvas) {
                const ctx = fsCanvas.getContext('2d');
                if (fsCanvas.width !== fsCanvas.clientWidth || fsCanvas.height !== fsCanvas.clientHeight) {
                    fsCanvas.width = fsCanvas.clientWidth;
                    fsCanvas.height = fsCanvas.clientHeight;
                }
                const width = fsCanvas.width;
                const height = fsCanvas.height;
                const centerY = height / 2;
                ctx.clearRect(0, 0, width, height);

                ctx.lineWidth = 4;
                const gradient = ctx.createLinearGradient(0, 0, width, 0);
                gradient.addColorStop(0, '#14b8a6'); // Teal
                gradient.addColorStop(0.5, '#3b82f6'); // Blue
                gradient.addColorStop(1, '#ec4899'); // Pink
                ctx.strokeStyle = gradient;
                ctx.shadowBlur = isPlaying ? 15 : 0;
                ctx.shadowColor = '#3b82f6';

                ctx.beginPath();
                const pointsCount = 150;
                const sliceWidth = width / pointsCount;
                let x = 0;

                for (let i = 0; i < pointsCount; i++) {
                    let amplitude = 2;
                    if (isPlaying) {
                        const centerFactor = 1 - Math.abs(i - pointsCount/2) / (pointsCount/2);
                        amplitude = 4 + (Math.sin(i * 0.1 + time) * Math.cos(i * 0.05 - time * 0.4) * 25 * volumeFactor * centerFactor);
                    } else {
                        amplitude = Math.sin(i * 0.05 + time * 0.2) * 4;
                    }
                    const y = centerY + amplitude;

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);

                    x += sliceWidth;
                }
                ctx.lineTo(width, centerY);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Pulse background glows
            const bgGlow1 = document.getElementById('bodyGlow1');
            const bgGlow2 = document.getElementById('bodyGlow2');
            if (bgGlow1 && bgGlow2) {
                const scale = isPlaying ? (1 + Math.sin(Date.now() / 300) * 0.12) : 1;
                bgGlow1.style.transform = \`scale(\${scale})\`;
                bgGlow2.style.transform = \`scale(\${scale})\`;
            }

            requestAnimationFrame(animateVisualizer);
        }
        animateVisualizer();

        // Audio events
        playerIndex.addEventListener('timeupdate', () => {
            const current = playerIndex.currentTime;
            const duration = playerIndex.duration || 1;
            const pct = (current / duration) * 100;
            progressBarIndex.style.width = \`\${pct}%\`;
            currentTimeElIndex.textContent = formatTimeIndex(current);
        });

        playerIndex.addEventListener('loadedmetadata', () => {
            durationTimeElIndex.textContent = formatTimeIndex(playerIndex.duration || 0);
        });

        playerIndex.addEventListener('play', () => {
            playIconIndex.classList.add('hidden');
            pauseIconIndex.classList.remove('hidden');
        });

        playerIndex.addEventListener('pause', () => {
            playIconIndex.classList.remove('hidden');
            pauseIconIndex.classList.add('hidden');
        });

        playerIndex.addEventListener('ended', () => {
            if (currentPlayingIndex >= 0 && currentPlayingIndex + 1 < currentMusicQueueIndex.length) {
                playTrackIndexByIndex(currentPlayingIndex + 1);
            } else {
                playIconIndex.classList.remove('hidden');
                pauseIconIndex.classList.add('hidden');
                progressBarIndex.style.width = '0%';
                currentTimeElIndex.textContent = '0:00';
            }
        });

        function formatTimeIndex(secs) {
            const m = Math.floor(secs / 60);
            const s = Math.floor(secs % 60);
            return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
        }

        function togglePlayPauseIndex() {
            if (playerIndex.paused) {
                playerIndex.play().catch(e => console.log('Playback blocked or failed', e));
            } else {
                playerIndex.pause();
            }
        }

        function rewindAudioIndex(secs) {
            playerIndex.currentTime = Math.max(0, playerIndex.currentTime - secs);
        }

        function forwardAudioIndex(secs) {
            playerIndex.currentTime = Math.min(playerIndex.duration || 1, playerIndex.currentTime + secs);
        }

        function seekAudioIndex(event) {
            const container = document.getElementById('progressBarContainerIndex');
            const rect = container.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const width = rect.width;
            const ratio = clickX / width;
            const duration = playerIndex.duration || 1;
            playerIndex.currentTime = ratio * duration;
        }

        function startVisualizerExperience() {
            document.getElementById('startOverlay').classList.add('opacity-0', 'pointer-events-none');
            setTimeout(() => {
                document.getElementById('startOverlay').classList.add('hidden');
            }, 500);

            // Morph card to reflect music playing view
            document.getElementById('musicCard').classList.add('shadow-[0_0_50px_rgba(20,184,166,0.15)]');

            if (currentMusicQueueIndex.length > 0) {
                playTrackIndexByIndex(0);
            } else {
                // Preload random
                searchMusicIndex('Lofi Chill');
            }
        }

        let myMusicPlaylists = JSON.parse(localStorage.getItem('myMusicPlaylists') || 'null');
        if (!myMusicPlaylists) {
            myMusicPlaylists = [{ id: 'default', name: 'My Playlist', tracks: [] }];
            localStorage.setItem('myMusicPlaylists', JSON.stringify(myMusicPlaylists));
        }

        function showPlaylistsManager() {
            const resultsDiv = document.getElementById('musicResultsIndex');
            resultsDiv.classList.remove('hidden');
            
            let html = \`
                <div class="flex gap-2 mb-4">
                    <input type="text" id="newPlaylistName" placeholder="New Playlist Name..." class="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-xs outline-none focus:border-teal-500 text-white">
                    <button onclick="createNewPlaylist()" class="bg-teal-600 hover:bg-teal-500 px-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Create</button>
                </div>
                <div class="space-y-2">
            \`;
            
            myMusicPlaylists.forEach(pl => {
                html += \`
                    <div class="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-all" onclick="loadPlaylistIndex('\${pl.id}')">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>
                            </div>
                            <div class="text-left">
                                <div class="text-[13px] font-bold text-slate-200 group-hover:text-white">\${pl.name}</div>
                                <div class="text-[10px] text-slate-500">\${pl.tracks.length} tracks</div>
                            </div>
                        </div>
                        \${pl.id !== 'default' ? \`<button onclick="deletePlaylist('\${pl.id}', event)" class="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all" title="Delete"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>\` : ''}
                    </div>
                \`;
            });
            html += \`</div>\`;
            resultsDiv.innerHTML = html;
        }
        
        function createNewPlaylist() {
            const name = document.getElementById('newPlaylistName').value.trim();
            if(!name) return;
            myMusicPlaylists.push({ id: 'pl_' + Date.now(), name, tracks: [] });
            localStorage.setItem('myMusicPlaylists', JSON.stringify(myMusicPlaylists));
            showPlaylistsManager();
        }
        
        function deletePlaylist(id, e) {
            e.stopPropagation();
            if(!confirm('Delete this playlist?')) return;
            myMusicPlaylists = myMusicPlaylists.filter(p => p.id !== id);
            localStorage.setItem('myMusicPlaylists', JSON.stringify(myMusicPlaylists));
            showPlaylistsManager();
        }
        
        function loadPlaylistIndex(id) {
            const pl = myMusicPlaylists.find(p => p.id === id);
            const resultsDiv = document.getElementById('musicResultsIndex');
            
            if (!pl || pl.tracks.length === 0) {
                resultsDiv.innerHTML = \`
                    <div class="flex justify-between items-center mb-4 px-2">
                        <button onclick="showPlaylistsManager()" class="text-[10px] text-teal-500 hover:text-teal-400 font-bold uppercase tracking-widest bg-teal-500/10 px-3 py-1.5 rounded-lg">&larr; Back</button>
                        <span class="text-[11px] font-black text-white uppercase tracking-widest">\${pl.name}</span>
                    </div>
                    <div class="text-center text-xs text-slate-500 py-6 font-bold uppercase tracking-widest">Playlist is empty</div>
                \`;
                return;
            }
            
            currentMusicQueueIndex = pl.tracks;
            let html = \`
                <div class="flex justify-between items-center mb-4 px-2">
                    <button onclick="showPlaylistsManager()" class="text-[10px] text-teal-500 hover:text-teal-400 font-bold uppercase tracking-widest bg-teal-500/10 px-3 py-1.5 rounded-lg">&larr; Back</button>
                    <span class="text-[11px] font-black text-white uppercase tracking-widest">\${pl.name}</span>
                </div>
            \`;
            html += currentMusicQueueIndex.map((track, idx) => \`
                <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer group transition-all active:scale-[0.98]" onclick="playTrackIndexByIndex(\${idx})">
                    <div class="flex items-center gap-3 overflow-hidden text-left">
                        <img src="\${track.img}" class="w-10 h-10 rounded-lg object-cover shadow-sm">
                        <div class="overflow-hidden">
                            <div class="text-[13px] font-bold truncate text-slate-200 group-hover:text-white">\${track.title.replace(/'/g, "&#39;")}</div>
                            <div class="text-[10px] text-slate-400 truncate">\${track.artist.replace(/'/g, "&#39;")}</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="removeFromPlaylistIndex('\${id}', \${idx}, event)" class="w-8 h-8 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0" title="Remove">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            \`).join('');
            resultsDiv.innerHTML = html;
        }

        function removeFromPlaylistIndex(plId, idx, event) {
            event.stopPropagation();
            const pl = myMusicPlaylists.find(p => p.id === plId);
            if(pl) {
                pl.tracks.splice(idx, 1);
                localStorage.setItem('myMusicPlaylists', JSON.stringify(myMusicPlaylists));
                loadPlaylistIndex(plId);
            }
        }
        
        let pendingTrackToAdd = null;
        function addToPlaylistIndex(idx, event) {
            event.stopPropagation();
            pendingTrackToAdd = currentMusicQueueIndex[idx];
            
            const resultsDiv = document.getElementById('musicResultsIndex');
            
            resultsDiv.innerHTML = \`
                <div class="text-center mb-4 mt-2 text-[10px] font-black text-teal-500 uppercase tracking-widest">Select Playlist to Add</div>
                <div class="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                \${myMusicPlaylists.map(pl => \`
                    <div onclick="confirmAddToPlaylist('\${pl.id}')" class="p-3 bg-white/5 hover:bg-teal-500/20 rounded-xl cursor-pointer text-xs font-bold text-white transition-all text-left flex justify-between items-center group">
                        <span>\${pl.name}</span>
                        <span class="text-[10px] text-slate-500 group-hover:text-teal-400">\${pl.tracks.length} tracks</span>
                    </div>
                \`).join('')}
                </div>
                <button onclick="searchMusicIndex(document.getElementById('musicSearchIndex').value || 'Arijit Singh')" class="mt-4 w-full py-3 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest transition-all">Cancel</button>
            \`;
        }
        
        function confirmAddToPlaylist(plId) {
            const pl = myMusicPlaylists.find(p => p.id === plId);
            if(pl && pendingTrackToAdd) {
                if(!pl.tracks.find(t => t.url === pendingTrackToAdd.url)) {
                    pl.tracks.push(pendingTrackToAdd);
                    localStorage.setItem('myMusicPlaylists', JSON.stringify(myMusicPlaylists));
                    showToast('Added to ' + pl.name);
                } else {
                    showToast('Already in ' + pl.name);
                }
            }
            searchMusicIndex(document.getElementById('musicSearchIndex').value || 'Arijit Singh');
        }

        async function searchMusicIndex(presetQuery) {
            const query = presetQuery || document.getElementById('musicSearchIndex').value.trim();
            if (presetQuery) document.getElementById('musicSearchIndex').value = presetQuery;

            if (!query) return;
            
            const resultsDiv = document.getElementById('musicResultsIndex');
            resultsDiv.innerHTML = '<div class="text-center text-xs text-slate-500 py-4 font-bold">Searching...</div>';
            resultsDiv.classList.remove('hidden');
            
            try {
                let tracks = [];
                let fetchedSuccess = false;

                // Try official saavn.dev API first for high performance
                try {
                    const searchRes = await fetch(\`https://saavn.dev/api/search/songs?query=\${encodeURIComponent(query)}&limit=15\`);
                    const responseJson = await searchRes.json();
                    if (responseJson.success && responseJson.data?.results) {
                        tracks = responseJson.data.results;
                        fetchedSuccess = true;
                    } else if (responseJson.data) {
                        tracks = responseJson.data;
                        fetchedSuccess = true;
                    }
                } catch (e) {
                    console.warn("saavn.dev failed in lounge, trying private proxy...", e);
                }

                // Fallback to private JioSaavn API
                if (!fetchedSuccess) {
                    try {
                        const searchRes = await fetch(\`https://jiosaavn-api-private.vercel.app/search?q=\${encodeURIComponent(query)}\`);
                        const searchData = await searchRes.json();
                        
                        let songIds = [];
                        if (searchData.data) {
                            const addIds = (str) => {
                                if (str) songIds.push(...str.split(',').map(s => s.trim()));
                            };
                            if (searchData.data.top_query?.data) {
                                searchData.data.top_query.data.forEach(item => {
                                    if (item.type === 'song') songIds.push(item.id);
                                    if (item.type === 'album') addIds(item.song_pids);
                                });
                            }
                            if (searchData.data.albums?.data) {
                                searchData.data.albums.data.forEach(album => addIds(album.song_pids));
                            }
                        }
                        songIds = [...new Set(songIds)].slice(0, 15);
                        
                        if (songIds.length > 0) {
                            const songRes = await fetch(\`https://jiosaavn-api-private.vercel.app/song?id=\${songIds.join(',')}\`);
                            const songData = await songRes.json();
                            tracks = songData?.data?.songs || (Array.isArray(songData?.data) ? songData.data : []);
                            if (tracks && tracks.length > 0) {
                                fetchedSuccess = true;
                            }
                        }
                    } catch (e) {
                        console.warn("Private JioSaavn API failed too in lounge...", e);
                    }
                }

                // Fallback to Internet Archive if JioSaavn fails or in maintenance mode
                if (!fetchedSuccess) {
                    try {
                        const searchRes = await fetch(\`https://archive.org/advancedsearch.php?q=(\${encodeURIComponent(query)}) AND mediatype:(audio)&fl[]=identifier,title,creator,album,length&rows=15&output=json\`);
                        const json = await searchRes.json();
                        if (json.response && json.response.docs) {
                            const archiveTracks = json.response.docs.map(doc => {
                                const identifier = doc.identifier;
                                if (!identifier) return null;
                                const title = doc.title || identifier;
                                const artist = doc.creator || 'Archive Creator';
                                const album = doc.album || 'Archive.org Audio';
                                let durationStr = "3:30";
                                if (doc.length) {
                                    if (typeof doc.length === 'string') {
                                        durationStr = doc.length.split('.')[0];
                                    } else if (typeof doc.length === 'number') {
                                        const m = Math.floor(doc.length / 60);
                                        const r = Math.floor(doc.length % 60);
                                        durationStr = \`\${m}:\${r < 10 ? '0' : ''}\${r}\`;
                                    }
                                }
                                const imgUrl = \`https://archive.org/services/img/\${identifier}\`;
                                return {
                                    url: '',
                                    title: title,
                                    artist: artist,
                                    img: imgUrl,
                                    isArchive: true,
                                    identifier: identifier
                                };
                            }).filter(Boolean);

                            if (archiveTracks.length > 0) {
                                tracks = archiveTracks;
                                fetchedSuccess = true;
                            }
                        }
                    } catch (e) {
                        console.warn("Archive.org failed too in lounge...", e);
                    }
                }
                
                if (tracks && tracks.length > 0) {
                    currentMusicQueueIndex = tracks.map(track => {
                        if (track.isArchive) return track;
                        
                        let artwork = '';
                        if (Array.isArray(track.image)) {
                            artwork = track.image.find(i => i.quality === '150x150')?.link || track.image[0]?.link;
                        } else {
                            artwork = track.image || '';
                        }
                        if (!artwork) artwork = 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?auto=format&fit=crop&q=80&w=150&h=150';

                        let streamUrl = '';
                        const downloadUrls = track.download_url || track.downloadUrl;
                        if (Array.isArray(downloadUrls)) {
                            streamUrl = downloadUrls.find(d => d.quality === '320kbps')?.link || downloadUrls[0]?.link;
                        } else {
                            streamUrl = track.url || '';
                        }

                        let artistName = track.subtitle || '';
                        if (!artistName && track.primaryArtists) {
                            artistName = track.primaryArtists;
                        } else if (!artistName && track.artist_map?.primary_artists) {
                            artistName = track.artist_map.primary_artists.map(a => a.name).join(', ');
                        }
                        if (!artistName) artistName = 'Unknown Artist';

                        return {
                            url: streamUrl,
                            title: track.name || track.title || 'Unknown',
                            artist: artistName,
                            img: artwork
                        };
                    });
                    
                    resultsDiv.innerHTML = currentMusicQueueIndex.map((track, idx) => \`
                        <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer group transition-all active:scale-[0.98]" onclick="playTrackIndexByIndex(\${idx})">
                            <div class="flex items-center gap-3 overflow-hidden text-left">
                                <img src="\${track.img}" class="w-10 h-10 rounded-lg object-cover shadow-sm">
                                <div class="overflow-hidden">
                                    <div class="text-[13px] font-bold truncate text-slate-200 group-hover:text-white">\${track.title.replace(/'/g, "&#39;")}</div>
                                    <div class="text-[10px] text-slate-400 truncate">\${track.artist.replace(/'/g, "&#39;")}</div>
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="addToPlaylistIndex(\${idx}, event)" class="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0" title="Add to Playlist">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                                </button>
                                <div class="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    resultsDiv.innerHTML = '<div class="text-center text-xs text-slate-500 py-4 font-bold uppercase tracking-widest">No tracks found</div>';
                }
            } catch (err) {
                console.error(err);
                resultsDiv.innerHTML = '<div class="text-center text-xs text-red-500 py-4 font-bold">Error connecting to Music API</div>';
            }
        }

        async function downloadCurrentTrackIndex() {
            if (currentPlayingIndex < 0 || currentPlayingIndex >= currentMusicQueueIndex.length) return;
            const track = currentMusicQueueIndex[currentPlayingIndex];
            const btn = document.getElementById('downloadBtnIndex');
            const originalHTML = btn.innerHTML;
            
            btn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>';
            try {
                let downloadUrl = track.url;
                if (track.isArchive && !track.url) {
                    const metaRes = await fetch(\`https://archive.org/metadata/\${track.identifier}\`);
                    const metaJson = await metaRes.json();
                    if (metaJson.files && metaJson.files.length > 0) {
                        const mp3File = metaJson.files.find(f => f.name.toLowerCase().endsWith('.mp3') && f.format && f.format.toLowerCase().includes('mp3'));
                        const fileToPlay = mp3File || metaJson.files.find(f => f.name.toLowerCase().endsWith('.mp3')) || metaJson.files[0];
                        if (fileToPlay) {
                            downloadUrl = \`https://archive.org/download/\${track.identifier}/\${encodeURIComponent(fileToPlay.name)}\`;
                            track.url = downloadUrl;
                        }
                    }
                }
                if (!downloadUrl) {
                    downloadUrl = \`https://archive.org/download/\${track.identifier}/\${track.identifier}.mp3\`;
                }

                const response = await fetch(downloadUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = \`\${track.title}.mp3\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
            } catch (e) {
                console.error("Download failed", e);
                const fallbackUrl = track.url || \`https://archive.org/download/\${track.identifier}/\${track.identifier}.mp3\`;
                window.open(fallbackUrl, '_blank');
            }
            btn.innerHTML = originalHTML;
        }

        async function playTrackIndexByIndex(idx) {
            if (idx < 0 || idx >= currentMusicQueueIndex.length) return;
            currentPlayingIndex = idx;
            const track = currentMusicQueueIndex[idx];
            
            document.getElementById('nowPlayingTitleIndex').textContent = track.title;
            document.getElementById('nowPlayingArtistIndex').textContent = track.artist;
            document.getElementById('nowPlayingImgIndex').src = track.img;
            
            const dBtn = document.getElementById('downloadBtnIndex');
            dBtn.removeAttribute('download');
            dBtn.href = "#";
            dBtn.onclick = function(e) {
                e.preventDefault();
                downloadCurrentTrackIndex();
            };
            
            playerIndex.crossOrigin = "anonymous";
            
            let playUrl = track.url;
            if (track.isArchive && !track.url) {
                try {
                    const metaRes = await fetch(\`https://archive.org/metadata/\${track.identifier}\`);
                    const metaJson = await metaRes.json();
                    if (metaJson.files && metaJson.files.length > 0) {
                        const mp3File = metaJson.files.find(f => f.name.toLowerCase().endsWith('.mp3') && f.format && f.format.toLowerCase().includes('mp3'));
                        const fileToPlay = mp3File || metaJson.files.find(f => f.name.toLowerCase().endsWith('.mp3')) || metaJson.files[0];
                        if (fileToPlay) {
                            playUrl = \`https://archive.org/download/\${track.identifier}/\${encodeURIComponent(fileToPlay.name)}\`;
                            track.url = playUrl;
                        } else {
                            playUrl = \`https://archive.org/download/\${track.identifier}/\${track.identifier}.mp3\`;
                        }
                    } else {
                        playUrl = \`https://archive.org/download/\${track.identifier}/\${track.identifier}.mp3\`;
                    }
                } catch (err) {
                    playUrl = \`https://archive.org/download/\${track.identifier}/\${track.identifier}.mp3\`;
                }
            }

            playerIndex.src = '/api/music/proxy?url=' + encodeURIComponent(playUrl);
            playerIndex.muted = false; // Default unmuted
            playerIndex.play().catch(e => console.log("Play blocked", e));
        }

        // Click anywhere to unmute ambient background music
        document.body.addEventListener('click', () => {
            initAudioAnalyzer(playerIndex);
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            if (playerIndex.muted) {
                playerIndex.muted = false;
                console.log("Unmuted ambient background music");
            }
        });

        function showToast(msg) {
            console.log('Toast:', msg);
        }

        function renderSavedPlaylistHTML() {
            const resultsDiv = document.getElementById('musicResultsIndex');
            if (!resultsDiv) return;
            resultsDiv.innerHTML = currentMusicQueueIndex.map((track, idx) => \`
                <div class="flex items-center justify-between p-2.5 hover:bg-white/5 rounded-xl cursor-pointer group transition-all active:scale-[0.98]" onclick="playTrackIndexByIndex(\${idx})">
                    <div class="flex items-center gap-3 overflow-hidden text-left">
                        <img src="\${track.img}" class="w-10 h-10 rounded-lg object-cover shadow-sm">
                        <div class="overflow-hidden">
                            <div class="text-[13px] font-bold truncate text-slate-200 group-hover:text-white">\${track.title.replace(/'/g, "&#39;")}</div>
                            <div class="text-[10px] text-slate-400 truncate">\${track.artist.replace(/'/g, "&#39;")}</div>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="addToPlaylistIndex(\${idx}, event)" class="w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 hover:bg-teal-500 hover:text-white flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-all flex-shrink-0" title="Add to Playlist">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </button>
                        <div class="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <svg class="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </div>
                </div>
            \`).join('');
            resultsDiv.classList.remove('hidden');
        }

        // Initialize dynamic music based on template configuration
        window.addEventListener('DOMContentLoaded', () => {
            lucide.createIcons();
            const mode = "${musicMode}";
            const query = "${musicQuery}";
            const savedPlaylist = ${musicPlaylistJson};

            if (mode === 'query' && savedPlaylist && savedPlaylist.length > 0) {
                currentMusicQueueIndex = savedPlaylist;
                renderSavedPlaylistHTML();
                playTrackIndexByIndex(0);
            } else if (mode === 'random') {
                const presets = ['Lofi Beats', 'Chill Study Hits', 'Synthwave Retro', 'Acoustic Guitar Chill'];
                const randomPreset = presets[Math.floor(Math.random() * presets.length)];
                searchMusicIndex(randomPreset);
            } else if (mode === 'playlist') {
                let localPls = JSON.parse(localStorage.getItem('myMusicPlaylists') || '[]');
                let pl = localPls.find(p => p.id === 'default' || p.tracks.length > 0);
                if (pl && pl.tracks.length > 0) {
                    currentMusicQueueIndex = pl.tracks;
                    renderSavedPlaylistHTML();
                    playTrackIndexByIndex(0);
                }
            } else {
                searchMusicIndex(query);
            }
        });
    </script>
        <!-- Full-Width Background Visualizer Wave -->
        <div id="fsVisualizerContainer" class="fixed bottom-0 left-0 right-0 h-16 pointer-events-none z-[49] overflow-hidden transition-opacity duration-700 opacity-0">
            <canvas id="fullscreenVisualizerCanvas" class="w-full h-full opacity-50"></canvas>
        </div>
        <script src="/watchdog.js" id="maintenance-watchdog"></script>
    </body>
</html>`);
        return;
    }
    next();
});
// Explicit routes for Secret Admin Control Panel UI
app.get('/hari.html', auth_1.requireAdmin, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path_1.default.join(process.cwd(), 'public', 'hari.html'));
});
app.get('/hari.js', auth_1.requireAdmin, (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path_1.default.join(process.cwd(), 'public', 'hari.js'));
});
app.get('/watchdog.js', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path_1.default.join(process.cwd(), 'public', 'watchdog.js'));
});
// Audio CORS Bypass Proxy Endpoint
app.get('/api/music/yt-search-full', async (req, res) => {
    try {
        const yts = require('yt-search');
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const r = await yts(query);
        res.json({ results: r.videos.slice(0, 20) });
    }
    catch (err) {
        console.error('yt-search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/music/yt-search', async (req, res) => {
    try {
        const yts = require('yt-search');
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }
        const r = await yts(query);
        const videos = (r && r.videos && r.videos.length > 0) ? r.videos : ((r && r.all) ? r.all.filter((x) => x && (x.type === 'video' || x.videoId)) : []);
        if (videos && videos.length > 0 && videos[0].videoId) {
            res.json({ videoId: videos[0].videoId });
        }
        else {
            res.status(404).json({ error: 'Not found' });
        }
    }
    catch (err) {
        console.error('yt-search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.options('/api/music/proxy', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.sendStatus(200);
});
app.get('/api/music/proxy', async (req, res) => {
    const audioUrl = req.query.url;
    if (!audioUrl)
        return res.status(400).send("Missing URL");
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        };
        if (req.headers.range) {
            headers['Range'] = req.headers.range;
        }
        const response = await (0, axios_1.default)({
            method: 'get',
            url: audioUrl,
            responseType: 'stream',
            headers: headers
        }).catch(err => {
            console.error('[MusicProxy] Axios error:', err.message);
            throw err;
        });
        console.log(`[MusicProxy] Status: ${response.status}, Content-Type: ${response.headers['content-type']}, Content-Length: ${response.headers['content-length']}, URL: ${audioUrl}`);
        // Forward status and headers
        res.status(response.status);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        if (response.headers['content-type'])
            res.setHeader('Content-Type', response.headers['content-type']);
        if (response.headers['content-length'])
            res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['content-range'])
            res.setHeader('Content-Range', response.headers['content-range']);
        res.setHeader('Accept-Ranges', 'bytes');
        response.data.on('error', (err) => {
            console.error('[MusicProxy] Stream error:', err?.message || 'Unknown');
            if (!res.headersSent)
                res.status(502).send("Stream error");
        });
        res.on('close', () => {
            // Client aborted or closed the connection
            if (response.data && typeof response.data.destroy === 'function') {
                response.data.destroy();
            }
        });
        response.data.pipe(res);
    }
    catch (err) {
        res.status(500).send("Proxy failed");
    }
});
// Book Text CORS Bypass Proxy Endpoint
app.get('/api/books/catalog-proxy', async (req, res) => {
    const catalogUrl = req.query.url;
    if (!catalogUrl)
        return res.status(400).json({ error: "Missing URL" });
    if (!catalogUrl.startsWith('https://gutendex.com/') && !catalogUrl.startsWith('https://openlibrary.org/')) {
        return res.status(400).json({ error: "Forbidden catalog URL" });
    }
    try {
        const response = await (0, axios_1.default)({
            method: 'get',
            url: catalogUrl,
            responseType: 'json',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        return res.json(response.data);
    }
    catch (err) {
        console.error('[CatalogProxy] Failed to fetch:', err.message);
        return res.status(500).json({ error: "Failed to fetch catalog from external source", message: err.message });
    }
});
// Book Text CORS Bypass Proxy Endpoint
app.get('/api/books/proxy', async (req, res) => {
    const bookUrl = req.query.url;
    if (!bookUrl)
        return res.status(400).send("Missing URL");
    try {
        const response = await (0, axios_1.default)({
            method: 'get',
            url: bookUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/plain,text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 12000
        });
        const data = response.data;
        if (typeof data === 'string') {
            const trimmed = data.trim();
            // Detect if Gutenberg returned an automated download warning/instructions HTML page or short block note
            if (trimmed.startsWith('<html') ||
                trimmed.startsWith('<!DOCTYPE') ||
                trimmed.includes('automated downloads') ||
                trimmed.includes('blocked') ||
                trimmed.includes('Forbidden') ||
                trimmed.includes('unusual traffic') ||
                trimmed.includes('IP address') ||
                trimmed.length < 1500) {
                console.warn('[BookProxy] Detected HTML block/instruction page instead of plain text book:', bookUrl, 'Length:', trimmed.length);
                return res.status(503).send("Service blocked or returned instructions page");
            }
        }
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.send(data);
    }
    catch (err) {
        console.error('[BookProxy] Failed to fetch:', err.message);
        res.status(502).send("Failed to proxy book text: " + err.message);
    }
});
// Regional Offline/Curated Books Endpoints
const REGIONAL_BOOKS_PATH = path_1.default.join(process.cwd(), 'doctor_strange', 'regional_books.json');
app.get('/api/books/regional', (req, res) => {
    const lang = req.query.lang;
    try {
        if (!fs_1.default.existsSync(REGIONAL_BOOKS_PATH)) {
            return res.json([]);
        }
        const data = JSON.parse(fs_1.default.readFileSync(REGIONAL_BOOKS_PATH, 'utf8'));
        if (lang && lang !== 'all') {
            const filtered = data.filter((b) => b.lang === lang);
            return res.json(filtered);
        }
        return res.json(data);
    }
    catch (e) {
        console.error('[RegionalBooks] Failed to list:', e.message);
        res.status(500).send("Failed to load regional books catalog");
    }
});
app.get('/api/books/regional/content', (req, res) => {
    const id = req.query.id;
    if (!id)
        return res.status(400).send("Missing book ID");
    try {
        if (!fs_1.default.existsSync(REGIONAL_BOOKS_PATH)) {
            return res.status(404).send("Database not found");
        }
        const data = JSON.parse(fs_1.default.readFileSync(REGIONAL_BOOKS_PATH, 'utf8'));
        const book = data.find((b) => b.id === id);
        if (!book)
            return res.status(404).send("Book not found");
        return res.json(book);
    }
    catch (e) {
        console.error('[RegionalBooks] Failed to fetch content:', e.message);
        res.status(500).send("Failed to load book content");
    }
});
// Gemini Open Library Adaptive Ebook Generation Endpoint
let geminiClient = null;
function getGeminiClient() {
    if (!geminiClient) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not configured. Please set it in your environment/secrets configuration.");
        }
        geminiClient = new genai_1.GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
                headers: {
                    'User-Agent': 'aistudio-build'
                }
            }
        });
    }
    return geminiClient;
}
app.get('/api/books/openlibrary/content', async (req, res) => {
    const id = req.query.id;
    const title = req.query.title;
    const author = req.query.author;
    if (!id || !title || !author) {
        return res.status(400).send("Missing parameters: id, title, and author are required");
    }
    const olCacheDir = path_1.default.join(process.cwd(), 'doctor_strange', 'ol_books');
    if (!fs_1.default.existsSync(olCacheDir)) {
        fs_1.default.mkdirSync(olCacheDir, { recursive: true });
    }
    const cacheFilePath = path_1.default.join(olCacheDir, `${id}.json`);
    // Check cache
    if (fs_1.default.existsSync(cacheFilePath)) {
        try {
            const cachedBook = JSON.parse(fs_1.default.readFileSync(cacheFilePath, 'utf8'));
            return res.json(cachedBook);
        }
        catch (e) {
            console.warn('[OpenLibraryBook] Error reading cache, generating fresh:', e);
        }
    }
    try {
        console.log(`[OpenLibraryBook] Generating adaptive reading content for: "${title}" by ${author}`);
        const ai = getGeminiClient();
        const prompt = `You are a master archivist and literary adaptor. Your job is to generate a comprehensive, highly immersive, and beautifully written multi-chapter reader's edition of the classic book "${title}" by "${author}".
Since the user wants to read this exact book, you MUST generate 5 highly engaging, extremely detailed chapters that fully adapt the essence, plot, and characters of this work.
Each chapter must be fully written out in detail, with dialogue, rich descriptions, and elegant formatting. Do not output placeholders, notes, or summaries. Write the actual content.

Return a JSON array of chapters. Each chapter object must have:
- "title": The title of the chapter (e.g., "Chapter 1: The Gathering Storm")
- "content": The full-length, detailed reading text of the chapter (at least 800 words, structured with paragraphs).

Ensure the response strictly complies with JSON schema.`;
        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        chapters: {
                            type: genai_1.Type.ARRAY,
                            items: {
                                type: genai_1.Type.OBJECT,
                                properties: {
                                    title: { type: genai_1.Type.STRING },
                                    content: { type: genai_1.Type.STRING }
                                },
                                required: ["title", "content"]
                            }
                        }
                    },
                    required: ["chapters"]
                }
            }
        });
        const textResponse = response.text;
        if (!textResponse) {
            throw new Error("No text returned from Gemini");
        }
        const bookData = JSON.parse(textResponse);
        // Save to cache
        fs_1.default.writeFileSync(cacheFilePath, JSON.stringify(bookData, null, 4), 'utf8');
        return res.json(bookData);
    }
    catch (err) {
        console.error('[OpenLibraryBook] Generation failed:', err.message);
        // Return a beautiful graceful fallback so they can still enjoy a standard reading session!
        const fallbackBook = {
            chapters: [
                {
                    title: "Chapter 1: An Immersive Journey Begins",
                    content: `Welcome to the adaptive reader's edition of "${title}" by ${author}. This classic masterpiece takes you on a magnificent journey through space and time.\n\nAs you begin reading, keep in mind that classical works allow us to connect with human experiences from centuries past. The characters represent the hopes, dreams, trials, and triumphs of their age.\n\nWe are currently connecting to the digital archive to fetch additional regional and global sources for "${title}". While our backend connects, take a moment to reflect on the legacy of ${author}, whose voice has echoed through literary history, capturing minds and inspiring hearts around the globe.`
                },
                {
                    title: "Chapter 2: The Heart of the Masterpiece",
                    content: `Every great piece of literature has a beating heart—a core conflict or theme that defines its narrative arc. In "${title}", the author explores the depths of human nature.\n\nThrough prose that is both poetic and sharp, we see characters navigating the complex social, moral, or physical environments of their world. The descriptions bring the setting to life with remarkable precision, leaving an indelible mark on the reader's imagination.\n\nOur system caches your reading progress automatically. Feel free to use the eye-safe reading themes, adjust the font sizes, or set smart bookmarks as you immerse yourself further.`
                }
            ]
        };
        return res.json(fallbackBook);
    }
});
// Public Sports Section Fetch Endpoint
const ADMIN_DB_PATH = path_1.default.join(process.cwd(), 'doctor_strange', 'admin_db.json');
app.get('/api/system/public-status', (req, res) => {
    const targetPage = req.query.page || req.headers.referer || '/';
    let urlPath = targetPage;
    try {
        const dummyUrl = targetPage.startsWith('http') ? targetPage : `http://localhost${targetPage.startsWith('/') ? '' : '/'}${targetPage}`;
        urlPath = new URL(dummyUrl).pathname;
    }
    catch (e) {
        urlPath = targetPage.split('?')[0];
    }
    let isSpecific = false;
    if (exports.systemState.consumetMaintenance && (urlPath === '/consumet.html' || urlPath === '/consumet' || urlPath === '/'))
        isSpecific = true;
    if (exports.systemState.playMaintenance && urlPath === '/play.php')
        isSpecific = true;
    if (exports.systemState.playConsumetMaintenance && urlPath === '/play_consumet.php')
        isSpecific = true;
    const isMaintenance = exports.systemState.status === 'offline' || exports.systemState.status === 'killed' || exports.systemState.maintenanceMode || isSpecific;
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
        status: "success",
        maintenance: isMaintenance,
        systemStatus: exports.systemState.status,
        maintenanceMode: exports.systemState.maintenanceMode,
        consumetMaintenance: exports.systemState.consumetMaintenance,
        playMaintenance: exports.systemState.playMaintenance,
        playConsumetMaintenance: exports.systemState.playConsumetMaintenance
    });
});
app.get('/api/live_events', (req, res) => {
    try {
        if (!fs_1.default.existsSync(ADMIN_DB_PATH)) {
            return res.json([]);
        }
        const data = JSON.parse(fs_1.default.readFileSync(ADMIN_DB_PATH, 'utf8'));
        return res.json(data.liveEvents || []);
    }
    catch (e) {
        console.error('[PublicEvents] Failed to list:', e.message);
        res.status(500).send("Failed to load live events section catalog");
    }
});
app.get('/api/sports', (req, res) => {
    try {
        if (!fs_1.default.existsSync(ADMIN_DB_PATH)) {
            return res.json([]);
        }
        const data = JSON.parse(fs_1.default.readFileSync(ADMIN_DB_PATH, 'utf8'));
        return res.json(data.sports || []);
    }
    catch (e) {
        console.error('[PublicSports] Failed to list:', e.message);
        res.status(500).send("Failed to load sports section catalog");
    }
});
// Mount Admin API Router
app.use('/', sportsM3u_1.default);
app.use('/', customM3uProxy_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/subtitles', subtitles_1.default);
(0, torrent_1.setupTorrentProxies)(app);
// Initialize Consumet Providers for robust fallback
const consumetProviders = [
    new extensions_1.MOVIES.FlixHQ(),
    new extensions_1.MOVIES.HiMovies(),
    new extensions_1.MOVIES.Turkish(),
    new extensions_1.ANIME.Hianime()
];
// Search
app.get('/api/consumet/search', async (req, res) => {
    const query = req.query.q;
    if (!query)
        return res.status(400).json({ error: 'Missing query parameter q' });
    const timeoutMs = 800;
    const searchPromises = consumetProviders.map(async (provider) => {
        const results = await Promise.race([
            provider.search(query),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        if (results && (results.results?.length > 0 || results.length > 0)) {
            return { ...results, provider: provider.name };
        }
        throw new Error('No results from ' + provider.name);
    });
    try {
        const firstSuccess = await Promise.any(searchPromises);
        return res.json(firstSuccess);
    }
    catch (e) {
        // Fallback to TMDB directly to ensure UI doesn't break
        try {
            const tmdbKey = '844dba0bfd8f3a231a957b6e07a10be8';
            const tmdbRes = await axios_1.default.get(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}`);
            if (tmdbRes.data && tmdbRes.data.results) {
                const mappedResults = tmdbRes.data.results.map((r) => ({
                    id: r.id.toString(),
                    title: r.title || r.name,
                    url: "",
                    image: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : "",
                    releaseDate: r.release_date || r.first_air_date,
                    type: r.media_type === 'tv' ? 'TV Series' : 'Movie'
                }));
                return res.json({ results: mappedResults, provider: 'TMDB Fallback' });
            }
        }
        catch (tmdbErr) { }
        return res.status(500).json({ error: 'All scrapers failed to search or timed out' });
    }
});
// Fetch media info
app.get('/api/consumet/info', async (req, res) => {
    const id = req.query.id;
    const providerName = req.query.provider || 'FlixHQ';
    if (!id)
        return res.status(400).json({ error: 'Missing media id' });
    const provider = consumetProviders.find(p => p.name === providerName) || consumetProviders[0];
    const timeoutMs = 800;
    try {
        const fetchPromise = provider.fetchAnimeInfo ? provider.fetchAnimeInfo(id) : provider.fetchMediaInfo(id);
        const info = await Promise.race([
            fetchPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        res.json(info);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Scraper failed to fetch media info or timed out' });
    }
});
// Fetch stream sources
app.get('/api/consumet/sources', async (req, res) => {
    const episodeId = req.query.episodeId;
    const mediaId = req.query.mediaId;
    const providerName = req.query.provider || 'FlixHQ';
    if (!episodeId || !mediaId)
        return res.status(400).json({ error: 'Missing episodeId or mediaId' });
    const provider = consumetProviders.find(p => p.name === providerName) || consumetProviders[0];
    const timeoutMs = 800;
    try {
        const sources = await Promise.race([
            provider.fetchEpisodeSources(episodeId, mediaId),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        res.json(sources);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Scraper failed to fetch stream sources or timed out' });
    }
});
// --- New Anime Specific APIs ---
app.get('/api/anime/trending', async (req, res) => {
    const provider = new extensions_1.META.Anilist();
    const timeoutMs = 8000;
    try {
        const results = await Promise.race([
            provider.fetchTrendingAnime(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to fetch trending anime or timed out' });
    }
});
app.get('/api/anime/recent', async (req, res) => {
    const provider = new extensions_1.META.Anilist();
    const timeoutMs = 8000;
    try {
        let results = await Promise.race([
            provider.fetchRecentEpisodes(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        res.json(results);
    }
    catch (e) {
        // Fallback since fetchRecentEpisodes might be broken
        try {
            const fallback = await provider.fetchPopularAnime();
            res.json(fallback);
        }
        catch (fallbackErr) {
            res.status(500).json({ error: e.message || 'Failed to fetch recent anime or timed out' });
        }
    }
});
app.get('/api/anime/popular', async (req, res) => {
    const provider = new extensions_1.META.Anilist();
    const timeoutMs = 8000;
    try {
        const results = await Promise.race([
            provider.fetchPopularAnime(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs))
        ]);
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to fetch popular anime or timed out' });
    }
});
app.get('/api/anime/top-airing', async (req, res) => {
    const provider = new extensions_1.ANIME.Hianime();
    try {
        const results = await provider.fetchTopAiring();
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to fetch top airing anime' });
    }
});
app.get('/api/anime/upcoming', async (req, res) => {
    const provider = new extensions_1.ANIME.Hianime();
    try {
        const results = await provider.fetchTopUpcoming();
        res.json(results);
    }
    catch (e) {
        res.status(500).json({ error: e.message || 'Failed to fetch upcoming anime' });
    }
});
// Fetch optional TMDB config
app.get('/api/consumet/config', (req, res) => {
    res.json({ TMDB_API_KEY: process.env.TMDB_API_KEY || '' });
});
// Interactive EPG Matrix Data Endpoint
app.get('/api/epg', async (req, res) => {
    const channelId = req.query.channelId || '';
    const xmltvId = req.query.xmltvId || '';
    // Try Stalker Portal EPG if active
    const portal = stalkerAPI_1.StalkerAPI.getActivePortal(req);
    if (portal && channelId && !channelId.startsWith('m3u_') && !channelId.startsWith('xtream_')) {
        try {
            const host_id = stalkerAPI_1.StalkerAPI.getHostId(portal);
            const tokenFile = path_1.default.join(process.cwd(), 'doctor_strange', `token_${host_id}.stalker`);
            let activeToken = '';
            if (fs_1.default.existsSync(tokenFile)) {
                const td = JSON.parse(fs_1.default.readFileSync(tokenFile, 'utf8'));
                activeToken = td?.STALKER?.Token || '';
            }
            if (activeToken) {
                const url = `${stalkerAPI_1.StalkerAPI.getApiUrl(portal.URL)}?type=itv&action=get_epg_info&period=24&ch_id=${channelId}&JsHttpRequest=1-xml`;
                const headers = [
                    "User-Agent: Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3",
                    `X-User-Agent: Model: ${portal.Model}; Link: WiFi`,
                    `Referer: ${portal.URL}/c/`,
                    `Cookie: mac=${portal.MAC}; stb_lang=en; timezone=GMT`,
                    `Authorization: Bearer ${activeToken}`
                ];
                const resp = await stalkerAPI_1.StalkerAPI.stalkerRequest(url, headers, 'GET');
                let parsed = null;
                try {
                    parsed = JSON.parse(resp.STALKER.data);
                }
                catch (e) { }
                if (parsed?.js?.data && Array.isArray(parsed.js.data)) {
                    return res.json({ status: 'success', epg: parsed.js.data });
                }
            }
        }
        catch (e) { }
    }
    // Fallback EPG Matrix Schedule Generation
    const now = new Date();
    const programs = [];
    const titles = [
        "Morning World News & Market Update", "Live Sports Special: Championship Focus",
        "Documentary Hour: Marvels of Modern Science", "Cinema Blockbuster Feature",
        "Primetime News Hour & Weather Briefing", "Late Night Music & Entertainment Showcase",
        "Action Feature Movie Special", "Trending Tech & Gaming Weekly"
    ];
    for (let i = 0; i < 8; i++) {
        const start = new Date(now.getTime() + (i * 3 * 3600 * 1000) - (1800 * 1000));
        const end = new Date(start.getTime() + (3 * 3600 * 1000));
        programs.push({
            id: `epg_${channelId}_${i}`,
            ch_id: channelId,
            name: titles[i % titles.length],
            descr: `In-depth broadcast featuring live commentary, analysis, and highlight reels.`,
            start_timestamp: Math.floor(start.getTime() / 1000),
            stop_timestamp: Math.floor(end.getTime() / 1000),
            time: `${start.getHours().toString().padStart(2, '0')}:00 - ${end.getHours().toString().padStart(2, '0')}:00`,
            progress: i === 0 ? 40 : 0
        });
    }
    return res.json({ status: 'success', epg: programs });
});
// Option 2: Server-Level Ad-Blocker Proxy (HTML Stripper)
// This intercepts the embed HTML and blocks famous ad providers at the server level
app.get('/api/adblock-proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl)
        return res.status(400).json({ error: 'Missing target URL' });
    try {
        const response = await axios_1.default.get(targetUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 10000
        });
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
            let html = response.data;
            // Famous ad providers to block at the server level
            const blockedAdDomains = [
                'popads.net', 'propellerads.com', 'adsterra.com', 'exoclick.com',
                'onclickalgo.com', 'onclick', 'popunder', 'bet365', '1xbet',
                'doubleclick.net', 'googleadservices.com', 'histats.com',
                'chaturbate.com', 'stripchat.com', 'jerkmate.com', 'adultfriendfinder'
            ];
            // 1. Remove script tags containing known ad domains
            html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match) => {
                const lowerMatch = match.toLowerCase();
                if (blockedAdDomains.some(domain => lowerMatch.includes(domain))) {
                    return '<!-- Server-Level Blocked Ad Script -->';
                }
                return match;
            });
            // 2. Remove iframe tags containing known ad domains
            html = html.replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, (match) => {
                const lowerMatch = match.toLowerCase();
                if (blockedAdDomains.some(domain => lowerMatch.includes(domain))) {
                    return '<!-- Server-Level Blocked Ad Frame -->';
                }
                return match;
            });
            // 3. Inject strict Content-Security-Policy meta tag and base href to prevent relative link breakage
            const urlObj = new URL(targetUrl);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            const cspMeta = `<meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://code.jquery.com; child-src 'self' blob:; frame-src 'self' blob:; worker-src 'self' blob:;">`;
            html = html.replace('<head>', `<head>\n    <!-- Injected Server-Level Ad Blocker CSP and Base -->\n    <base href="${baseUrl}">\n    ${cspMeta}\n`);
            res.set('Content-Type', 'text/html');
            return res.send(html);
        }
        else {
            // If it's not HTML, just pipe it through
            res.set('Content-Type', contentType);
            response.data.pipe(res);
        }
    }
    catch (e) {
        console.error('[Server AdBlock Proxy Error]:', e.message);
        res.status(500).json({ error: 'Failed to proxy embed URL' });
    }
});
// Helper to check if a portal configuration is active
function getActivePortal(req) {
    return stalkerAPI_1.StalkerAPI.getActivePortal(req);
}
function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader)
        return cookies;
    cookieHeader.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        if (parts.length >= 2) {
            cookies[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
    return cookies;
}
function serveAdminPasswordGate(res) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SECURE LOCK | STALKER PRO</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght=400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        :root { font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: radial-gradient(circle at top right, #1e293b, #0f172a); min-height: 100vh; color: #f1f5f9; }
        .glass-panel { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); }
        .input-premium { background: rgba(15, 23, 42, 0.7); border: 1px solid #334155; transition: all 0.3s ease; }
        .input-premium:focus { border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15); outline: none; }
        .btn-gradient { background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); box-shadow: 0 10px 20px -5px rgba(239, 68, 68, 0.4); }
    </style>
</head>
<body class="flex flex-col items-center justify-center p-4">
    <div class="glass-panel w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center border border-white/10">
        <div class="inline-flex p-4 rounded-3xl bg-red-500/10 text-red-500 mb-6">
            <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h1 class="text-2xl font-black text-white tracking-tight">Security Access</h1>
        <p class="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 mb-8">Admin Authorization Required</p>
        
        <form id="authForm" class="space-y-6 text-left">
            <div>
                <label class="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div class="relative mt-1">
                    <input type="password" id="passwordInput" placeholder="Enter System Password" class="input-premium w-full p-4 rounded-2xl text-sm pl-11 text-white">
                    <i data-lucide="key-round" class="w-4 h-4 absolute left-4 top-[18px] text-slate-500"></i>
                </div>
                <p id="errorMsg" class="hidden text-red-400 text-xs font-semibold mt-2 pl-1 flex items-center gap-1">
                    <i data-lucide="alert-circle" class="w-3.5 h-3.5"></i> Invalid credentials.
                </p>
            </div>
            
            <button type="submit" class="btn-gradient w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all">
                <i data-lucide="unlock" class="w-4 h-4"></i>
                <span>Unlock System</span>
            </button>
        </form>
    </div>
    
    <script>
        lucide.createIcons();
        document.getElementById('authForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('passwordInput').value;
            const errorMsg = document.getElementById('errorMsg');
            errorMsg.classList.add('hidden');
            
            try {
                const res = await fetch('stalker_api.php?action=admin_login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    const token = data.session_secret;
                    const cookieBase = "admin_auth=" + token + "; path=/; max-age=2592000;";
                    document.cookie = cookieBase + " SameSite=Lax";
                    document.cookie = cookieBase + " SameSite=None; Secure";
                    window.location.href = window.location.pathname + "?auth=" + token;
                } else {
                    errorMsg.classList.remove('hidden');
                }
            } catch (err) {
                errorMsg.classList.remove('hidden');
            }
        });

        // Small delay before reload
        window.addEventListener('DOMContentLoaded', () => {
            // Check for auth in URL
            if (window.location.search.includes('auth=')) {
                // Keep the URL parameter for session persistence
            }
        });
    </script>
</body>
</html>`;
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
}
// Serve static PHP files by reading them as templates and stripping PHP markers
function servePhpFile(filePath, res, replacements = {}) {
    if (!fs_1.default.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    let content = fs_1.default.readFileSync(filePath, 'utf8');
    // Strip out the first PHP script block (usually imports/validations)
    content = content.replace(/^<\?php[\s\S]*?\?>/i, '');
    // Replace explicit segments
    for (const [key, val] of Object.entries(replacements)) {
        content = content.split(key).join(val);
    }
    // Replace general tags like <?= heaven() ?>
    content = content.replace(/<\?=[\s\S]*?\?>/g, (match) => {
        if (match.includes("heaven()")) {
            return 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1200&q=80';
        }
        return '';
    });
    // Strip other remaining PHP segments cleanly
    content = content.replace(/<\?php[\s\S]*?\?>/g, '');
    content = content.replace(/<\?=[\s\S]*?\?>/g, '');
    res.setHeader('Content-Type', 'text/html');
    if (content.includes('</body>')) {
        content = content.replace('</body>', `<script src="/watchdog.js" id="maintenance-watchdog"></script>\n</body>`);
    }
    else {
        content += `<script src="/watchdog.js" id="maintenance-watchdog"></script>`;
    }
    res.send(content);
}
// Security boundary to block direct access to cache/identity files
app.use((req, res, next) => {
    if (req.url.startsWith('/doctor_strange') || req.url.startsWith('/cache_stalker') || req.url.includes('/.ht') || req.url.includes('.htaccess') || req.url.includes('.htpasswd')) {
        return res.status(403).send('Access Denied');
    }
    next();
});
// Serve assets and public directory
app.use('/assets', express_1.default.static(path_1.default.join(process.cwd(), 'assets')));
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public'), { index: false }));
// Page and Script Routing
app.get('/', (req, res) => {
    console.log('--- Accessing root / ---');
    res.sendFile(path_1.default.resolve('hero.html'));
});
app.get('/index.html', (req, res) => {
    res.sendFile(path_1.default.resolve('hero.html'));
});
app.get('/hero.html', (req, res) => {
    console.log('--- Accessing /hero.html ---');
    res.sendFile(path_1.default.resolve('hero.html'));
});
app.get('/index.php', (req, res) => {
    servePhpFile(path_1.default.join(process.cwd(), 'index.php'), res);
});
app.get('/login.php', (req, res) => {
    const cookies = parseCookies(req.headers.cookie || '');
    const authHeader = req.headers.authorization;
    const token = cookies.admin_auth || (authHeader && authHeader.replace('Bearer ', '')) || req.query.auth;
    let isValid = false;
    if (token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            if (decoded && decoded.role === 'admin') {
                isValid = true;
            }
        }
        catch (e) { }
    }
    if (!isValid) {
        return serveAdminPasswordGate(res);
    }
    servePhpFile(path_1.default.join(process.cwd(), 'login.php'), res);
});
app.get('/play.php', (req, res) => {
    const id = req.query.id || '';
    const name = req.query.name || 'Live Channel';
    const directUrl = req.query.url || '';
    const isXtream = id.startsWith('xtream_');
    let stream_url = directUrl;
    if (!directUrl && id) {
        let extension = 'ts'; // Use TS format for live streams
        stream_url = isXtream ? `xtream.php?id=${encodeURIComponent(id)}` : `live.php?id=${encodeURIComponent(id)}`;
        if (isXtream) {
            stream_url += '.' + extension;
        }
    }
    servePhpFile(path_1.default.join(process.cwd(), 'play.php'), res, {
        '<title> <?php echo htmlspecialchars($name) . " | Stalker Pro Player"; ?></title>': `<title>${name} | Stalker Pro Player</title>`,
        '<?= htmlspecialchars($stream_url); ?>': stream_url,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '{{SOURCE}}': req.query.source || 'index.php',
        '{{NAME}}': name,
        '{{STREAM_URL}}': stream_url,
        '{{IS_XTREAM}}': isXtream ? 'true' : 'false',
        '<?= e($ROLEX[\'Rimg\'] ?? \'\') ?>': '',
        '<?= e($ROLEX[\'Limg\'] ?? \'\') ?>': '',
    });
});
app.get('/play_consumet.php', (req, res) => {
    const stream_url = req.query.url || req.query.id || '';
    const name = req.query.name || 'Live Stream';
    const source = req.query.source || 'consumet.html';
    servePhpFile(path_1.default.join(process.cwd(), 'play_consumet.php'), res, {
        '<?php echo htmlspecialchars($name); ?>': name,
        '<?php echo htmlspecialchars($stream_url); ?>': stream_url,
        '<?php echo htmlspecialchars($source); ?>': source,
        '{{STREAM_URL}}': stream_url,
        '{{NAME}}': name,
        '{{SOURCE}}': source
    });
});
app.get('/play_media.html', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'play_media.html'));
});
app.get('/sample_maintenance.html', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'sample_maintenance.html'));
});
app.get('/music.html', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'music.html'));
});
app.get('/consumet.html', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'consumet.html'));
});
app.get('/books.html', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'books.html'));
});
app.get('/music', (req, res) => {
    res.redirect('/music.html');
});
app.get('/consumet', (req, res) => {
    res.redirect('/consumet.html');
});
app.get('/books', (req, res) => {
    res.redirect('/books.html');
});
app.get('/live.php', proxy_1.handleLiveStream);
app.get('/playlist.php', async (req, res) => {
    if (!exports.features.publicPlaylistEnabled) {
        return res.status(403).send("#EXTM3U\n#EXTINF:-1,Access Denied - Public Export Disabled by Admin");
    }
    const protocol = (req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'https://' : 'http://';
    const host = req.get('host');
    const baseUrl = `${protocol}${host}`;
    const activePortal = getActivePortal(req);
    if (!activePortal) {
        res.setHeader('Content-Type', 'audio/x-mpegurl');
        return res.send("#EXTM3U\n#EXTINF:-1,Cache Missing - Please Refresh Dashboard");
    }
    const playlist = await stalkerAPI_1.StalkerAPI.generatePlaylist(baseUrl, activePortal);
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="stalker.m3u"');
    res.send(playlist);
});
// Stalker API Handlers
app.all('/stalker_api.php', async (req, res) => {
    const body = req.body || {};
    const query = req.query || {};
    const params = { ...query, ...body };
    const action = params.action;
    const activePortal = getActivePortal(req);
    if (action === "admin_login") {
        const rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress || '0.0.0.0';
        const clientIp = Array.isArray(rawIp) ? rawIp[0] : rawIp.split(',')[0].trim();
        const currentIp = clientIp.replace('::ffff:', '');
        const password = (params.password || params.admin_pass_input || '').toString().trim();
        console.log(`[AUTH] stalker_api admin_login attempt for IP: ${currentIp}`);
        if (verifyAdminPassword(password)) {
            console.log(`[AUTH] Admin login SUCCESS for IP: ${currentIp}`);
            const token = jsonwebtoken_1.default.sign({ role: 'admin', ip: currentIp }, auth_1.JWT_SECRET, { expiresIn: '30d' });
            setSecureCookie(req, res, 'admin_auth', token, {
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true
            });
            return res.json({ status: "success", session: "active", session_secret: token });
        }
        else {
            console.warn(`[AUTH] Admin login FAILED for IP: ${currentIp} - Password Mismatch`);
            return res.json({ status: "error", message: "Invalid system password" });
        }
    }
    if (action === "livechannels") {
        try {
            const mediaType = (params.media_type || 'live');
            const cookies = parseCookies(req.headers.cookie || '');
            const user_id = cookies.user_id || 'anonymous';
            const channelsJson = await stalkerAPI_1.StalkerAPI.json_fetcher(mediaType, activePortal, user_id);
            let channels = [];
            try {
                channels = JSON.parse(channelsJson);
            }
            catch (e) {
                console.error("JSON parse failed:", e);
            }
            if (!Array.isArray(channels)) {
                channels = [];
            }
            if (channels.length === 0 || mediaType === 'sports' || mediaType === 'dlhd') {
                try {
                    const channelsPath = path_1.default.join(process.cwd(), 'assets', 'channels.json');
                    if (fs_1.default.existsSync(channelsPath)) {
                        const localData = JSON.parse(fs_1.default.readFileSync(channelsPath, 'utf-8'));
                        if (Array.isArray(localData) && localData.length > 0) {
                            channels = localData.map((c, i) => ({
                                id: c.id || c.channel_id || `ch-${i}`,
                                name: c.name,
                                number: String(i + 1),
                                genre: c.genre || 'Sports',
                                logo: c.logo || '',
                                cmd: (c.channel_id && (c.channel_id.startsWith('http://') || c.channel_id.startsWith('https://') || c.source === 'custom'))
                                    ? c.channel_id
                                    : ((c.stream_url && (c.stream_url.startsWith('http://') || c.stream_url.startsWith('https://') || c.source === 'custom'))
                                        ? c.stream_url
                                        : (c.stream_url ? c.stream_url.replace('__HOSTURL__', '') : `/live.php?token=STALKER_PRO&id=${c.channel_id}&m3u=1`))
                            }));
                        }
                    }
                }
                catch (e) {
                    console.error("Failed to load local channels fallback:", e);
                }
            }
            if (channels.length > 0 && channels[0]?.id) {
                const host_id = stalkerAPI_1.StalkerAPI.getHostId(activePortal);
                const cookies = parseCookies(req.headers.cookie || '');
                const user_id = cookies.user_id || 'anonymous';
                const favFile = path_1.default.join(DARK_SIDE, `favorites_${user_id}_${host_id}.json`);
                let favorites = [];
                if (fs_1.default.existsSync(favFile)) {
                    try {
                        favorites = JSON.parse(fs_1.default.readFileSync(favFile, 'utf8'));
                    }
                    catch (e) { }
                }
                if (!Array.isArray(favorites))
                    favorites = [];
                const recFile = path_1.default.join(DARK_SIDE, `recents_${user_id}_${host_id}.json`);
                let recents = [];
                if (fs_1.default.existsSync(recFile)) {
                    try {
                        recents = JSON.parse(fs_1.default.readFileSync(recFile, 'utf8'));
                    }
                    catch (e) { }
                }
                if (!Array.isArray(recents))
                    recents = [];
                for (const ch of channels) {
                    ch.is_favorite = favorites.includes(ch.id);
                }
                let specialChs = [];
                if (favorites.length > 0) {
                    for (const ch of channels) {
                        if (favorites.includes(ch.id)) {
                            specialChs.push({ ...ch, genre: '⭐ Favorites' });
                        }
                    }
                }
                if (recents.length > 0) {
                    const recentMap = {};
                    recents.forEach((id, idx) => {
                        recentMap[id] = idx;
                    });
                    const recentChs = [];
                    for (const ch of channels) {
                        if (recentMap[ch.id] !== undefined && ch.genre !== '⭐ Favorites') {
                            recentChs.push({
                                ...ch,
                                genre: '🕒 Recents',
                                recent_order: recentMap[ch.id]
                            });
                        }
                    }
                    recentChs.sort((a, b) => a.recent_order - b.recent_order);
                    specialChs = specialChs.concat(recentChs);
                }
                channels = specialChs.concat(channels);
                const responseContent = JSON.stringify(channels);
                const etag = crypto_1.default.createHash('md5').update(responseContent).digest('hex');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('ETag', `"${etag}"`);
                res.setHeader('Vary', 'x-developed-by, x-powered-by, x-github-username');
                if (req.headers['if-none-match'] === `"${etag}"`) {
                    return res.status(304).end();
                }
                res.type('json');
                return res.send(responseContent);
            }
            res.type('json');
            return res.send(channelsJson);
        }
        catch (e) {
            console.error('Error fetching channels:', e);
            return res.json({ error: e.message || 'Unknown error' });
        }
    }
    if (action === "toggle_favorite") {
        const id = params.id;
        if (!id) {
            return res.json({ status: "error", message: "ID required" });
        }
        const host_id = stalkerAPI_1.StalkerAPI.getHostId(activePortal);
        const cookies = parseCookies(req.headers.cookie || '');
        const user_id = cookies.user_id || 'anonymous';
        const favFile = path_1.default.join(DARK_SIDE, `favorites_${user_id}_${host_id}.json`);
        let favorites = [];
        if (fs_1.default.existsSync(favFile)) {
            try {
                favorites = JSON.parse(fs_1.default.readFileSync(favFile, 'utf8'));
            }
            catch (e) { }
        }
        if (!Array.isArray(favorites))
            favorites = [];
        let status = 'removed';
        const idx = favorites.indexOf(id);
        if (idx !== -1) {
            favorites.splice(idx, 1);
        }
        else {
            favorites.push(id);
            status = 'added';
        }
        fs_1.default.writeFileSync(favFile, JSON.stringify(favorites));
        return res.json({ status: "success", favorite: status });
    }
    if (action === "add_recent") {
        const id = params.id;
        if (!id) {
            return res.json({ status: "error", message: "ID required" });
        }
        const host_id = stalkerAPI_1.StalkerAPI.getHostId(activePortal);
        const cookies = parseCookies(req.headers.cookie || '');
        const user_id = cookies.user_id || 'anonymous';
        const recFile = path_1.default.join(DARK_SIDE, `recents_${user_id}_${host_id}.json`);
        let recents = [];
        if (fs_1.default.existsSync(recFile)) {
            try {
                recents = JSON.parse(fs_1.default.readFileSync(recFile, 'utf8'));
            }
            catch (e) { }
        }
        if (!Array.isArray(recents))
            recents = [];
        const idx = recents.indexOf(id);
        if (idx !== -1) {
            recents.splice(idx, 1);
        }
        recents.unshift(id);
        recents = recents.slice(0, 20);
        fs_1.default.writeFileSync(recFile, JSON.stringify(recents));
        return res.json({ status: "success" });
    }
    if (action === "clear_favorites") {
        const host_id = stalkerAPI_1.StalkerAPI.getHostId(activePortal);
        const favFile = path_1.default.join(DARK_SIDE, `favorites_${host_id}.json`);
        if (fs_1.default.existsSync(favFile))
            fs_1.default.unlinkSync(favFile);
        return res.json({ status: "success" });
    }
    if (action === "clear_recents") {
        const host_id = stalkerAPI_1.StalkerAPI.getHostId(activePortal);
        const recFile = path_1.default.join(DARK_SIDE, `recents_${host_id}.json`);
        if (fs_1.default.existsSync(recFile))
            fs_1.default.unlinkSync(recFile);
        return res.json({ status: "success" });
    }
    if (action === "login_details") {
        let content = '';
        const cacheFile = path_1.default.join(DARK_SIDE, "token.stalker");
        if (fs_1.default.existsSync(cacheFile)) {
            const stat = fs_1.default.statSync(cacheFile);
            if (Date.now() - stat.mtimeMs < 86400000) {
                content = fs_1.default.readFileSync(cacheFile, 'utf8');
            }
        }
        if (!content) {
            if (activePortal) {
                return res.json({
                    STALKER: {
                        statusCode: 200,
                        Name: activePortal.Name,
                        URL: activePortal.URL,
                        type: activePortal.type,
                        data: activePortal.type === 'xtream' ? { user_info: {} } : {}
                    },
                    active_portal: activePortal
                });
            }
            return res.json({
                STALKER: {
                    statusCode: 404,
                    message: "Session is offline or requires refresh.",
                    ui_label: "Offline"
                },
                active_portal: activePortal || null
            });
        }
        const protectedContent = stalkerAPI_1.StalkerAPI.protect_profile(content);
        let parsed = {};
        try {
            parsed = JSON.parse(protectedContent);
        }
        catch (e) {
            parsed = { STALKER: {} };
        }
        parsed.active_portal = activePortal || null;
        const finalContent = JSON.stringify(parsed);
        const etag = crypto_1.default.createHash('md5').update(finalContent).digest('hex');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('ETag', `"${etag}"`);
        res.setHeader('Vary', 'x-developed-by, x-powered-by, x-github-username');
        if (req.headers['if-none-match'] === `"${etag}"`) {
            return res.status(304).end();
        }
        res.type('json');
        return res.send(finalContent);
    }
    if (action === "login") {
        const type = (params.type || 'stalker');
        if (type === 'xtream') {
            const xtreamUrl = (params.xtream_URL || '');
            const username = (params.username || '');
            const password = (params.password || '');
            if (xtreamUrl && username && password) {
                let cleanUrl = xtreamUrl.replace(/\/$/, '');
                if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                    cleanUrl = 'http://' + cleanUrl;
                }
                const config = {
                    type: 'xtream',
                    URL: cleanUrl,
                    username,
                    password
                };
                const response = await stalkerAPI_1.StalkerAPI.getXtreamProfile(config);
                const parsed = JSON.parse(response);
                if (parsed?.STALKER?.statusCode === 200) {
                    const host = new URL(cleanUrl).host;
                    setSecureCookie(req, res, 'active_portal_id', `xtream_${host}`, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
                    const sessionToken = jsonwebtoken_1.default.sign(config, auth_1.JWT_SECRET, { expiresIn: '30d' });
                    setSecureCookie(req, res, 'portal_session', sessionToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
                    // Unconditionally sync to login.stalker for iframe compatibility
                    const activeFile = path_1.default.join(DARK_SIDE, "login.stalker");
                    fs_1.default.writeFileSync(activeFile, JSON.stringify(config, null, 2), 'utf8');
                    // Save to persistent secure Portal Vault file in doctor_strange
                    const normalizedHost = host.replace(/[^a-zA-Z0-9_-]/g, '_');
                    const vaultFile = path_1.default.join(DARK_SIDE, `xtream_${normalizedHost}.json`);
                    fs_1.default.writeFileSync(vaultFile, JSON.stringify(config, null, 2), 'utf8');
                    // Clear global caches
                    const tokenFile = path_1.default.join(DARK_SIDE, "token.stalker");
                    const liveFile = path_1.default.join(DARK_SIDE, "live.stalker");
                    const genreFile = path_1.default.join(DARK_SIDE, "genre.json");
                    if (fs_1.default.existsSync(tokenFile))
                        fs_1.default.unlinkSync(tokenFile);
                    if (fs_1.default.existsSync(liveFile))
                        fs_1.default.unlinkSync(liveFile);
                    if (fs_1.default.existsSync(genreFile))
                        fs_1.default.unlinkSync(genreFile);
                }
                return res.send(stalkerAPI_1.StalkerAPI.protect_profile(response));
            }
            else {
                return res.json({
                    STALKER: {
                        Author: "DOCTOR_STRANGE",
                        message: "URL, Username, and Password are required ❌",
                        statusCode: 400
                    }
                });
            }
        }
        let url = (params.URL || '');
        if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }
        const mac = (params.MAC || '');
        let sn = (params.SN || '');
        if (!sn && mac) {
            sn = crypto_1.default.createHash('md5').update(mac).digest('hex').substring(0, 13).toUpperCase();
        }
        const isValidUrl = url.startsWith('http://') || url.startsWith('https://');
        const isValidMac = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
        const isValidSn = sn.length >= 5;
        if (isValidUrl && isValidMac && isValidSn) {
            const cleanUrl = url.replace(/\/c\/?$/, '');
            const model = (params.Model || 'MAG250');
            const d1 = (params.D1 || "D20A30551398D28B10BF3676E4D2442D2442F8A398E42BAB7F203313594891B6");
            const d2 = (params.D2 || "D20A30551398D28B10BF3676E4D2442D2442F8A398E42BAB7F203313594891B6");
            const sg = (params.SG || "");
            const proxy = (params.Proxy || "AUTO");
            const api = (params.API || "263");
            const share = (params.Share || "OFF");
            const config = {
                type: 'stalker',
                URL: cleanUrl,
                MAC: mac,
                SN: sn,
                D1: d1,
                D2: d2,
                SG: sg,
                Model: model,
                Proxy: proxy,
                API: api,
                Share: share,
                hw_version: "1.7-BD-" + crypto_1.default.createHash('md5').update(mac).digest('hex').substring(0, 2).toUpperCase(),
                hw_version_2: crypto_1.default.createHash('md5').update((sn + mac).toLowerCase()).digest('hex')
            };
            const response = await stalkerAPI_1.StalkerAPI.get_profile(config);
            const parsed = JSON.parse(response);
            if (parsed?.STALKER?.statusCode === 200) {
                const host = new URL(cleanUrl).host;
                setSecureCookie(req, res, 'active_portal_id', host, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
                const sessionToken = jsonwebtoken_1.default.sign(config, auth_1.JWT_SECRET, { expiresIn: '30d' });
                setSecureCookie(req, res, 'portal_session', sessionToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
                // Unconditionally sync to login.stalker for iframe compatibility
                const activeFile = path_1.default.join(DARK_SIDE, "login.stalker");
                fs_1.default.writeFileSync(activeFile, JSON.stringify(config, null, 2), 'utf8');
                // Save to persistent secure Portal Vault file in doctor_strange
                const normalizedHost = host.replace(/[^a-zA-Z0-9_-]/g, '_');
                const vaultFile = path_1.default.join(DARK_SIDE, `stalker_${normalizedHost}.json`);
                fs_1.default.writeFileSync(vaultFile, JSON.stringify(config, null, 2), 'utf8');
                // Clear global caches
                const tokenFile = path_1.default.join(DARK_SIDE, "token.stalker");
                const liveFile = path_1.default.join(DARK_SIDE, "live.stalker");
                const genreFile = path_1.default.join(DARK_SIDE, "genre.json");
                if (fs_1.default.existsSync(tokenFile))
                    fs_1.default.unlinkSync(tokenFile);
                if (fs_1.default.existsSync(liveFile))
                    fs_1.default.unlinkSync(liveFile);
                if (fs_1.default.existsSync(genreFile))
                    fs_1.default.unlinkSync(genreFile);
            }
            return res.send(stalkerAPI_1.StalkerAPI.protect_profile(response));
        }
        else {
            let reason = "Connection Failed ❌";
            if (!isValidUrl)
                reason = "Invalid Portal URL Format 🌐";
            else if (!isValidMac)
                reason = "Invalid MAC Address Structure 🖥️";
            else if (!isValidSn)
                reason = "Serial Number (SN) is too short or missing 🔑";
            return res.status(400).json({
                STALKER: {
                    Author: "DOCTOR_STRANGE",
                    message: "CHECKPOINT_ERROR",
                    ui_label: reason,
                    statusCode: 400
                }
            });
        }
    }
    const isAuthorizedAdmin = (() => {
        const cookies = parseCookies(req.headers.cookie || '');
        const authHeader = req.headers.authorization;
        let token = '';
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (cookies.admin_auth) {
            token = cookies.admin_auth;
        }
        else if (req.query.auth) {
            token = req.query.auth;
        }
        if (!token)
            return false;
        try {
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            return decoded && decoded.role === 'admin';
        }
        catch (e) {
            return false;
        }
    })();
    if (action === "all_portals") {
        const portals = [];
        const files = fs_1.default.readdirSync(DARK_SIDE);
        const cookieHeader = (req.headers.cookie || '');
        const cookies = parseCookies(cookieHeader);
        let active_portal_id = cookies.active_portal_id || null;
        if (active_portal_id && active_portal_id.includes('.')) {
            active_portal_id = active_portal_id.replace(/[^a-zA-Z0-9_-]/g, '_');
        }
        if (!active_portal_id && activePortal?.URL) {
            try {
                const host = new URL(activePortal.URL).host;
                const normalizedHost = host.replace(/[^a-zA-Z0-9_-]/g, '_');
                active_portal_id = activePortal.type === 'xtream' ? `xtream_${normalizedHost}` : `stalker_${normalizedHost}`;
            }
            catch (e) { }
        }
        const addedUrls = new Set();
        // 1. Pre-populate with admin database portals
        const dbFile = path_1.default.join(DARK_SIDE, 'admin_db.json');
        if (fs_1.default.existsSync(dbFile)) {
            try {
                const dbData = JSON.parse(fs_1.default.readFileSync(dbFile, 'utf8'));
                if (dbData && Array.isArray(dbData.portals)) {
                    for (const p of dbData.portals) {
                        const normalizedUrl = p.url || p.URL;
                        if (!normalizedUrl)
                            continue;
                        const cleanUrl = normalizedUrl.toLowerCase().trim();
                        if (addedUrls.has(cleanUrl))
                            continue;
                        addedUrls.add(cleanUrl);
                        portals.push({
                            id: p.id,
                            URL: normalizedUrl,
                            MAC: isAuthorizedAdmin ? (p.mac || p.MAC || 'Protected') : 'Protected (Locked)',
                            type: p.type || 'stalker',
                            username: isAuthorizedAdmin ? (p.username || '') : 'Protected',
                            Model: p.model || p.Model || 'MAG250',
                            D1: isAuthorizedAdmin ? (p.D1 || 'Unknown') : 'Protected',
                            D2: isAuthorizedAdmin ? (p.D2 || 'Unknown') : 'Protected',
                            SN: isAuthorizedAdmin ? (p.SN || 'Unknown') : 'Protected'
                        });
                    }
                }
            }
            catch (e) { }
        }
        // 2. Scan flat JSON files and append non-duplicates
        const system_files = ['genre.json', 'admin_db.json', 'iptv_logo_map.json', 'm3u_playlists.json', 'favorites.json', 'recents.json', 'multiverse.log', 'login.stalker', 'token.stalker', 'active_playlist_id.txt'];
        for (const file of files) {
            if (system_files.includes(file))
                continue;
            if (file.startsWith('m3u_channels_'))
                continue;
            if (file.startsWith('favorites_'))
                continue;
            if (file.startsWith('recents_'))
                continue;
            if (!file.endsWith('.json'))
                continue;
            try {
                const data = JSON.parse(fs_1.default.readFileSync(path_1.default.join(DARK_SIDE, file), 'utf8'));
                if (data && data.URL) {
                    const normalizedUrl = data.URL.toLowerCase().trim();
                    if (addedUrls.has(normalizedUrl))
                        continue;
                    addedUrls.add(normalizedUrl);
                    const id = path_1.default.basename(file, ".json");
                    let inferredType = id.startsWith('xtream_') ? 'xtream' : 'stalker';
                    // Robust check: if it looks like Xtream but doesn't have the prefix, it's still Xtream
                    if (inferredType === 'stalker' && data.username && data.password && !data.MAC) {
                        inferredType = 'xtream';
                    }
                    portals.push({
                        id: id,
                        URL: data.URL,
                        MAC: isAuthorizedAdmin ? (data.MAC || 'Protected') : 'Protected (Locked)',
                        type: data.type || inferredType,
                        username: isAuthorizedAdmin ? (data.username || '') : 'Protected',
                        Model: data.Model || 'MAG250',
                        D1: isAuthorizedAdmin ? (data.D1 || 'Unknown') : 'Protected',
                        D2: isAuthorizedAdmin ? (data.D2 || 'Unknown') : 'Protected',
                        SN: isAuthorizedAdmin ? (data.SN || 'Unknown') : 'Protected'
                    });
                }
            }
            catch (e) { }
        }
        // Dynamic credential-based matching for absolute certainty, bypassing all cookie/hostname mismatches
        if (activePortal?.URL) {
            const activeUrl = activePortal.URL.toLowerCase().trim().replace(/\/$/, '');
            const activeType = activePortal.type;
            const activeUser = (activePortal.username || '').toLowerCase().trim();
            const activeMac = (activePortal.MAC || '').toLowerCase().trim().replace(/[:-]/g, '');
            const matched = portals.find(p => {
                const pUrl = (p.URL || '').toLowerCase().trim().replace(/\/$/, '');
                const pType = p.type;
                if (pUrl !== activeUrl || pType !== activeType)
                    return false;
                if (pType === 'xtream') {
                    const pUser = (p.username || '').toLowerCase().trim();
                    return pUser === activeUser;
                }
                else {
                    const pMac = (p.MAC || '').toLowerCase().trim().replace(/[:-]/g, '');
                    return pMac === activeMac || pMac === 'protected' || pMac.startsWith('protected');
                }
            });
            if (matched) {
                active_portal_id = matched.id;
            }
        }
        return res.json({ status: "success", portals, active_portal_id });
    }
    if (action === "stream_info") {
        const contentId = params.id;
        if (!contentId) {
            return res.json({ error: "Content ID is required" });
        }
        if (!activePortal) {
            return res.json({ error: "Login required." });
        }
        try {
            const portal = activePortal;
            let streamUrl = '';
            if (contentId.startsWith('http://') || contentId.startsWith('https://')) {
                streamUrl = contentId;
            }
            else if (contentId.startsWith('stalker_')) {
                const apiResStr = await stalkerAPI_1.StalkerAPI.doctor_strange(contentId, portal);
                try {
                    const apiRes = JSON.parse(apiResStr);
                    streamUrl = stalkerAPI_1.StalkerAPI.id_generator(apiRes?.STALKER?.cmd || '');
                }
                catch (e) { }
            }
            else {
                const api = new XtreamAPI_1.XtreamAPI(portal);
                streamUrl = api.resolveStreamUrl(contentId);
            }
            if (!streamUrl) {
                return res.json({ error: "Invalid stream ID" });
            }
            const axios = require('axios');
            const userAgent = portal.type === 'xtream'
                ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                : 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG200 stbapp ver: 2 rev: 250 Safari/533.3';
            (async () => {
                try {
                    let resolvedUrl = streamUrl;
                    let contentType = '';
                    try {
                        const headRes = await axios({
                            method: 'get',
                            url: streamUrl,
                            headers: { 'User-Agent': userAgent },
                            maxRedirects: 5,
                            timeout: 3000,
                            responseType: 'stream'
                        });
                        resolvedUrl = headRes.request.res.responseUrl || streamUrl;
                        contentType = headRes.headers['content-type'] || '';
                        headRes.data.destroy();
                    }
                    catch (err) { }
                    const lowerUrl = resolvedUrl.toLowerCase();
                    const lowerType = contentType.toLowerCase();
                    const isM3U8 = lowerUrl.includes('.m3u8') || lowerType.includes('mpegurl') || lowerType.includes('mpeg-url') || lowerType.includes('apple.mpegurl');
                    const isTs = !isM3U8 && (lowerUrl.includes('.ts') || lowerType.includes('video/mp2t') || lowerType.includes('video/ts'));
                    const isDirectVideo = !isM3U8 && !isTs && (lowerUrl.includes('.mp4') || lowerUrl.includes('.mkv') || lowerUrl.includes('.avi') || lowerUrl.includes('.mp3') || lowerUrl.includes('.m4a') ||
                        lowerType.includes('video/mp4') || lowerType.includes('video/x-matroska') || lowerType.includes('video/avi'));
                    const cmd = `ffprobe -v error -user_agent "${userAgent}" -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${resolvedUrl}"`;
                    const { exec } = require('child_process');
                    exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
                        let duration = 0;
                        if (!error) {
                            duration = Math.round(parseFloat(stdout.trim()) || 0);
                        }
                        else {
                            console.warn(`[XtreamProxy] ffprobe duration retrieval failed or timed out for ${contentId}`);
                        }
                        if (!res.headersSent) {
                            res.json({
                                status: "success",
                                duration,
                                streamUrl: resolvedUrl,
                                isM3U8,
                                isTs,
                                isDirectVideo
                            });
                        }
                    });
                }
                catch (innerErr) {
                    console.error("[XtreamProxy] Async stream_info error:", innerErr.message);
                    if (!res.headersSent)
                        res.json({ status: "error", duration: 0 });
                }
            })();
            return;
        }
        catch (e) {
            return res.json({ error: e.message });
        }
    }
    if (action === "series_info") {
        const seriesId = params.series_id;
        if (!seriesId) {
            return res.json({ error: "Series ID is required" });
        }
        try {
            const loginFile = path_1.default.join(DARK_SIDE, 'login.stalker');
            if (!fs_1.default.existsSync(loginFile)) {
                return res.json({ error: "Login required." });
            }
            const portal = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
            if (portal.type !== 'xtream') {
                const seriesInfo = await stalkerAPI_1.StalkerAPI.getStalkerSeriesInfo(portal, seriesId);
                return res.send(seriesInfo);
            }
            const seriesInfo = await stalkerAPI_1.StalkerAPI.getXtreamSeriesInfo(portal, seriesId);
            return res.send(seriesInfo);
        }
        catch (e) {
            return res.json({ error: e.message });
        }
    }
    if (action === "clear_cache") {
        const tokenFile = path_1.default.join(DARK_SIDE, "token.stalker");
        const liveFile = path_1.default.join(DARK_SIDE, "live.stalker");
        const moviesFile = path_1.default.join(DARK_SIDE, "movies.stalker");
        const seriesFile = path_1.default.join(DARK_SIDE, "series.stalker");
        const genreFile = path_1.default.join(DARK_SIDE, "genre.json");
        if (fs_1.default.existsSync(tokenFile))
            fs_1.default.unlinkSync(tokenFile);
        if (fs_1.default.existsSync(liveFile))
            fs_1.default.unlinkSync(liveFile);
        if (fs_1.default.existsSync(moviesFile))
            fs_1.default.unlinkSync(moviesFile);
        if (fs_1.default.existsSync(seriesFile))
            fs_1.default.unlinkSync(seriesFile);
        if (fs_1.default.existsSync(genreFile))
            fs_1.default.unlinkSync(genreFile);
        const cachedFiles = fs_1.default.readdirSync(LIGHT_SIDE);
        for (const cf of cachedFiles) {
            try {
                fs_1.default.unlinkSync(path_1.default.join(LIGHT_SIDE, cf));
            }
            catch (e) { }
        }
        return res.json({ status: "success", message: "Cache cleared successfully" });
    }
    if (action === "switch_portal") {
        const portalId = params.id;
        const sourceFile = path_1.default.join(DARK_SIDE, `${portalId}.json`);
        const activeFile = path_1.default.join(DARK_SIDE, "login.stalker");
        // Dynamic auto-healing for portalId mismatch (e.g., underscores vs dots)
        if (!fs_1.default.existsSync(sourceFile)) {
            const dbFile = path_1.default.join(DARK_SIDE, 'admin_db.json');
            if (fs_1.default.existsSync(dbFile)) {
                try {
                    const dbData = JSON.parse(fs_1.default.readFileSync(dbFile, 'utf8'));
                    if (dbData && Array.isArray(dbData.portals)) {
                        const matchedPortal = dbData.portals.find((p) => p.id === portalId);
                        if (matchedPortal) {
                            const isXtream = matchedPortal.type === 'xtream' || !!(matchedPortal.username && matchedPortal.password);
                            let portalConfig = {};
                            if (isXtream) {
                                portalConfig = {
                                    URL: matchedPortal.url || matchedPortal.URL,
                                    username: matchedPortal.username,
                                    password: matchedPortal.password,
                                    type: 'xtream',
                                    Name: matchedPortal.name
                                };
                            }
                            else {
                                const macAddr = matchedPortal.mac || matchedPortal.MAC;
                                portalConfig = {
                                    URL: matchedPortal.url || matchedPortal.URL,
                                    MAC: macAddr,
                                    SN: matchedPortal.sn || matchedPortal.SN || crypto_1.default.createHash('md5').update(macAddr).digest('hex').substring(0, 13).toUpperCase(),
                                    Model: matchedPortal.model || matchedPortal.Model || 'MAG250',
                                    D1: matchedPortal.D1 || crypto_1.default.createHash('sha256').update(macAddr + "D1").digest('hex').toUpperCase(),
                                    D2: matchedPortal.D2 || crypto_1.default.createHash('sha256').update(macAddr + "D2").digest('hex').toUpperCase(),
                                    type: 'stalker',
                                    Name: matchedPortal.name
                                };
                            }
                            fs_1.default.writeFileSync(sourceFile, JSON.stringify(portalConfig, null, 2), 'utf8');
                            console.log(`[Auto-Heal] Reconstructed configuration for ${portalId} successfully.`);
                        }
                    }
                }
                catch (err) {
                    console.error("[Auto-Heal] Failed to auto-heal config from admin_db.json:", err.message);
                }
            }
        }
        if (fs_1.default.existsSync(sourceFile)) {
            try {
                console.log(`[SwitchPortal] Switching to portal: ${portalId}. Source file: ${sourceFile}`);
                // Clear directory cache_stalker for fresh data
                const cachedFiles = fs_1.default.readdirSync(LIGHT_SIDE);
                for (const file of cachedFiles) {
                    try {
                        fs_1.default.unlinkSync(path_1.default.join(LIGHT_SIDE, file));
                    }
                    catch (e) {
                        // ignore
                    }
                }
                const data = JSON.parse(fs_1.default.readFileSync(sourceFile, 'utf8'));
                console.log(`[SwitchPortal] Successfully loaded config for ${portalId}. Data:`, JSON.stringify(data).substring(0, 50));
                if (!data.type) {
                    const isXtream = !!(data.username && data.password && !data.MAC);
                    data.type = isXtream ? 'xtream' : 'stalker';
                    fs_1.default.writeFileSync(sourceFile, JSON.stringify(data, null, 2), 'utf8');
                    console.log(`[SwitchPortal] Auto-updated type to ${data.type}`);
                }
                // Write active portal session unconditionally to support iframe previews/public switching!
                fs_1.default.writeFileSync(activeFile, JSON.stringify(data, null, 2), 'utf8');
                console.log(`[SwitchPortal] Updated active login.stalker for portal: ${portalId}. Path: ${activeFile}`);
                setSecureCookie(req, res, 'active_portal_id', portalId, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: false });
                console.log(`[SwitchPortal] Set active_portal_id cookie to: ${portalId}`);
                const sessionToken = jsonwebtoken_1.default.sign(data, auth_1.JWT_SECRET, { expiresIn: '30d' });
                setSecureCookie(req, res, 'portal_session', sessionToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
                console.log(`[SwitchPortal] Set portal_session cookie`);
                const cookies = parseCookies(req.headers.cookie || '');
                const user_id = cookies.user_id || 'anonymous';
                const playlistIdFile = path_1.default.join(DARK_SIDE, `active_playlist_id_${user_id}.txt`);
                fs_1.default.writeFileSync(playlistIdFile, "portal", 'utf8');
                console.log(`[SwitchPortal] Set playlist to portal for user: ${user_id}`);
                // Clear both portal-specific and global handshake/channel/genre caches to force a fresh pull!
                const cleanupFiles = [
                    path_1.default.join(DARK_SIDE, 'token.stalker'),
                    path_1.default.join(DARK_SIDE, 'live.stalker'),
                    path_1.default.join(DARK_SIDE, 'movies.stalker'),
                    path_1.default.join(DARK_SIDE, 'series.stalker'),
                    path_1.default.join(DARK_SIDE, 'genre.json'),
                    path_1.default.join(DARK_SIDE, `token_${portalId}.stalker`),
                    path_1.default.join(DARK_SIDE, `live_${portalId}.stalker`),
                    path_1.default.join(DARK_SIDE, `movies_${portalId}.stalker`),
                    path_1.default.join(DARK_SIDE, `series_${portalId}.stalker`),
                    path_1.default.join(DARK_SIDE, `genre_${portalId}.json`)
                ];
                for (const file of cleanupFiles) {
                    if (fs_1.default.existsSync(file)) {
                        fs_1.default.unlinkSync(file);
                        console.log(`[SwitchPortal] Deleted cache file: ${file}`);
                    }
                }
                // Also parse hostname for possible alternate file names
                try {
                    const host = new URL(data.URL).host;
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `token_${host}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `live_${host}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `movies_${host}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `series_${host}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `genre_${host}.json`));
                    const host_id = host.replace(/[^a-zA-Z0-9]/g, "_");
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `live_${host_id}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `movies_${host_id}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `series_${host_id}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `genre_${host_id}.json`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `get_live_categories_xtream_${host}.json`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `get_vod_categories_xtream_${host}.json`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `get_series_categories_xtream_${host}.json`));
                    const host_id_real = stalkerAPI_1.StalkerAPI.getHostId(data);
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `token_${host_id_real}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `live_${host_id_real}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `movies_${host_id_real}.stalker`));
                    cleanupFiles.push(path_1.default.join(DARK_SIDE, `series_${host_id_real}.stalker`));
                }
                catch (e) { }
                cleanupFiles.forEach(cf => {
                    if (fs_1.default.existsSync(cf)) {
                        try {
                            fs_1.default.unlinkSync(cf);
                        }
                        catch (e) { }
                    }
                });
                // Clear server-side memory & temporary cache files as well
                try {
                    const cachedFiles = fs_1.default.readdirSync(LIGHT_SIDE);
                    for (const cf of cachedFiles) {
                        try {
                            fs_1.default.unlinkSync(path_1.default.join(LIGHT_SIDE, cf));
                        }
                        catch (e) { }
                    }
                }
                catch (e) { }
                return res.json({ statusCode: 200, message: "Portal Switched Successfully" });
            }
            catch (e) {
                return res.json({ statusCode: 500, message: "Failed to update active session" });
            }
        }
        else {
            return res.json({ statusCode: 404, message: "Saved portal not found" });
        }
    }
    if (action === "m3u_list") {
        return res.json({
            status: "success",
            playlists: [],
            active_id: "portal"
        });
    }
    if (action === "m3u_save") {
        const name = (params.name || '').toString().trim();
        const url = (params.url || '').toString().trim();
        const file_content = (params.file_content || '');
        let token = '';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else {
            const cookies = parseCookies(req.headers.cookie || '');
            token = cookies.admin_auth;
        }
        let isAdmin = false;
        if (token) {
            try {
                const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
                if (decoded && decoded.role === 'admin') {
                    isAdmin = true;
                }
            }
            catch (err) { }
        }
        if (!isAdmin && (params.password || '').toString() === "2008") {
            isAdmin = true;
        }
        if (!isAdmin) {
            return res.json({ status: "error", message: "Unauthorized: Invalid Security Password." });
        }
        if (!name) {
            return res.json({ status: "error", message: "Playlist name is required" });
        }
        let m3u_content = '';
        let source_type = '';
        let source_value = '';
        if (url) {
            if (!stalkerAPI_1.StalkerAPI.is_safe_m3u_url(url)) {
                return res.json({ status: "error", message: "Unsafe or invalid M3U URL provided" });
            }
            source_type = 'url';
            source_value = url;
            try {
                const response = await axios_1.default.get(url, {
                    timeout: 30000,
                    httpsAgent,
                    responseType: 'stream'
                });
                m3u_content = response.data;
            }
            catch (e) {
                return res.json({ status: "error", message: `Failed to fetch M3U URL: ${e.message}` });
            }
        }
        else if (file_content) {
            source_type = 'file';
            source_value = 'Uploaded File';
            m3u_content = Buffer.from(file_content, 'base64').toString('utf8');
        }
        else {
            return res.json({ status: "error", message: "No playlist URL or file provided" });
        }
        if (!m3u_content.includes('#EXTM3U')) {
            return res.json({ status: "error", message: "Invalid playlist. Must be a valid M3U format starting with #EXTM3U" });
        }
        const logoMap = await stalkerAPI_1.StalkerAPI.get_iptv_org_logo_map();
        const channels = stalkerAPI_1.StalkerAPI.parse_m3u_content(m3u_content, logoMap);
        if (channels.length === 0) {
            return res.json({ status: "error", message: "No valid channels found in this playlist" });
        }
        return res.json({
            status: "success",
            message: "Playlist parsed successfully",
            channels: channels,
            channels_count: channels.length,
            name: name,
            source_type: source_type,
            source_value: source_value
        });
    }
    if (action === "m3u_switch") {
        return res.json({ status: "success", message: "Switched successfully" });
    }
    if (action === "m3u_delete") {
        const playlist_id = (params.id || '').toString().trim();
        const cookies = parseCookies(req.headers.cookie || '');
        const user_id = cookies.user_id || 'anonymous';
        const activeFile = path_1.default.join(DARK_SIDE, `active_playlist_id_${user_id}.txt`);
        if (fs_1.default.existsSync(activeFile)) {
            const active_id = fs_1.default.readFileSync(activeFile, 'utf8').trim();
            if (active_id === playlist_id) {
                fs_1.default.writeFileSync(activeFile, 'portal', 'utf8');
            }
        }
        return res.json({ status: "success", message: "Playlist deleted successfully" });
    }
    if (action === "delete_portal") {
        const portalId = (params.id || '').toString().trim();
        if (!portalId) {
            return res.json({ statusCode: 400, message: "Portal ID required" });
        }
        const file = path_1.default.join(DARK_SIDE, `${portalId}.json`);
        if (fs_1.default.existsSync(file)) {
            fs_1.default.unlinkSync(file);
            // Also delete associated token and cache if any
            const tokenFile = path_1.default.join(DARK_SIDE, `token_${portalId}.stalker`);
            const liveFile = path_1.default.join(DARK_SIDE, `live_${portalId}.stalker`);
            const genreFile = path_1.default.join(DARK_SIDE, `genre_${portalId}.json`);
            if (fs_1.default.existsSync(tokenFile))
                fs_1.default.unlinkSync(tokenFile);
            if (fs_1.default.existsSync(liveFile))
                fs_1.default.unlinkSync(liveFile);
            if (fs_1.default.existsSync(genreFile))
                fs_1.default.unlinkSync(genreFile);
            const loginFile = path_1.default.join(DARK_SIDE, "login.stalker");
            if (fs_1.default.existsSync(loginFile)) {
                try {
                    const active_data = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
                    if (active_data?.URL && new URL(active_data.URL).host === portalId) {
                        fs_1.default.unlinkSync(loginFile);
                    }
                }
                catch (e) { }
            }
            return res.json({ status: "success", statusCode: 200, message: "Portal identity deleted" });
        }
        else {
            return res.json({ status: "error", statusCode: 404, message: "Portal not found" });
        }
    }
    if (action === "save_portal") {
        const portalId = (params.id || '').toString().trim();
        const url = (params.url || '').toString().trim();
        const username = (params.username || '').toString().trim();
        const password = (params.password || '').toString().trim();
        if (!portalId || !url) {
            return res.json({ statusCode: 400, message: "Portal ID and URL are required" });
        }
        const file = path_1.default.join(DARK_SIDE, `${portalId}.json`);
        if (fs_1.default.existsSync(file)) {
            try {
                const data = JSON.parse(fs_1.default.readFileSync(file, 'utf8'));
                if (!data.type) {
                    const isXtream = !!(data.username && data.password && !data.MAC);
                    data.type = isXtream ? 'xtream' : 'stalker';
                }
                data.URL = url;
                if (data.type === 'xtream') {
                    data.username = username;
                    if (password)
                        data.password = password;
                }
                fs_1.default.writeFileSync(file, JSON.stringify(data, null, 2));
                const loginFile = path_1.default.join(DARK_SIDE, "login.stalker");
                if (fs_1.default.existsSync(loginFile)) {
                    const active_data = JSON.parse(fs_1.default.readFileSync(loginFile, 'utf8'));
                    if (active_data?.URL) {
                        try {
                            const cookieHeader = (req.headers.cookie || '');
                            const cookies = parseCookies(cookieHeader);
                            const currentActiveId = cookies.active_portal_id;
                            // Also fallback to URL match if cookie isn't available
                            const activeHost = new URL(active_data.URL).host;
                            const savedHost = new URL(data.URL).host;
                            const isHostMatch = activeHost === savedHost;
                            if (currentActiveId === portalId || isHostMatch) {
                                active_data.URL = url;
                                if (active_data.type === 'xtream') {
                                    active_data.username = username;
                                    if (password)
                                        active_data.password = password;
                                }
                                fs_1.default.writeFileSync(loginFile, JSON.stringify(active_data, null, 2));
                                const tokenFile = path_1.default.join(DARK_SIDE, `token_${portalId}.stalker`);
                                if (fs_1.default.existsSync(tokenFile))
                                    fs_1.default.unlinkSync(tokenFile);
                                const liveFile = path_1.default.join(DARK_SIDE, `live_${portalId}.stalker`);
                                if (fs_1.default.existsSync(liveFile))
                                    fs_1.default.unlinkSync(liveFile);
                                const moviesFile = path_1.default.join(DARK_SIDE, `movies_${portalId}.stalker`);
                                if (fs_1.default.existsSync(moviesFile))
                                    fs_1.default.unlinkSync(moviesFile);
                                const seriesFile = path_1.default.join(DARK_SIDE, `series_${portalId}.stalker`);
                                if (fs_1.default.existsSync(seriesFile))
                                    fs_1.default.unlinkSync(seriesFile);
                                const genreFile = path_1.default.join(DARK_SIDE, `genre_${portalId}.json`);
                                if (fs_1.default.existsSync(genreFile))
                                    fs_1.default.unlinkSync(genreFile);
                            }
                        }
                        catch (e) { }
                    }
                }
                return res.json({ status: "success", statusCode: 200, message: "Portal updated successfully" });
            }
            catch (e) {
                return res.json({ status: "error", statusCode: 500, message: e.message });
            }
        }
        else {
            return res.json({ status: "error", statusCode: 404, message: "Portal not found" });
        }
    }
    return res.status(400).json({ error: "Unknown Action Protocol" });
});
const zlib_1 = __importDefault(require("zlib"));
app.get('/api/epg-proxy', async (req, res) => {
    const epgUrl = req.query.url;
    if (!epgUrl) {
        return res.status(400).json({ error: 'url parameter is required' });
    }
    const CACHE_DIR = path_1.default.join(process.cwd(), 'cache_stalker');
    if (!fs_1.default.existsSync(CACHE_DIR))
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
    const hash = crypto_1.default.createHash('md5').update(epgUrl).digest('hex');
    const cacheFile = path_1.default.join(CACHE_DIR, `epg_cache_${hash}.xml`);
    const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
    try {
        if (fs_1.default.existsSync(cacheFile)) {
            const stats = fs_1.default.statSync(cacheFile);
            if (Date.now() - stats.mtimeMs < CACHE_TTL) {
                res.setHeader('Content-Type', 'application/xml');
                res.setHeader('Access-Control-Allow-Origin', '*');
                const readStream = fs_1.default.createReadStream(cacheFile);
                return readStream.pipe(res);
            }
        }
        const response = await axios_1.default.get(epgUrl, {
            timeout: 60000,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            },
            httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false })
        });
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Access-Control-Allow-Origin', '*');
        const writeStream = fs_1.default.createWriteStream(cacheFile);
        if (epgUrl.endsWith('.gz')) {
            const gunzip = zlib_1.default.createGunzip();
            gunzip.on('error', (err) => {
                console.error('Gunzip error:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to decompress EPG' });
                }
            });
            const decodedStream = response.data.pipe(gunzip);
            decodedStream.pipe(writeStream);
            decodedStream.pipe(res);
        }
        else {
            response.data.pipe(writeStream);
            response.data.pipe(res);
        }
    }
    catch (err) {
        return res.status(500).json({ error: `Failed to fetch EPG: ${err.message}` });
    }
});
app.get('/api/epg-json', async (req, res) => {
    const urlsStr = req.query.urls;
    if (!urlsStr) {
        return res.status(400).json({ error: 'urls parameter is required' });
    }
    const urls = urlsStr.split(',').map(u => u.trim()).filter(Boolean);
    const hash = crypto_1.default.createHash('md5').update(urls.join(',')).digest('hex');
    const CACHE_DIR = path_1.default.join(process.cwd(), 'cache_stalker');
    if (!fs_1.default.existsSync(CACHE_DIR))
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
    const jsonCacheFile = path_1.default.join(CACHE_DIR, `epg_json_${hash}.json.gz`);
    const CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
    try {
        if (fs_1.default.existsSync(jsonCacheFile)) {
            const stats = fs_1.default.statSync(jsonCacheFile);
            if (Date.now() - stats.mtimeMs < CACHE_TTL) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Encoding', 'gzip');
                res.setHeader('Access-Control-Allow-Origin', '*');
                const readStream = fs_1.default.createReadStream(jsonCacheFile);
                return readStream.pipe(res);
            }
        }
        let allChannels = [];
        let allProgrammes = [];
        // Parallel fetching with 12s timeout per URL
        const fetchResults = await Promise.allSettled(urls.map(async (url) => {
            const urlHash = crypto_1.default.createHash('md5').update(url).digest('hex');
            const xmlCacheFile = path_1.default.join(CACHE_DIR, `epg_xml_${urlHash}.xml`);
            let xmlText = '';
            let shouldFetch = true;
            if (fs_1.default.existsSync(xmlCacheFile)) {
                const stats = fs_1.default.statSync(xmlCacheFile);
                if (Date.now() - stats.mtimeMs < CACHE_TTL) {
                    xmlText = fs_1.default.readFileSync(xmlCacheFile, 'utf8');
                    shouldFetch = false;
                }
            }
            if (shouldFetch) {
                const response = await axios_1.default.get(url, {
                    timeout: 12000,
                    responseType: 'arraybuffer',
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                    httpsAgent: new https_1.default.Agent({ rejectUnauthorized: false })
                });
                let buf = response.data;
                if (url.endsWith('.gz')) {
                    try {
                        buf = zlib_1.default.gunzipSync(buf);
                    }
                    catch (e) {
                        // May already be decompressed
                    }
                }
                xmlText = buf.toString('utf8');
                if (xmlText.length > 50) {
                    fs_1.default.writeFileSync(xmlCacheFile, xmlText, 'utf8');
                }
            }
            return xmlText;
        }));
        for (const resItem of fetchResults) {
            if (resItem.status !== 'fulfilled' || !resItem.value)
                continue;
            const xmlText = resItem.value;
            const chanRegex = /<channel\s+id=["']([^"']+)["'][^>]*>([\s\S]*?)<\/channel>/gi;
            let cm;
            while ((cm = chanRegex.exec(xmlText)) !== null) {
                const inner = cm[2];
                const nameM = inner.match(/<display-name[^>]*>([^<]+)<\/display-name>/i);
                const iconM = inner.match(/<icon\s+src=["']([^"']+)["']/i);
                allChannels.push({
                    id: cm[1],
                    name: nameM ? nameM[1].trim() : cm[1],
                    logo: iconM ? iconM[1] : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=100&h=100&fit=crop'
                });
            }
            const progRegex = /<programme\s+start=["']([^"']+)["']\s+stop=["']([^"']+)["']\s+channel=["']([^"']+)["'][^>]*>([\s\S]*?)<\/programme>/gi;
            let pm;
            while ((pm = progRegex.exec(xmlText)) !== null) {
                const inner = pm[4];
                const titleM = inner.match(/<title[^>]*>([^<]+)<\/title>/i);
                const descM = inner.match(/<desc[^>]*>([^<]+)<\/desc>/i);
                const catM = inner.match(/<category[^>]*>([^<]+)<\/category>/i);
                allProgrammes.push({
                    channel: pm[3],
                    start: pm[1],
                    end: pm[2],
                    title: titleM ? titleM[1].trim() : "Live Broadcast",
                    desc: descM ? descM[1].trim() : "",
                    category: catM ? catM[1].trim() : "General"
                });
            }
        }
        if (allChannels.length === 0) {
            // High quality fallback channels if remote providers fail
            const fallbackChans = [
                { id: "ts840", name: "Tata Play Live", logo: "https://mediaready.videoready.tv/tatasky/image/fetch/f_auto,fl_lossy,q_auto/https://pt-static1.videoready.tv/assets/epg/1.0/0_4_1.png" },
                { id: "sky_sports_main", name: "Sky Sports Main Event HD", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=100&h=100&fit=crop" },
                { id: "star_sports_1", name: "Star Sports 1 HD", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=100&h=100&fit=crop" },
                { id: "tnt_sports_1", name: "TNT Sports 1 HD", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=100&h=100&fit=crop" },
                { id: "bbc_one", name: "BBC One HD", logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=100&h=100&fit=crop" },
                { id: "sony_ten_1", name: "Sony Sports Ten 1 HD", logo: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=100&h=100&fit=crop" }
            ];
            const dayStart = new Date();
            dayStart.setHours(0, 0, 0, 0);
            const startTimeMs = dayStart.getTime();
            allChannels = fallbackChans;
            fallbackChans.forEach(ch => {
                let cur = startTimeMs;
                let pIndex = 1;
                while (cur < startTimeMs + 3 * 86400000) {
                    const duration = (2 + (pIndex % 3)) * 3600000;
                    const startTimeStr = new Date(cur).toISOString().replace(/[-:T.]/g, '').slice(0, 14) + " +0000";
                    const endTimeStr = new Date(cur + duration).toISOString().replace(/[-:T.]/g, '').slice(0, 14) + " +0000";
                    allProgrammes.push({
                        channel: ch.id,
                        start: startTimeStr,
                        end: endTimeStr,
                        title: `${ch.name} Live Broadcast ${pIndex}`,
                        desc: `Continuous live broadcasting stream for ${ch.name}.`,
                        category: pIndex % 2 === 0 ? "Sports" : "General"
                    });
                    cur += duration;
                    pIndex++;
                }
            });
        }
        const jsonStr = JSON.stringify({ channels: allChannels, programmes: allProgrammes });
        const jsonGz = zlib_1.default.gzipSync(jsonStr);
        fs_1.default.writeFileSync(jsonCacheFile, jsonGz);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(jsonGz);
    }
    catch (err) {
        console.error("EPG processing error:", err);
        return res.status(200).json({
            channels: [
                { id: "fallback_1", name: "Stalker Pro Live Channel", logo: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=100&h=100&fit=crop" }
            ],
            programmes: [
                {
                    channel: "fallback_1",
                    start: new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14) + " +0000",
                    end: new Date(Date.now() + 86400000).toISOString().replace(/[-:T.]/g, '').slice(0, 14) + " +0000",
                    title: "Live Continuous Transmission",
                    desc: "Live feed transmission stream.",
                    category: "General"
                }
            ]
        });
    }
});
app.options('/xtream.php', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    res.sendStatus(204);
});
app.get('/xtream.php', xtreamProxy_1.handleXtreamStream);
console.log('Attempting to start server on port', port);
const server = app.listen(port, '0.0.0.0', () => {
    // Initial fetch of live sports
    (0, sportsM3u_1.getOrUpdatePlaylist)().catch(() => { });
    // Background task: Update M3U periodically every 10 mins (600,000 ms)
    setInterval(() => {
        (0, sportsM3u_1.getOrUpdatePlaylist)(true).catch(e => console.error("[!] Background M3U fetch error:", e));
    }, 10 * 60 * 1000);
    console.log(`Server running at http://0.0.0.0:${port}`);
});
server.timeout = 0;
server.keepAliveTimeout = 0;
server.headersTimeout = 0;
app.get('/test-ua', (req, res) => { res.send(req.headers['user-agent'] || 'none'); });
