import axios from "axios";
import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { requireAdmin, JWT_SECRET, getClientIp } from '../middleware/auth';
import { StalkerAPI } from '../stalkerAPI';
import { activeSessions, refreshBlacklist, systemState, systemStatus as globalSystemStatus } from '../../server';
import * as server from '../../server';
import { killAllActiveStreams } from '../proxy';
import { getOrUpdatePlaylist } from './sportsM3u';

const router = Router();

// Protected Storage for M3U playlists
const DARK_SIDE = path.join(process.cwd(), 'doctor_strange');
const LIGHT_SIDE = path.join(process.cwd(), 'cache_stalker');
const M3U_VAULT = path.join(DARK_SIDE, 'm3u_playlists');
const DB_FILE = path.join(DARK_SIDE, 'admin_db.json');

// Ensure directories exist
[DARK_SIDE, LIGHT_SIDE, M3U_VAULT].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Admin DB interface
interface Portal {
    id: string;
    name: string;
    url: string;
    mac?: string;
    model?: string;
    username?: string;
    password?: string;
    type?: 'stalker' | 'xtream';
    isDefault: boolean;
}

interface M3UPlaylist {
    id: string;
    name: string;
    filePath: string;
    uploadedAt: string;
    isActive: boolean;
    channelsCount: number;
}

interface SecurityIncident {
    ip: string;
    username: string;
    timestamp: number;
    reason: string;
}

interface SportsSection {
    id: string;
    title: string;
    icon: string;
    url: string;
    addedAt: string;
}

interface AdminDB {
    portals: Portal[];
    m3uPlaylists: M3UPlaylist[];
    sports?: SportsSection[];
    liveEvents?: SportsSection[];
    maintenanceMode: boolean;
    consumetMaintenance?: boolean;
    playMaintenance?: boolean;
    playConsumetMaintenance?: boolean;
    activeTemplate: string;
    maintenanceMusicMode?: 'query' | 'random' | 'playlist';
    maintenanceMusicQuery?: string;
    maintenanceMusicPlaylist?: any[];
    blacklist?: string[];
    incidents?: SecurityIncident[];
    systemStatus?: 'active' | 'offline';
    developerMode?: boolean;
    allowedDeveloperIps?: string[];
    features?: {
        m3uEnabled: boolean;
        stalkerEnabled: boolean;
        firewallEnabled: boolean;
        publicPlaylistEnabled: boolean;
    };
}

// In-memory tracker for failed attempts (per session)
const loginFailures = new Map<string, number>();

/**
 * Load or initialize the admin DB.
 */
function getDB(): AdminDB {
    if (!fs.existsSync(DB_FILE)) {
        const initial: AdminDB = {
            portals: [],
            m3uPlaylists: [],
            sports: [],
            liveEvents: [],
            maintenanceMode: false,
            activeTemplate: 'Scheduled Downtime',
            blacklist: [],
            incidents: [],
            systemStatus: 'active',
            features: {
                m3uEnabled: true,
                stalkerEnabled: true,
                firewallEnabled: true,
                publicPlaylistEnabled: true
            }
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 4), 'utf8');
        return initial;
    }
    try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
        // Sync with any existing stalker portals if our db has none
        if ((!data.portals || data.portals.length === 0)) {
            data.portals = scanExistingStalkerPortals();
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4), 'utf8');
        }
        return {
            portals: data.portals || [],
            m3uPlaylists: data.m3uPlaylists || [],
            sports: data.sports || [],
            liveEvents: data.liveEvents || [],
            maintenanceMode: !!data.maintenanceMode,
            activeTemplate: data.activeTemplate || 'Scheduled Downtime',
            blacklist: data.blacklist || [],
            incidents: data.incidents || [],
            systemStatus: data.systemStatus || 'active',
            developerMode: !!data.developerMode,
            allowedDeveloperIps: data.allowedDeveloperIps || [],
            features: data.features || {
                m3uEnabled: true,
                stalkerEnabled: true,
                firewallEnabled: true,
                publicPlaylistEnabled: true
            }
        };
    } catch (e) {
        return {
            portals: [],
            m3uPlaylists: [],
            sports: [],
            liveEvents: [],
            maintenanceMode: false,
            activeTemplate: 'Scheduled Downtime',
            blacklist: [],
            features: {
                m3uEnabled: true,
                stalkerEnabled: true,
                firewallEnabled: true,
                publicPlaylistEnabled: true
            }
        };
    }
}

function saveDB(db: AdminDB) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 4), 'utf8');
}

/**
 * Helper to scan existing portal json files in doctor_strange.
 */
function scanExistingStalkerPortals(): Portal[] {
    const portals: Portal[] = [];
    const files = fs.readdirSync(DARK_SIDE);
    const systemFiles = ['genre.json', 'iptv_logo_map.json', 'm3u_playlists.json', 'favorites.json', 'recents.json', 'multiverse.log', 'login.stalker', 'token.stalker', 'active_playlist_id.txt', 'admin_db.json'];
    
    // Check if there is an active login file to see what is default
    let activeHost = '';
    const loginFile = path.join(DARK_SIDE, 'login.stalker');
    if (fs.existsSync(loginFile)) {
        try {
            const activeLogin = JSON.parse(fs.readFileSync(loginFile, 'utf8'));
            if (activeLogin?.URL) {
                activeHost = new URL(activeLogin.URL).host;
            }
        } catch (e) {}
    }

    for (const file of files) {
        if (systemFiles.includes(file)) continue;
        if (file.startsWith('m3u_channels_')) continue;
        if (file.startsWith('favorites_')) continue;
        if (file.startsWith('recents_')) continue;
        if (!file.endsWith('.json')) continue;

        try {
            const data = JSON.parse(fs.readFileSync(path.join(DARK_SIDE, file), 'utf8'));
            if (data && data.URL) {
                const host = new URL(data.URL).host;
                let portalType = data.type;
                if (!portalType) {
                    portalType = !!(data.username && data.password && !data.MAC) ? 'xtream' : 'stalker';
                }
                
                portals.push({
                    id: path.basename(file, '.json'),
                    name: data.Name || host,
                    url: data.URL,
                    type: portalType,
                    username: data.username || '',
                    password: data.password || '',
                    mac: data.MAC || '',
                    model: data.Model || 'MAG250',
                    isDefault: host === activeHost
                });
            }
        } catch (e) {}
    }
    return portals;
}

