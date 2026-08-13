const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /if \(i % 50 === 0\) await new Promise\(r => setTimeout\(r, 0\)\);\n                    \}                      \} else \{[\s\S]*?if \(matchedEpgIds\.includes\(p\.channel\)\) \{\n                                    window\.epgProgrammesByChannel\[chId\]\.push\(\{\.\.\.p, channel: chId\}\);\n                                \}\n                            \}\n                        \}\n                    \}/;

html = html.replace(regex, `if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
                    }`);
fs.writeFileSync('consumet.html', html);
