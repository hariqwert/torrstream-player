const fs = require('fs');

function revert(file) {
    let code = fs.readFileSync(file, 'utf8');

    const target1 = `                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                console.warn('[HLS] Buffer stalled, attempting to nudge player...');
                                hls.recoverMediaError();
                                if (video.paused && !video.ended) {
                                    video.play().catch(() => {});
                                }
                                return;
                            }`;
    const rep1 = `                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                // Suppress non-fatal warning
                                return;
                            }`;

    const target2 = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        console.warn('[HLS] Buffer stalled, attempting to nudge player...');
                        if (hls && hls.recoverMediaError) {
                            hls.recoverMediaError();
                        }
                        if (video.paused && !video.ended) {
                            video.play().catch(() => {});
                        }
                    }`;
    const rep2 = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        // Suppress non-fatal warning
                    }`;

    code = code.replace(target1, rep1).replace(target2, rep2);
    fs.writeFileSync(file, code);
}

revert('play.php');
revert('play_consumet.php');
