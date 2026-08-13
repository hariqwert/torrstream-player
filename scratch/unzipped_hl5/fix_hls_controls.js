const fs = require('fs');

function fix(file) {
    let code = fs.readFileSync(file, 'utf8');

    // Restore bufferStalledError handling
    const target1 = `                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                // Suppress non-fatal warning
                                return;
                            }`;
    const rep1 = `                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                console.warn('[HLS] Buffer stalled, nudging player...');
                                if (hls && hls.recoverMediaError) hls.recoverMediaError();
                                if (video.paused && !video.ended) {
                                    video.play().catch(() => {});
                                }
                                return;
                            }`;

    const target2 = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        // Suppress non-fatal warning
                    }`;
    const rep2 = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        console.warn('[HLS] Buffer stalled, nudging player...');
                        if (hls && hls.recoverMediaError) hls.recoverMediaError();
                        if (video.paused && !video.ended) {
                            video.play().catch(() => {});
                        }
                    }`;

    code = code.replace(target1, rep1).replace(target2, rep2);
    fs.writeFileSync(file, code);
}

fix('play.php');
fix('play_consumet.php');
