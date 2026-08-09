const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const target = "if (header) header.scrollLeft = el.scrollLeft;";
const repl = `if (header) header.scrollLeft = el.scrollLeft;
            
            const timeIndicator = document.getElementById('epgCurrentTimeIndicator');
            if (timeIndicator) {
                timeIndicator.style.transform = \`translateX(-\${el.scrollLeft}px)\`;
            }`;
html = html.replace(target, repl);
fs.writeFileSync('consumet.html', html, 'utf8');
