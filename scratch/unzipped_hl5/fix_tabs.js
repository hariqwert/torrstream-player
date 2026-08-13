const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

html = html.replace(/bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600\/15/g, 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-500/20');
fs.writeFileSync('consumet.html', html);
