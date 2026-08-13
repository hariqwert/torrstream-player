const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const regex = /if \(response\.headers\['content-length'\]\) res\.setHeader\('Content-Length', response\.headers\['content-length'\] as string\);/;
const replacement = `if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length'] as string);
        if (req.query.download === '1') {
            const title = req.query.title ? req.query.title as string : 'audio';
            res.setHeader('Content-Disposition', \`attachment; filename="\${encodeURIComponent(title)}.mp3"\`);
        }`;
content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content);
