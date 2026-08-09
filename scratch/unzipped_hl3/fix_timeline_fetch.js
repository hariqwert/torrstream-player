const fs = require('fs');

let code = fs.readFileSync('consumet.html', 'utf8');

code = code.replace(
    /for \(let i = 0; i < tl\.items\.length; i\+\+\) \{\s*const item = tl\.items\[i\];\s*fetchTMDB\(`\$\{item\.tmdbType\}\/\$\{item\.id\}`\)\.then\(data => \{/g,
    `for (let i = 0; i < tl.items.length; i++) {
            const item = tl.items[i];
            setTimeout(() => {
                fetchTMDB(\`\${item.tmdbType}/\${item.id}\`).then(data => {`
);

code = code.replace(
    /if \(img\) img\.src = `https:\/\/image\.tmdb\.org\/t\/p\/w400\$\{data\.poster_path\}`;\s*\}\s*\}\)\.catch\(e => \{\}\);\s*\}/g,
    `if (img) img.src = \`https://image.tmdb.org/t/p/w400\${data.poster_path}\`;
                }
            }).catch(e => {});
            }, i * 200 + Math.random() * 100);
        }`
);

fs.writeFileSync('consumet.html', code);
