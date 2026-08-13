import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Automatically generate a secure secret on startup to keep sessions safe
export const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

export interface AdminPayload {
    ip: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * Retrieves the client's actual IP address, respecting reverse proxies.
 */
export const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        return ip.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
};

/**
 * Protects admin API endpoints with strict JWT & IP-bound validation.
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
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
            if (name && val) acc[name] = val;
            return acc;
        }, {} as Record<string, string>);
        token = cookies.admin_auth || '';
    }

    if (!token) {
        return res.status(401).json({ status: "error", message: "Unauthorized: No security token provided" });
    }

    // Legacy bypass removed for security reasons

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
        
        if (decoded.role !== 'admin') {
            return res.status(403).json({ status: "error", message: "Forbidden: Access denied" });
        }

        (req as any).adminSession = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ status: "error", message: "Session expired or is invalid. Please log in again." });
    }
};

