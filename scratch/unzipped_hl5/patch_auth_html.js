const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const replacement = `
import jwt from 'jsonwebtoken';
const requireAdminHtml = (req: Request, res: Response, next: NextFunction) => {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
        const [name, val] = c.trim().split('=');
        if (name && val) acc[name] = val;
        return acc;
    }, {} as Record<string, string>);
    const token = cookies.admin_auth || '';
    if (!token) {
        return res.redirect('/login.php?admin=1');
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'admin') {
            return res.redirect('/login.php?admin=1');
        }
        next();
    } catch (err) {
        return res.redirect('/login.php?admin=1');
    }
};

app.get('/hari.html', requireAdminHtml, (req, res) => {`;

content = content.replace("app.get('/hari.html', requireAdmin, (req, res) => {", replacement);
fs.writeFileSync('server.ts', content);
