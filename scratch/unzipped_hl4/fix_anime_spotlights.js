const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

// Replace indigo colors with red in Anime Spotlight
html = html.replace(/bg-indigo-500 w-6/g, 'bg-red-500 w-6');
html = html.replace(/bg-indigo-600 text-white px-2.5 py-0.5 rounded-md shadow-md animate-pulse">🔥 Otaku Spotlight/g, 'bg-red-600 text-white px-2.5 py-0.5 rounded-md shadow-md animate-pulse">🔥 Otaku Spotlight');
html = html.replace(/bg-indigo-600 hover:bg-indigo-700/g, 'bg-red-600 hover:bg-red-700');

fs.writeFileSync('consumet.html', html);
