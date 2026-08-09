const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/enableStashBuffer: false/g, 'enableStashBuffer: true');
    code = code.replace(/stashInitialSize: 128/g, 'stashInitialSize: 384');
    code = code.replace(/liveBufferLatencyChasing: true/g, 'liveBufferLatencyChasing: false');
    
    // In play.php:
    code = code.replace(/enableStashBuffer: false/g, 'enableStashBuffer: true');
    code = code.replace(/stashInitialSize: 128/g, 'stashInitialSize: 384');
    code = code.replace(/liveBufferLatencyChasing: true/g, 'liveBufferLatencyChasing: false');

    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
