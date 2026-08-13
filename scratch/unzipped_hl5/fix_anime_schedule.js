const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

html = html.replace(/'first_air_date\.gte': dateStr,/g, "'air_date.gte': dateStr,");
html = html.replace(/'first_air_date\.lte': dateStr,/g, "'air_date.lte': dateStr,");

fs.writeFileSync('consumet.html', html);
