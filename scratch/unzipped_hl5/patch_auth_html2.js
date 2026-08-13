const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /import jwt from 'jsonwebtoken';\nconst requireAdminHtml = \(req: Request, res: Response, next: NextFunction\) => {/;
const replacement = `const requireAdminHtml = (req: Request, res: Response, next: any) => {`;
content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
