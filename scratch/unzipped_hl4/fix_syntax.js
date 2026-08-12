const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const targetStr = `    if (window.lucide) {
        lucide.createIcons();
    }
    
    }
    
    // Lazy load images using IntersectionObserver`;
    
const replaceStr = `    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Lazy load images using IntersectionObserver`;

html = html.replace(targetStr, replaceStr);
fs.writeFileSync('consumet.html', html);
console.log('Fixed');
