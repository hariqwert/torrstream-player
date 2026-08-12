const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

if (html.includes('async async function openDetails')) {
    html = html.replace('async async function openDetails', 'async function openDetails');
    console.log('SUCCESS: Fixed async async function openDetails!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with clean async function openDetails!');
