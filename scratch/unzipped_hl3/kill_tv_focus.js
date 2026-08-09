const fs = require('fs');

function fixFocus(file) {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');
    
    const css = `
    *:focus, *:focus-visible { 
        outline: none !important; 
        box-shadow: none !important; 
        -webkit-tap-highlight-color: transparent !important;
    }
    ::-moz-focus-inner {
        border: 0;
    }`;
    
    // Replace the old fix with the more aggressive one
    content = content.replace('*:focus { outline: none !important; box-shadow: none !important; }', css);
    
    fs.writeFileSync(file, content);
}

['index.php', 'consumet.html', 'play.php', 'play_consumet.php', 'music.html', 'books.html', 'public/hari.html'].forEach(fixFocus);
