const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /const requireAdminHtml = \(req: Request, res: Response, next: any\) => \{[\s\S]*?app\.get\('\/hari\.html', requireAdminHtml, \(req, res\) => \{/;
const replacement = `const requireAdminHtml = (req: Request, res: Response, next: any) => {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
        const [name, val] = c.trim().split('=');
        if (name && val) acc[name] = val;
        return acc;
    }, {} as Record<string, string>);
    const token = cookies.admin_auth || '';
    if (!token) {
        return serveAdminPasswordGate(res);
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.role !== 'admin') {
            return serveAdminPasswordGate(res);
        }
        next();
    } catch (err) {
        return serveAdminPasswordGate(res);
    }
};

app.get('/hari.html', requireAdminHtml, (req, res) => {`;
content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
