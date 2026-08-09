const fs = require('fs');
let code = fs.readFileSync('play_torrent.php', 'utf8');

const regex = /const finalIsTs = [^]*?initPlayer\(\);/m;
const match = code.match(regex);
if (match) {
    console.log("Matched finalIsTs");
}

code = code.replace(/const isTs = !isDirectMedia && !isM3U8 && \([\s\S]*?true \/\/ If it's not direct media and not HLS, assume TS\n                \);/, 
`const isTs = lowerSrc.includes('.ts');`);

code = code.replace(/const finalIsTs = isTs \|\| resolvedSrc\.includes\('\/api\/stream-proxy'\) \|\| lowerSrc\.includes\('\/play\/'\);[\s\S]*?initPlayer\(\);/, 
`const finalIsTs = isTs || lowerSrc.includes('custom_ts=1');

                if (finalIsTs && typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                    loadMpegTs(resolvedSrc);
                } else if (isM3U8 && Hls.isSupported()) {
                    loadHls(resolvedSrc);
                } else {
                    video.src = resolvedSrc;
                    video.load();
                    video.play().catch(() => {});
                    
                    if (!player) {
                        player = new Plyr(video, {
                            controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                            autoplay: true,
                            muted: false,
                            clickToPlay: true
                        });
                        window.plyrPlayer = player;
                    }
                    video.style.opacity = '1';
                    loading.style.display = 'none';
                    initTopControls(player);
                    initAdvancedGestures(player, video);
                    startWatchdog();
                }
            }

            initPlayer();`);

fs.writeFileSync('play_torrent.php', code);
console.log("Fixed play_torrent.php");
