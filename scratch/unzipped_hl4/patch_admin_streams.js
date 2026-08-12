const fs = require('fs');

let code = fs.readFileSync('src/routes/admin.ts', 'utf8');

if (!code.includes('killAllActiveStreams')) {
    code = code.replace(
        /import \* as server from '\.\.\/\.\.\/server';/,
        `import * as server from '../../server';\nimport { killAllActiveStreams } from '../proxy';`
    );

    code = code.replace(
        /console\.warn\(\`\[SYSTEM\] GLOBAL POWER SWITCH TOGGLED TO: \$\{nextStatus\.toUpperCase\(\)\} BY ADMIN - ALL SESSIONS PURGED\`\);/g,
        `console.warn(\`[SYSTEM] GLOBAL POWER SWITCH TOGGLED TO: \${nextStatus.toUpperCase()} BY ADMIN - ALL SESSIONS PURGED\`);\n        killAllActiveStreams();`
    );

    code = code.replace(
        /if \(fs\.existsSync\(liveStalkerPath\)\) fs\.unlinkSync\(liveStalkerPath\);\s*\}/g,
        `if (fs.existsSync(liveStalkerPath)) fs.unlinkSync(liveStalkerPath);\n        killAllActiveStreams();\n    }`
    );

    fs.writeFileSync('src/routes/admin.ts', code);
}
