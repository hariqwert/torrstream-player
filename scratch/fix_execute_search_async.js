const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Change function executeSearch to async function executeSearch
const oldExecuteSearch = 'function executeSearch() {';
const newExecuteSearch = 'async function executeSearch() {';

if (html.includes(oldExecuteSearch)) {
    html = html.replace(oldExecuteSearch, newExecuteSearch);
    console.log('SUCCESS: Changed function executeSearch to async function executeSearch!');
} else {
    console.warn('Could not find exact function executeSearch() string, attempting pattern replacement...');
    html = html.replace(/function\s+executeSearch\s*\(\s*\)/, 'async function executeSearch()');
    console.log('Pattern replacement applied for executeSearch!');
}

fs.writeFileSync(filePath, html, 'utf8');
console.log('Saved consumet.html with async function executeSearch fix!');
