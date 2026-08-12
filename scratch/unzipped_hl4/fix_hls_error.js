const fs = require('fs');
let code = fs.readFileSync('play_consumet.php', 'utf8');

const target = `                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR && data.details === 'bufferSeekOverHole') {
                            if (data.buffer) {
                                video.currentTime = data.buffer.nextStart;
                            }
                            return;
                        }`;

const replacement = `                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            if (data.details === 'bufferSeekOverHole' || data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
                                if (data.buffer) {
                                    video.currentTime = data.buffer.nextStart;
                                }
                                return;
                            }
                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                console.warn('[HLS] Buffer stalled, attempting to nudge player...');
                                hls.recoverMediaError();
                                if (video.paused && !video.ended) {
                                    video.play().catch(() => {});
                                }
                                return;
                            }
                        }`;

if (code.includes('bufferSeekOverHole') && !code.includes('bufferStalledError')) {
    code = code.replace(target, replacement);
    fs.writeFileSync('play_consumet.php', code);
}
