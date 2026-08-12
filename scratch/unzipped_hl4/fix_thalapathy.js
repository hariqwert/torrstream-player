const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Remove the whole block for Thalapathy Vijay Movies
html = html.replace(/<!-- Thalapathy Vijay Movies -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

// Also remove from loadHomeNewShelves
html = html.replace(/\/\/ Thalapathy Vijay[\s\S]*?renderShelfGrid\(vijay\.results \|\| \[\], 'vijayShelf'\);/, '');

fs.writeFileSync('consumet.html', html);
