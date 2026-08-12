const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const replacement = `
                if (data.revenue > 0) extraHtml.push(\`<span>Revenue: <span class="text-white">$\${(data.revenue/1000000).toFixed(1)}M</span></span>\`);
                
                if (type === 'tv' && data.last_episode_to_air) {
                    const le = data.last_episode_to_air;
                    extraHtml.push(\`<span class="text-amber-400 font-bold ml-2 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Latest: S\${le.season_number} E\${le.episode_number} <span class="text-white/60 text-[9px]">(\${le.air_date})</span></span>\`);
                }
                
                if (data.production_companies && data.production_companies.length > 0) {
`;

html = html.replace(/if \(data\.revenue > 0\) extraHtml\.push\(\`<span>Revenue: <span class="text-white">\$\$\{\(data\.revenue\/1000000\)\.toFixed\(1\)\}M<\/span><\/span>\`\);\s*if \(data\.production_companies && data\.production_companies\.length > 0\) \{/, replacement);

fs.writeFileSync('consumet.html', html);
