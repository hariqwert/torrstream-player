const fs = require('fs');
let code = fs.readFileSync('src/routes/customM3uProxy.ts', 'utf8');

code = code.replace(/import \{ URL \} from 'url';/, "import { URL } from 'url';\nimport { addStreamingIp, removeStreamingIp, shouldSendUserIp } from '../../server';");

code = code.replace(
    /        'Connection': 'keep-alive',\n        'X-Forwarded-For': cleanIp,\n        'X-Real-IP': cleanIp/g,
    `        'Connection': 'keep-alive'
    };
    if (shouldSendUserIp(cleanIp)) {
        headers['X-Forwarded-For'] = cleanIp;
        headers['X-Real-IP'] = cleanIp;
    }`
);

code = code.replace(
    /    headersStr \+= \`X-Forwarded-For: \$\{cleanIp\}\\r\\n\`;\n    headersStr \+= \`X-Real-IP: \$\{cleanIp\}\\r\\n\`;/g,
    `    if (shouldSendUserIp(cleanIp)) {
        headersStr += \`X-Forwarded-For: \${cleanIp}\\r\\n\`;
        headersStr += \`X-Real-IP: \${cleanIp}\\r\\n\`;
    }`
);

code = code.replace(/    streamWithRedirects\(urlStr, headers, res, req, 0\);/g, `    addStreamingIp(cleanIp);
    res.on('close', () => removeStreamingIp(cleanIp));
    streamWithRedirects(urlStr, headers, res, req, 0);`);

code = code.replace(/    const ffmpegProcess: ChildProcess = spawn\('ffmpeg', args\);/g, `    addStreamingIp(cleanIp);
    const onDisconnectProxy = () => removeStreamingIp(cleanIp);
    res.on('close', onDisconnectProxy);
    const ffmpegProcess: ChildProcess = spawn('ffmpeg', args);`);

fs.writeFileSync('src/routes/customM3uProxy.ts', code);