// Multer Config
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.m3u' || ext === '.m3u8') {
        cb(null, true);
    } else {
        cb(new Error('Invalid File Type: Only .m3u and .m3u8 files are allowed.'), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, M3U_VAULT);
    },
    filename: (req, file, cb) => {
        const hash = crypto.createHash('md5').update(file.originalname + Date.now()).digest('hex').substring(0, 8);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `playlist-${hash}${ext}`);
    }
});

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB max
});

// --- ADMIN API ENDPOINTS ---

// GET /features - Get feature access states
router.get('/features', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        features: db.features
    });
});

// POST /features - Update feature access states
router.post('/features', requireAdmin, (req: Request, res: Response) => {
    const { m3uEnabled, stalkerEnabled, firewallEnabled, publicPlaylistEnabled } = req.body;
    const db = getDB();
    
    if (db.features) {
        if (m3uEnabled !== undefined) db.features.m3uEnabled = !!m3uEnabled;
        if (stalkerEnabled !== undefined) db.features.stalkerEnabled = !!stalkerEnabled;
        if (firewallEnabled !== undefined) db.features.firewallEnabled = !!firewallEnabled;
        if (publicPlaylistEnabled !== undefined) db.features.publicPlaylistEnabled = !!publicPlaylistEnabled;
    } else {
        db.features = {
            m3uEnabled: m3uEnabled !== undefined ? !!m3uEnabled : true,
            stalkerEnabled: stalkerEnabled !== undefined ? !!stalkerEnabled : true,
            firewallEnabled: firewallEnabled !== undefined ? !!firewallEnabled : true,
            publicPlaylistEnabled: publicPlaylistEnabled !== undefined ? !!publicPlaylistEnabled : true
        };
    }
    
    saveDB(db);
    res.json({
        status: "success",
        message: "Feature access settings updated successfully.",
        features: db.features
    });
});

// GET /stats - System overview statistics
router.get('/stats', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    const activePortal = db.portals.find(p => p.isDefault);
    
    // Count M3U Channels
    let m3uChannelsCount = 0;
    db.m3uPlaylists.forEach(pl => {
        const channelsFile = path.join(DARK_SIDE, `m3u_channels_${pl.id}.json`);
        if (fs.existsSync(channelsFile)) {
            try {
                const channels = JSON.parse(fs.readFileSync(channelsFile, 'utf8'));
                m3uChannelsCount += channels.length;
            } catch (e) {}
        }
    });

    res.json({
        status: "success",
        stats: {
            totalPortals: db.portals.length,
            totalM3U: db.m3uPlaylists.length,
            totalBlacklisted: (db.blacklist || []).length,
            totalIncidents: (db.incidents || []).length,
            activeSessions: activeSessions.size,
            activePortal: activePortal ? activePortal.name : 'None',
            m3uChannels: m3uChannelsCount,
            systemStatus: db.systemStatus || 'active'
        }
    });
});

// POST /system/clear-cache - Purge Stalker API cache
router.post('/system/clear-cache', requireAdmin, (req: Request, res: Response) => {
    const cacheDir = path.join(process.cwd(), 'cache_stalker');
    if (fs.existsSync(cacheDir)) {
        const files = fs.readdirSync(cacheDir);
        let deletedCount = 0;
        files.forEach(file => {
            if (file !== 'index.php') {
                fs.unlinkSync(path.join(cacheDir, file));
                deletedCount++;
            }
        });
        return res.json({
            status: "success",
            message: `Successfully purged ${deletedCount} cached files. API is now fresh.`
        });
    }
    res.json({ status: "error", message: "Cache directory not found." });
});

/**
 * --- MONITOR & FIREWALL ENDPOINTS ---
 */

// POST /system/cleanup - Deep clean system artifacts
router.post('/system/cleanup', requireAdmin, (req: Request, res: Response) => {
    try {
        const type = req.body.type;
        const cacheDir = path.join(process.cwd(), 'cache_stalker');
        const dataDir = path.join(process.cwd(), 'doctor_strange');

        if (type === 'cache') {
            if (fs.existsSync(cacheDir)) {
                const files = fs.readdirSync(cacheDir);
                for (const file of files) {
                    if (file !== '.htaccess' && file !== 'index.php') {
                        const fullPath = path.join(cacheDir, file);
                        if (fs.lstatSync(fullPath).isDirectory()) {
                            fs.rmSync(fullPath, { recursive: true, force: true });
                        } else {
                            fs.unlinkSync(fullPath);
                        }
                    }
                }
            }
            return res.json({ status: "success", message: "System cache completely purged." });
        } else if (type === 'history') {
            if (fs.existsSync(dataDir)) {
                const files = fs.readdirSync(dataDir);
                for (const file of files) {
                    if (file.startsWith('recents_') && file.endsWith('.json')) {
                        fs.unlinkSync(path.join(dataDir, file));
                    }
                }
            }
            return res.json({ status: "success", message: "Global watch history purged." });
        } else if (type === 'favorites') {
            if (fs.existsSync(dataDir)) {
                const files = fs.readdirSync(dataDir);
                for (const file of files) {
                    if (file.startsWith('favorites_') && file.endsWith('.json')) {
                        fs.unlinkSync(path.join(dataDir, file));
                    }
                }
            }
            return res.json({ status: "success", message: "All user favorites purged." });
        }

        return res.status(400).json({ status: "error", message: "Invalid cleanup type." });
    } catch (e: any) {
        return res.status(500).json({ status: "error", message: "Failed to execute cleanup." });
    }
});

