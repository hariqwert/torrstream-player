const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Patch 1: Suppress Python 3.10 warning flag
content = content.replace(/const ytArgs = \['-J', '--no-playlist', '--no-warnings', '--js-runtimes', 'node'\];/g, 
"const ytArgs = ['-J', '--no-playlist', '--no-warnings', '--compat-options', 'no-python-warning', '--js-runtimes', 'node'];");

content = content.replace(/const ytdlpArgs: string\[\] = \['--no-warnings', '--js-runtimes', 'node'\];/g,
"const ytdlpArgs: string[] = ['--no-warnings', '--compat-options', 'no-python-warning', '--js-runtimes', 'node'];");

// Patch 2: Make the console.error friendlier
const regex = /console\.error\(\`\[YouTubeDownload\] yt-dlp error code=\$\{code\}:\`, errData\);/g;
const replacement = `const isBotBlock = errData.includes('Sign in to confirm') || errData.includes('bot');
                if (isBotBlock) {
                    console.warn(\`[YouTubeDownload] Notice: YouTube requested bot verification for \${rawVideoId}. Activating UI direct-download fallback.\`);
                } else {
                    // Filter python deprecation warning
                    const cleanErr = errData.replace(/Deprecated Feature: Support for Python version 3.10 has been deprecated.*\\n/, '');
                    console.error(\`[YouTubeDownload] yt-dlp error code=\${code}:\`, cleanErr);
                }`;
content = content.replace(regex, replacement);

// Clean up another isBotBlock later
content = content.replace(/const isBotBlock = errData.includes\('Sign in to confirm'\) \|\| errData.includes\('bot'\);/g, "/* isBotBlock already calculated */");

fs.writeFileSync('server.ts', content);
