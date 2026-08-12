const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    // HLS changes
    code = code.replace(/maxBufferLength: 60,/g, 'maxBufferLength: 30,');
    code = code.replace(/maxMaxBufferLength: 180,/g, 'maxMaxBufferLength: 60,');
    code = code.replace(/maxMaxBufferLength: 300,/g, 'maxMaxBufferLength: 60,');
    code = code.replace(/backBufferLength: 60,/g, 'backBufferLength: 30,');

    // MPEG-TS changes
    code = code.replace(/enableStashBuffer: true/g, 'enableStashBuffer: false');
    code = code.replace(/stashInitialSize: 384/g, 'stashInitialSize: 128');
    code = code.replace(/liveBufferLatencyChasing: false/g, 'liveBufferLatencyChasing: true');

    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