// GET /system/status - Get global power status
router.get('/system/status', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        systemStatus: db.systemStatus || 'active'
    });
});


// GET /developer - Developer Mode Settings
router.get('/developer', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        developerMode: db.developerMode || false,
        allowedDeveloperIps: db.allowedDeveloperIps || []
    });
});

// POST /developer - Update Developer Mode Settings
router.post('/developer', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    const { developerMode } = req.body;
    db.developerMode = !!developerMode;
    saveDB(db);
    refreshBlacklist();
    res.json({ status: "success", message: "Developer mode updated", developerMode: db.developerMode });
});

// POST /developer/whitelist - Add IP to developer whitelist
router.post('/developer/whitelist', requireAdmin, (req: Request, res: Response) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ status: "error", message: "IP required" });

    const db = getDB();
    if (!db.allowedDeveloperIps) db.allowedDeveloperIps = [];
    if (!db.allowedDeveloperIps.includes(ip)) {
        db.allowedDeveloperIps.push(ip);
        saveDB(db);
        refreshBlacklist();
    }
    res.json({ status: "success", message: "IP added to developer whitelist", allowedDeveloperIps: db.allowedDeveloperIps });
});

// DELETE /developer/whitelist - Remove IP from developer whitelist
router.delete('/developer/whitelist', requireAdmin, (req: Request, res: Response) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ status: "error", message: "IP required" });

    const db = getDB();
    if (db.allowedDeveloperIps) {
        db.allowedDeveloperIps = db.allowedDeveloperIps.filter(i => i !== ip);
        saveDB(db);
        refreshBlacklist();
    }
    res.json({ status: "success", message: "IP removed from developer whitelist", allowedDeveloperIps: db.allowedDeveloperIps || [] });
});

// GET /maintenance - Maintenance Mode
router.get('/maintenance', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        maintenanceMode: db.maintenanceMode || false,
        consumetMaintenance: db.consumetMaintenance || false,
        playMaintenance: db.playMaintenance || false,
        playConsumetMaintenance: db.playConsumetMaintenance || false,
        activeTemplate: db.activeTemplate || 'Scheduled Downtime',
        maintenanceMusicMode: db.maintenanceMusicMode || 'query',
        maintenanceMusicQuery: db.maintenanceMusicQuery || 'lofi relax',
        maintenanceMusicPlaylist: db.maintenanceMusicPlaylist || []
    });
});

// POST /maintenance - Update Maintenance Mode
router.post('/maintenance', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    const { maintenanceMode, activeTemplate, maintenanceMusicMode, maintenanceMusicQuery, maintenanceMusicPlaylist, consumetMaintenance, playMaintenance, playConsumetMaintenance } = req.body;
    db.consumetMaintenance = !!consumetMaintenance;
    db.playMaintenance = !!playMaintenance;
    db.playConsumetMaintenance = !!playConsumetMaintenance;
    
    db.maintenanceMode = !!maintenanceMode;
    if (activeTemplate) {
        db.activeTemplate = activeTemplate;
    }
    if (maintenanceMusicMode) {
        db.maintenanceMusicMode = maintenanceMusicMode;
    }
    if (maintenanceMusicQuery !== undefined) {
        db.maintenanceMusicQuery = maintenanceMusicQuery;
    }
    if (maintenanceMusicPlaylist !== undefined) {
        db.maintenanceMusicPlaylist = maintenanceMusicPlaylist;
    }
    
    saveDB(db);
    systemState.maintenanceMode = db.maintenanceMode;
    systemState.activeTemplate = db.activeTemplate;
    systemState.maintenanceMusicMode = db.maintenanceMusicMode || 'query';
    systemState.maintenanceMusicQuery = db.maintenanceMusicQuery || 'lofi relax';
    systemState.maintenanceMusicPlaylist = db.maintenanceMusicPlaylist || [];
    systemState.consumetMaintenance = db.consumetMaintenance || false;
    systemState.playMaintenance = db.playMaintenance || false;
    systemState.playConsumetMaintenance = db.playConsumetMaintenance || false;
    
    // Clear sessions if entering maintenance
    if (db.maintenanceMode) {
        activeSessions.clear();
        const liveStalkerPath = path.join(process.cwd(), 'doctor_strange', 'live.stalker');
        if (fs.existsSync(liveStalkerPath)) fs.unlinkSync(liveStalkerPath);
        killAllActiveStreams();
    }
    
    res.json({
        status: "success",
        maintenanceMode: db.maintenanceMode,
        consumetMaintenance: db.consumetMaintenance,
        playMaintenance: db.playMaintenance,
        playConsumetMaintenance: db.playConsumetMaintenance,
        activeTemplate: db.activeTemplate,
        maintenanceMusicMode: db.maintenanceMusicMode,
        maintenanceMusicQuery: db.maintenanceMusicQuery,
        maintenanceMusicPlaylist: db.maintenanceMusicPlaylist
    });
});

