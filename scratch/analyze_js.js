const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const scriptStart = code.indexOf('<script>');
if (scriptStart !== -1) {
  const jsContent = code.substring(scriptStart + 8);
  console.log('JS content length:', jsContent.length);

  // Find all function declarations
  const funcMatches = jsContent.match(/function\s+([a-zA-Z0-9_$]+)/g);
  console.log('Declared functions count:', funcMatches ? funcMatches.length : 0);
  if (funcMatches) {
    console.log('Functions:', funcMatches.map(f => f.replace('function ', '')).join(', '));
  }

  // Find all getElementById calls
  const idMatches = jsContent.match(/getElementById\(['"]([^'"]+)['"]\)/g);
  if (idMatches) {
    const idsInJs = [...new Set(idMatches.map(m => m.match(/['"]([^'"]+)['"]/)[1]))];
    console.log('\nElement IDs referenced in JS:', idsInJs.length);
    
    // Check if these IDs exist in HTML
    const missingIds = [];
    idsInJs.forEach(id => {
      if (!code.includes(`id="${id}"`) && !code.includes(`id='${id}'`)) {
        missingIds.push(id);
      }
    });
    console.log('IDs in JS BUT MISSING in HTML:', missingIds);
  }
}
