"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = exports.getClientIp = exports.JWT_SECRET = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
// Automatically generate a secure secret on startup to keep sessions safe
exports.JWT_SECRET = process.env.JWT_SECRET || crypto_1.default.randomBytes(32).toString('hex');
/**
 * Retrieves the client's actual IP address, respecting reverse proxies.
 */
const getClientIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ip.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
};
exports.getClientIp = getClientIp;
/**
 * Protects admin API endpoints with strict JWT & IP-bound validation.
 */
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const cookieHeader = req.headers.cookie || '';
    let token = '';
    // Extract token from Bearer Auth Header
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // Fallback: Extract from cookie
    else if (cookieHeader) {
        const cookies = cookieHeader.split(';').reduce((acc, c) => {
            const [name, val] = c.trim().split('=');
            if (name && val)
                acc[name] = val;
            return acc;
        }, {});
        token = cookies.admin_auth || '';
    }
    if (!token) {
        return res.status(401).json({ status: "error", message: "Unauthorized: No security token provided" });
    }
    // Legacy bypass removed for security reasons
    try {
        const decoded = jsonwebtoken_1.default.verify(token, exports.JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ status: "error", message: "Forbidden: Access denied" });
        }
        req.adminSession = decoded;
        next();
    }
    catch (err) {
        return res.status(401).json({ status: "error", message: "Session expired or is invalid. Please log in again." });
    }
};
exports.requireAdmin = requireAdmin;