// POST /system/toggle - Master Kill Switch
router.post('/system/toggle', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    const current = db.systemStatus || 'active';
    
    // Toggle logic: if active -> offline, if offline/killed -> active
    const nextStatus = (current === 'active') ? 'offline' : 'active';
    
    db.systemStatus = nextStatus;
    saveDB(db);
    
    // Update live memory state
    systemState.status = nextStatus;
     // Force update exported variable if possible
    refreshBlacklist();
    
    if (nextStatus === "offline" || (nextStatus as string) === "killed") {
        activeSessions.clear();
        console.warn(`[SYSTEM] GLOBAL POWER SWITCH TOGGLED TO: ${nextStatus.toUpperCase()} BY ADMIN - ALL SESSIONS PURGED`);
        killAllActiveStreams();
    } else {
        console.warn(`[SYSTEM] GLOBAL POWER SWITCH TOGGLED TO: ${nextStatus.toUpperCase()} BY ADMIN`);
    }
    
    res.json({
        status: "success",
        systemStatus: nextStatus,
        message: `System is now ${nextStatus.toUpperCase()}`
    });
});

// GET /sessions - List active stream sessions
router.get('/sessions', requireAdmin, (req: Request, res: Response) => {
    const sessions = Array.from(activeSessions.values());
    res.json({
        status: "success",
        sessions: sessions
    });
});

// POST /sessions/terminate - Terminate a session
router.post('/sessions/terminate', requireAdmin, (req: Request, res: Response) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ status: "error", message: "IP required" });

    activeSessions.delete(ip);
    res.json({
        status: "success",
        message: `Session for IP ${ip} terminated from monitor list.`
    });
});

// GET /blacklist - List blocked IPs
router.get('/blacklist', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        blacklist: db.blacklist || []
    });
});

// POST /blacklist - Block an IP
router.post('/blacklist', requireAdmin, (req: Request, res: Response) => {
    const { ip } = req.body;
    if (!ip) return res.status(400).json({ status: "error", message: "IP required" });

    const db = getDB();
    if (!db.blacklist) db.blacklist = [];
    if (!db.blacklist.includes(ip)) {
        db.blacklist.push(ip);
        saveDB(db);
        refreshBlacklist();
        
        // Also terminate active session if exists
        activeSessions.delete(ip);
    }

    res.json({
        status: "success",
        message: `IP ${ip} has been blacklisted and any active session dropped.`
    });
});

// DELETE /blacklist/:ip - Unblock an IP
router.delete('/blacklist/:ip', requireAdmin, (req: Request, res: Response) => {
    const { ip } = req.params;
    if (!ip) return res.status(400).json({ status: "error", message: "IP required" });

    const db = getDB();
    if (db.blacklist) {
        db.blacklist = db.blacklist.filter((b: string) => b !== ip);
        saveDB(db);
        refreshBlacklist();
    }
    res.json({
        status: "success",
        message: `IP ${ip} removed from blacklist.`
    });
});

// GET /incidents - List security violations
router.get('/incidents', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    res.json({
        status: "success",
        incidents: db.incidents || []
    });
});

/**
 * 1. Admin Login Endpoint (IP-Bound)
 */
router.post('/login', (req: Request, res: Response) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({
            status: "error",
            message: "Username and password are required."
        });
    }

    const adminUser = (process.env.ADMIN_USER || 'hari').trim();
    const adminPassHash = process.env.ADMIN_PASS_HASH || '$2a$10$vI8AWBWzef9pa5clEt.D9uGv1xeS8.A.m.u.m.u.m.u.m.u.m.u.m.';

    // Deep sanitize and normalize inputs
    const cleanUsername = String(username || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();
    const targetUser = adminUser.toLowerCase();

    let isPasswordCorrect = false;
    
    try {
        isPasswordCorrect = bcrypt.compareSync(cleanPassword, adminPassHash);
    } catch (e) {
        console.error('[AUTH-ERROR] Bcrypt check failed:', e);
    }

    const userMatches = (cleanUsername === targetUser);

    if (userMatches && isPasswordCorrect) {
        const clientIp = getClientIp(req);
        console.log(`[AUTH-SUCCESS] User "${cleanUsername}" logged in from ${clientIp}`);
        // Reset failures on success
        loginFailures.delete(clientIp);

        const token = jwt.sign(
            { ip: clientIp, role: 'admin', user: adminUser },
            JWT_SECRET,
            { expiresIn: '12h' }
        );
        
        // Also set the admin_auth cookie for index.php access
        server.setSecureCookie(req, res, 'admin_auth', token, { 
            maxAge: 12 * 60 * 60 * 1000, // 12 hours (matching JWT expiration)
            httpOnly: true // Secure httpOnly cookie
        });

        return res.json({
            status: "success",
            token,
            ip: clientIp,
            message: "Authentication successful"
        });
    } else {
        const clientIp = getClientIp(req);
        const attempts = (loginFailures.get(clientIp) || 0) + 1;
        loginFailures.set(clientIp, attempts);

        console.warn(`[SECURITY WARN] Unauthorized login attempt (${attempts}/5) to Control Panel from IP: ${clientIp} using Username: "${username}"`);

        if (attempts >= 5) {
            const db = getDB();
            if (!db.blacklist) db.blacklist = [];
            if (!db.blacklist.includes(clientIp)) {
                db.blacklist.push(clientIp);
                
                // Log Incident
                if (!db.incidents) db.incidents = [];
                db.incidents.unshift({
                    ip: clientIp,
                    username: username,
                    timestamp: Date.now(),
                    reason: "Brute Force: 5 Failed Login Attempts"
                });
                // Keep only last 50 incidents
                if (db.incidents.length > 50) db.incidents = db.incidents.slice(0, 50);

                saveDB(db);
                refreshBlacklist();
                loginFailures.delete(clientIp);
                console.error(`[FIREWALL] IP ${clientIp} PERMANENTLY BLACKLISTED due to multiple failed login attempts.`);
            }
            return res.status(403).json({
                status: "error",
                message: "SECURITY LOCK: Too many failed attempts. Your IP has been permanently blacklisted."
            });
        }

        return res.status(401).json({
            status: "error",
            message: `Access Denied: Incorrect Username or Password (${attempts}/5 attempts used)`
        });
    }
});

