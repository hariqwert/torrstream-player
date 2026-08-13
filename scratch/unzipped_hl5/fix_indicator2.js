const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const target2 = "if (body) body.scrollLeft = el.scrollLeft;";
const repl2 = `if (body) body.scrollLeft = el.scrollLeft;
            
            const timeIndicator = document.getElementById('epgCurrentTimeIndicator');
            if (timeIndicator) {
                timeIndicator.style.transform = \`translateX(-\${el.scrollLeft}px)\`;
            }`;
html = html.replace(target2, repl2);
fs.writeFileSync('consumet.html', html, 'utf8');
