const fs = require('fs');
let code = fs.readFileSync('play.php', 'utf8');

const target = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        // Log stall but don't nudge aggressively, let hls.js handle it
                        if (!video.paused && video.readyState < 3) {
                            console.warn('Playback stalled. Waiting for buffer...');
                        }
                    }`;

const replacement = `                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        console.warn('[HLS] Buffer stalled, attempting to nudge player...');
                        if (hls && hls.recoverMediaError) {
                            hls.recoverMediaError();
                        }
                        if (video.paused && !video.ended) {
                            video.play().catch(() => {});
                        }
                    }`;

if (code.includes('Log stall but don\'t nudge aggressively')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('play.php', code);
}