/**
 * 2. Heartbeat Ping Endpoint
 */
router.get('/heartbeat', requireAdmin, (req: Request, res: Response) => {
    const clientIp = getClientIp(req);
    return res.json({
        status: "success",
        ip: clientIp,
        timestamp: Date.now()
    });
});

/**
 * 3. Portal Manager Endpoints
 */
router.get('/portals', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    const portals = db.portals.map(p => {
        const portalFile = path.join(DARK_SIDE, `${p.id}.json`);
        let extra: any = {};
        if (fs.existsSync(portalFile)) {
            try {
                extra = JSON.parse(fs.readFileSync(portalFile, 'utf8'));
            } catch (e) {}
        }
        return {
            ...p,
            sn: extra.SN || "",
            device_id1: extra.D1 || "",
            device_id2: extra.D2 || "",
            signature: extra.SG || "",
            image_version: extra.image_version || "",
            token: extra.Token || "",
            user_agent: extra.user_agent || ""
        };
    });
    return res.json({ status: "success", portals });
});

router.post('/portals', requireAdmin, async (req: Request, res: Response) => {
    const { name, url, mac, model, sn, device_id1, device_id2, signature, image_version, token, user_agent, type, username, password } = req.body;
    if (!name || !url) {
        return res.status(400).json({ status: "error", message: "Missing required portal parameters." });
    }

    try {
        let cleanUrl = url.replace(/\/c\/?$/, '').trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'http://' + cleanUrl;
        }
        const host = new URL(cleanUrl).host;
        const portalId = host.replace(/[^a-zA-Z0-9.-]/g, '_') + '_' + Math.floor(Math.random() * 1000);
        const isXtream = type === 'xtream';

        if (isXtream) {
            if (!username || !password) {
                return res.status(400).json({ status: "error", message: "Username and password are required for Xtream Portal." });
            }

            try {
                console.log(`[HANDSHAKE] Testing Xtream Portal: ${cleanUrl} for User: ${username}`);
                const response = await axios.get(`${cleanUrl}/player_api.php?username=${username.trim()}&password=${password.trim()}`, { timeout: 8000 });
                const data = response.data;
                if (!data || data.user_info?.auth === 0) {
                    return res.status(400).json({ status: "error", message: "Handshake Failed: Invalid Xtream Username or Password." });
                }
            } catch (e: any) {
                return res.status(500).json({ status: "error", message: "Handshake Failed: Cannot connect to the Xtream server. " + e.message });
            }

            const db = getDB();
            const newPortal: Portal = {
                id: portalId,
                name: name.trim(),
                url: cleanUrl,
                type: 'xtream',
                username: username.trim(),
                password: password.trim(),
                isDefault: db.portals.length === 0
            };

            db.portals.push(newPortal);
            saveDB(db);

            const xtreamConfig = {
                URL: cleanUrl,
                username: username.trim(),
                password: password.trim(),
                type: 'xtream',
                Name: newPortal.name
            };

            fs.writeFileSync(path.join(DARK_SIDE, `${portalId}.json`), JSON.stringify(xtreamConfig, null, 4), 'utf8');

            if (newPortal.isDefault) {
                fs.writeFileSync(path.join(DARK_SIDE, 'login.stalker'), JSON.stringify(xtreamConfig, null, 4), 'utf8');
            }

            return res.json({ status: "success", portal: newPortal, message: "Xtream Portal registered and Handshake established!" });
        } else {
            if (!mac) {
                return res.status(400).json({ status: "error", message: "MAC address is required for Stalker Portal." });
            }

            const testSn = sn ? sn.trim() : crypto.createHash('md5').update(mac.trim()).digest('hex').substring(0, 13).toUpperCase();
            
            const testConfig = {
                URL: cleanUrl,
                MAC: mac.trim(),
                SN: testSn,
                Model: (model || 'MAG250').trim(),
                D1: (device_id1 && device_id1.trim()) ? device_id1.trim() : crypto.createHash('sha256').update(mac.trim() + "D1").digest('hex').toUpperCase(),
                D2: (device_id2 && device_id2.trim()) ? device_id2.trim() : crypto.createHash('sha256').update(mac.trim() + "D2").digest('hex').toUpperCase(),
                user_agent: user_agent ? user_agent.trim() : "",
                image_version: image_version ? image_version.trim() : "218",
                Proxy: "AUTO",
                API: "263",
                Share: "OFF",
                hw_version: "1.7-BD-" + crypto.createHash('md5').update(mac.trim()).digest('hex').substring(0, 2).toUpperCase()
            };

            try {
                console.log(`[HANDSHAKE] Testing Portal: ${testConfig.URL} with MAC: ${testConfig.MAC}, SN: ${testConfig.SN}, D1: ${testConfig.D1}, D2: ${testConfig.D2}`);
                const handshakeRes = await StalkerAPI.handshake(testConfig as any, token ? token.trim() : '');
                if (!handshakeRes || !handshakeRes.STALKER || handshakeRes.STALKER.Statuscode !== 200) {
                    return res.status(400).json({ status: "error", message: handshakeRes?.STALKER?.message || "Handshake Failed: Cannot connect to the portal." });
                }
            } catch (e: any) {
                return res.status(500).json({ status: "error", message: "Handshake Failed: " + e.message });
            }

            const db = getDB();
            
            const newPortal: Portal = {
                id: portalId,
                name: name.trim(),
                url: cleanUrl,
                mac: mac.trim(),
                model: (model || 'MAG250').trim(),
                type: 'stalker',
                isDefault: db.portals.length === 0
            };

            db.portals.push(newPortal);
            saveDB(db);

            const stalkerConfig = {
                ...testConfig,
                type: 'stalker',
                SG: signature ? signature.trim() : crypto.createHash('md5').update(mac.trim() + "SG").digest('hex').substring(0, 16).toUpperCase(),
                Token: token ? token.trim() : "",
                hw_version_2: crypto.createHash('md5').update((testSn + mac.trim()).toLowerCase()).digest('hex'),
                Name: newPortal.name
            };

            fs.writeFileSync(path.join(DARK_SIDE, `${portalId}.json`), JSON.stringify(stalkerConfig, null, 4), 'utf8');

            if (newPortal.isDefault) {
                fs.writeFileSync(path.join(DARK_SIDE, 'login.stalker'), JSON.stringify(stalkerConfig, null, 4), 'utf8');
            }

            return res.json({ status: "success", portal: newPortal, message: "Portal registered and Handshake established!" });
        }
    } catch (e: any) {
        return res.status(500).json({ status: "error", message: `Failed to register portal: ${e.message}` });
    }
});


