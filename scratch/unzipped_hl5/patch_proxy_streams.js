const fs = require('fs');

let code = fs.readFileSync('src/proxy.ts', 'utf8');

if (!code.includes('killAllActiveStreams')) {
    code = code.replace(
        /export async function streamUrl/,
        `export const activeStreamingResponses = new Set<Response>();
export function killAllActiveStreams() {
    console.log(\`[PROXY] Terminating \${activeStreamingResponses.size} active streams immediately.\`);
    for (const res of activeStreamingResponses) {
        try {
            res.destroy();
        } catch(e) {}
    }
    activeStreamingResponses.clear();
}

export async function streamUrl`
    );

    code = code.replace(
        /addStreamingIp\(cleanIp\);\s*res\.on\('close', \(\) => removeStreamingIp\(cleanIp\)\);/g,
        `addStreamingIp(cleanIp);
    activeStreamingResponses.add(res);
    res.on('close', () => {
        removeStreamingIp(cleanIp);
        activeStreamingResponses.delete(res);
    });`
    );

    fs.writeFileSync('src/proxy.ts', code);
}
