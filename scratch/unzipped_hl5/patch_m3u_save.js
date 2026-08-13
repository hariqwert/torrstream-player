const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(
`        const password = (params.password || '').toString().trim();
        if (!verifyAdminPassword(password)) {
            return res.json({ status: "error", message: "Unauthorized: Invalid Security Password." });
        }`,
`        let token = '';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else {
            const cookies = parseCookies(req.headers.cookie || '');
            token = cookies.admin_auth;
        }
        
        let isAdmin = false;
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET) as any;
                if (decoded && decoded.role === 'admin') {
                    isAdmin = true;
                }
            } catch (err) {}
        }
        
        if (!isAdmin) {
            return res.json({ status: "error", message: "Unauthorized: Invalid Security Password." });
        }`
);
fs.writeFileSync('server.ts', code);