router.put('/portals/:id', requireAdmin, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, url, mac, model, sn, device_id1, device_id2, signature, image_version, token, user_agent, type, username, password } = req.body;

    const db = getDB();
    const idx = db.portals.findIndex(p => p.id === id);
    if (idx === -1) {
        return res.status(404).json({ status: "error", message: "Portal not found" });
    }

    try {
        let cleanUrl = url.replace(/\/c\/?$/, '').trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
            cleanUrl = 'http://' + cleanUrl;
        }
        const portalFile = path.join(DARK_SIDE, `${id}.json`);
        const isXtream = type ? (type === 'xtream') : (db.portals[idx].type === 'xtream');

        if (isXtream) {
            const newUsername = username ? username.trim() : (db.portals[idx].username || '');
            const newPassword = password ? password.trim() : (db.portals[idx].password || '');

            if (!newUsername || !newPassword) {
                return res.status(400).json({ status: "error", message: "Username and password are required for Xtream Portal." });
            }

            try {
                console.log(`[HANDSHAKE] Testing Xtream Portal: ${cleanUrl} for User: ${newUsername}`);
                const response = await axios.get(`${cleanUrl}/player_api.php?username=${newUsername}&password=${newPassword}`, { timeout: 8000 });
                const data = response.data;
                if (!data || data.user_info?.auth === 0) {
                    return res.status(400).json({ status: "error", message: "Handshake Failed: Invalid Xtream Username or Password." });
                }
            } catch (e: any) {
                return res.status(500).json({ status: "error", message: "Handshake Failed: Cannot connect to the Xtream server. " + e.message });
            }

            db.portals[idx] = {
                ...db.portals[idx],
                name: name ? name.trim() : db.portals[idx].name,
                url: cleanUrl,
                type: 'xtream',
                username: newUsername,
                password: newPassword
            };
            saveDB(db);

            const xtreamConfig = {
                URL: cleanUrl,
                username: newUsername,
                password: newPassword,
                type: 'xtream',
                Name: db.portals[idx].name
            };

            fs.writeFileSync(portalFile, JSON.stringify(xtreamConfig, null, 4), 'utf8');

            if (db.portals[idx].isDefault) {
                fs.writeFileSync(path.join(DARK_SIDE, 'login.stalker'), JSON.stringify(xtreamConfig, null, 4), 'utf8');
                const tokenFile = path.join(DARK_SIDE, "token.stalker");
                const liveFile = path.join(DARK_SIDE, "live.stalker");
                const genreFile = path.join(DARK_SIDE, "genre.json");
                if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
                if (fs.existsSync(liveFile)) fs.unlinkSync(liveFile);
                if (fs.existsSync(genreFile)) fs.unlinkSync(genreFile);
                const cachedFiles = fs.readdirSync(LIGHT_SIDE);
                for (const cf of cachedFiles) {
                    try { fs.unlinkSync(path.join(LIGHT_SIDE, cf)); } catch (e) {}
                }
            }

            return res.json({ status: "success", portal: db.portals[idx], message: "Xtream Portal updated successfully!" });
        } else {
            let existingConfig: any = {};
            if (fs.existsSync(portalFile)) {
                try { existingConfig = JSON.parse(fs.readFileSync(portalFile, 'utf8')); } catch (e) {}
            }

            const newMac = mac ? mac.trim() : (db.portals[idx].mac || '');
            const newSn = (sn !== undefined) ? (sn.trim() || crypto.createHash('md5').update(newMac).digest('hex').substring(0, 13).toUpperCase()) : (existingConfig.SN || crypto.createHash('md5').update(newMac).digest('hex').substring(0, 13).toUpperCase());

            const testConfig = {
                URL: cleanUrl,
                MAC: newMac,
                SN: newSn,
                Model: model ? model.trim() : (db.portals[idx].model || 'MAG250'),
                D1: (device_id1 !== undefined) ? (device_id1.trim() || crypto.createHash('sha256').update(newMac + "D1").digest('hex').toUpperCase()) : (existingConfig.D1 || crypto.createHash('sha256').update(newMac + "D1").digest('hex').toUpperCase()),
                D2: (device_id2 !== undefined) ? (device_id2.trim() || crypto.createHash('sha256').update(newMac + "D2").digest('hex').toUpperCase()) : (existingConfig.D2 || crypto.createHash('sha256').update(newMac + "D2").digest('hex').toUpperCase()),
                user_agent: user_agent ? user_agent.trim() : (existingConfig.user_agent || ""),
                image_version: image_version ? image_version.trim() : (existingConfig.image_version || "218"),
                Proxy: "AUTO",
                API: "263",
                Share: "OFF",
                hw_version: "1.7-BD-" + crypto.createHash('md5').update(newMac).digest('hex').substring(0, 2).toUpperCase()
            };

            try {
                console.log(`[HANDSHAKE] Testing Portal: ${testConfig.URL} with MAC: ${testConfig.MAC}, SN: ${testConfig.SN}, D1: ${testConfig.D1}, D2: ${testConfig.D2}`);
                const handshakeRes = await StalkerAPI.handshake(testConfig as any, token ? token.trim() : '');
                if (!handshakeRes || !handshakeRes.STALKER || handshakeRes.STALKER.Statuscode !== 200) {
                    return res.status(400).json({ status: "error", message: handshakeRes?.STALKER?.message || "Handshake Failed: Cannot connect to the portal." });
                }
            } catch (e: any) {
                return res.status(500).json({ status: "error", message: "Handshake Failed: " + e.message });
            }

            db.portals[idx] = {
                ...db.portals[idx],
                name: name ? name.trim() : db.portals[idx].name,
                url: cleanUrl,
                mac: newMac,
                model: model ? model.trim() : (db.portals[idx].model || 'MAG250'),
                type: 'stalker'
            };
            saveDB(db);

            const updatedConfig = {
                ...existingConfig,
                type: 'stalker',
                URL: cleanUrl,
                MAC: newMac,
                Model: db.portals[idx].model,
                SN: newSn,
                Name: db.portals[idx].name,
                D1: testConfig.D1,
                D2: testConfig.D2,
                SG: (signature !== undefined) ? (signature.trim() || crypto.createHash('md5').update(newMac + "SG").digest('hex').substring(0, 16).toUpperCase()) : (existingConfig.SG || crypto.createHash('md5').update(newMac + "SG").digest('hex').substring(0, 16).toUpperCase()),
                image_version: testConfig.image_version,
                Token: token ? token.trim() : (existingConfig.Token || ""),
                user_agent: testConfig.user_agent
            };

            fs.writeFileSync(portalFile, JSON.stringify(updatedConfig, null, 4), 'utf8');

            if (db.portals[idx].isDefault) {
                fs.writeFileSync(path.join(DARK_SIDE, 'login.stalker'), JSON.stringify(updatedConfig, null, 4), 'utf8');
                const tokenFile = path.join(DARK_SIDE, "token.stalker");
                const liveFile = path.join(DARK_SIDE, "live.stalker");
                const genreFile = path.join(DARK_SIDE, "genre.json");
                if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
                if (fs.existsSync(liveFile)) fs.unlinkSync(liveFile);
                if (fs.existsSync(genreFile)) fs.unlinkSync(genreFile);
                const cachedFiles = fs.readdirSync(LIGHT_SIDE);
                for (const cf of cachedFiles) {
                    try { fs.unlinkSync(path.join(LIGHT_SIDE, cf)); } catch (e) {}
                }
            }

            return res.json({ status: "success", portal: db.portals[idx], message: "Stalker Portal updated successfully!" });
        }
    } catch (e: any) {
        return res.status(500).json({ status: "error", message: `Failed to update portal: ${e.message}` });
    }
});

