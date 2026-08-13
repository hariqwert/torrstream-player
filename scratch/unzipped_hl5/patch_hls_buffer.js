const fs = require('fs');

function fixHlsBuffer(file) {
    let code = fs.readFileSync(file, 'utf8');

    code = code.replace(/maxBufferLength: 60,/g, 'maxBufferLength: 30,');
    code = code.replace(/maxMaxBufferLength: 300,/g, 'maxMaxBufferLength: 60,');
    code = code.replace(/backBufferLength: 120,/g, 'backBufferLength: 30,');
    
    // Nudge max retry shouldn't be 10, that causes heavy loops.
    code = code.replace(/nudgeMaxRetry: 10,/g, 'nudgeMaxRetry: 3,');
    
    // Reduce timeouts so it can fail and retry on a new connection faster
    code = code.replace(/fragLoadingTimeOut: 45000,/g, 'fragLoadingTimeOut: 20000,');
    code = code.replace(/levelLoadingTimeOut: 30000,/g, 'levelLoadingTimeOut: 15000,');
    code = code.replace(/manifestLoadingTimeOut: 30000,/g, 'manifestLoadingTimeOut: 15000,');

    fs.writeFileSync(file, code);
}
fixHlsBuffer('play.php');
fixHlsBuffer('play_consumet.php');