router.post('/portals/:id/default', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDB();
    
    const targetIdx = db.portals.findIndex(p => p.id === id);
    if (targetIdx === -1) {
        return res.status(404).json({ status: "error", message: "Portal not found." });
    }

    // Iterate and update default states
    db.portals.forEach((p, index) => {
        p.isDefault = index === targetIdx;
    });
    saveDB(db);

    // Sync to native login.stalker and switch mode
    const portalFile = path.join(DARK_SIDE, `${id}.json`);
    if (fs.existsSync(portalFile)) {
        const content = fs.readFileSync(portalFile, 'utf8');
        fs.writeFileSync(path.join(DARK_SIDE, 'login.stalker'), content, 'utf8');
        fs.writeFileSync(path.join(DARK_SIDE, 'active_playlist_id.txt'), 'portal', 'utf8');

        // Clean cache to force reload
        const tokenFile = path.join(DARK_SIDE, "token.stalker");
        const liveFile = path.join(DARK_SIDE, "live.stalker");
        const genreFile = path.join(DARK_SIDE, "genre.json");
        if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);
        if (fs.existsSync(liveFile)) fs.unlinkSync(liveFile);
        if (fs.existsSync(genreFile)) fs.unlinkSync(genreFile);

        const cachedFiles = fs.readdirSync(LIGHT_SIDE);
        for (const cf of cachedFiles) {
            try { fs.unlinkSync(path.join(LIGHT_SIDE, cf)); } catch (e) {}
        }
    }

    return res.json({ status: "success", message: "Portal set as active default successfully!" });
});

router.delete('/portals/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDB();
    
    const idx = db.portals.findIndex(p => p.id === id);
    if (idx === -1) {
        return res.status(404).json({ status: "error", message: "Portal not found" });
    }

    const wasDefault = db.portals[idx].isDefault;
    db.portals.splice(idx, 1);
    saveDB(db);

    // Unlink the config file
    const portalFile = path.join(DARK_SIDE, `${id}.json`);
    if (fs.existsSync(portalFile)) fs.unlinkSync(portalFile);

    // If default, reset active files
    if (wasDefault) {
        const loginFile = path.join(DARK_SIDE, 'login.stalker');
        if (fs.existsSync(loginFile)) fs.unlinkSync(loginFile);
        
        const tokenFile = path.join(DARK_SIDE, "token.stalker");
        if (fs.existsSync(tokenFile)) fs.unlinkSync(tokenFile);

        // Make another portal default if available
        if (db.portals.length > 0) {
            db.portals[0].isDefault = true;
            saveDB(db);
            const nextPortalFile = path.join(DARK_SIDE, `${db.portals[0].id}.json`);
            if (fs.existsSync(nextPortalFile)) {
                fs.writeFileSync(loginFile, fs.readFileSync(nextPortalFile));
            }
        }
    }

    return res.json({ status: "success", message: "Portal deleted successfully" });
});

/**
 * Sports Administration Endpoints
 */
router.get('/sports', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    return res.json({ status: "success", sports: db.sports || [] });
});

router.post('/sports', requireAdmin, (req: Request, res: Response) => {
    const { title, icon, url } = req.body;
    if (!title || !url) {
        return res.status(400).json({ status: "error", message: "Missing required parameters: title and url are required." });
    }

    const db = getDB();
    if (!db.sports) db.sports = [];

    const newItem: SportsSection = {
        id: 'sports_' + Date.now().toString(),
        title: title.trim(),
        icon: (icon || 'trophy').trim(),
        url: url.trim(),
        addedAt: new Date().toISOString()
    };

    db.sports.push(newItem);
    saveDB(db);

    return res.json({ status: "success", message: "Sports item added successfully", item: newItem });
});

router.put('/sports/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, icon, url } = req.body;
    if (!title || !url) {
        return res.status(400).json({ status: "error", message: "Missing required parameters: title and url are required." });
    }

    const db = getDB();
    if (!db.sports) db.sports = [];

    const itemIdx = db.sports.findIndex(s => s.id === id);
    if (itemIdx === -1) {
        return res.status(404).json({ status: "error", message: "Sports item not found" });
    }

    db.sports[itemIdx] = {
        ...db.sports[itemIdx],
        title: title.trim(),
        icon: (icon || 'trophy').trim(),
        url: url.trim()
    };

    saveDB(db);

    return res.json({ status: "success", message: "Sports item updated successfully", item: db.sports[itemIdx] });
});

router.delete('/sports/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDB();
    if (!db.sports) db.sports = [];

    const itemIdx = db.sports.findIndex(s => s.id === id);
    if (itemIdx === -1) {
        return res.status(404).json({ status: "error", message: "Sports item not found" });
    }

    db.sports.splice(itemIdx, 1);
    saveDB(db);

    return res.json({ status: "success", message: "Sports item deleted successfully" });
});


router.post('/sports/extract', requireAdmin, async (req: Request, res: Response) => {
    try {
        await getOrUpdatePlaylist(true);
        return res.json({ status: "success", message: "Sports M3U extracted successfully" });
    } catch (e: any) {
        return res.status(500).json({ status: "error", message: e.message });
    }
});

router.get('/sports/check', requireAdmin, async (req: Request, res: Response) => {
    const url = req.query.url as string;
    if (!url) {
        return res.status(400).json({ status: "error", message: "Missing URL query parameter" });
    }

    try {
        const checkRes = await axios({
            method: 'get',
            url: url,
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            responseType: 'stream'
        });

        // Destroy stream immediately to prevent huge downloading
        checkRes.data.destroy();

        if (checkRes.status >= 200 && checkRes.status < 400) {
            return res.json({ status: "active", message: "Active & Responsive" });
        } else {
            return res.json({ status: "damaged", message: `Damaged (HTTP ${checkRes.status})` });
        }
    } catch (err: any) {
        return res.json({ status: "damaged", message: `Damaged (${err.message})` });
    }
});


/**
 * Live Events Administration Endpoints
 */
router.get('/live_events', requireAdmin, (req: Request, res: Response) => {
    const db = getDB();
    return res.json({ status: "success", liveEvents: db.liveEvents || [] });
});

router.post('/live_events', requireAdmin, (req: Request, res: Response) => {
    const { title, icon, url } = req.body;
    if (!title || !url) {
        return res.status(400).json({ status: "error", message: "Missing required parameters: title and url are required." });
    }
    const db = getDB();
    if (!db.liveEvents) db.liveEvents = [];
    const newItem: SportsSection = {
        id: 'event_' + Date.now().toString(),
        title: title.trim(),
        icon: (icon || 'zap').trim(),
        url: url.trim(),
        addedAt: new Date().toISOString()
    };
    db.liveEvents.push(newItem);
    saveDB(db);
    return res.json({ status: "success", message: "Live Event added successfully", item: newItem });
});

router.put('/live_events/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, icon, url } = req.body;
    if (!title || !url) {
        return res.status(400).json({ status: "error", message: "Missing required parameters: title and url are required." });
    }
    const db = getDB();
    if (!db.liveEvents) db.liveEvents = [];
    const itemIdx = db.liveEvents.findIndex((s: any) => s.id === id);
    if (itemIdx === -1) {
        return res.status(404).json({ status: "error", message: "Live Event not found" });
    }
    db.liveEvents[itemIdx] = {
        ...db.liveEvents[itemIdx],
        title: title.trim(),
        icon: (icon || 'zap').trim(),
        url: url.trim()
    };
    saveDB(db);
    return res.json({ status: "success", message: "Live Event updated successfully", item: db.liveEvents[itemIdx] });
});

router.delete('/live_events/:id', requireAdmin, (req: Request, res: Response) => {
    const { id } = req.params;
    const db = getDB();
    if (!db.liveEvents) db.liveEvents = [];
    const itemIdx = db.liveEvents.findIndex((s: any) => s.id === id);
    if (itemIdx === -1) {
        return res.status(404).json({ status: "error", message: "Live Event not found" });
    }
    db.liveEvents.splice(itemIdx, 1);
    saveDB(db);
    return res.json({ status: "success", message: "Live Event deleted successfully" });
});

export default router;
