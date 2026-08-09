<?php
$stream_url = isset($_GET['url']) ? $_GET['url'] : (isset($_GET['id']) ? $_GET['id'] : '');
$name = isset($_GET['name']) ? $_GET['name'] : 'Live Stream';
$source = isset($_GET['source']) ? $_GET['source'] : 'consumet.html';
?>
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <title><?php echo htmlspecialchars($name); ?> | Stalker Pro Pure HLS Player</title>
    <link rel="icon" type="image/png" href="https://freepngimg.com/thumb/gift/71372-tv-logo-television-old-android-free-download-image.png">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest" crossorigin></script>
    
    <!-- Plyr, Hls.js & mpegts.js Libraries -->
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
    <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
    <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js" crossorigin></script>

    <style>
        * { -webkit-tap-highlight-color: transparent !important; }
        body, html {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #000;
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #fff;
        }

        #player-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
        }

        .plyr {
            width: 100% !important;
            height: 100% !important;
            max-height: 100vh !important;
            --plyr-color-main: #ef4444;
        }

        .plyr__video-wrapper {
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        video {
            width: 100% !important;
            height: 100% !important;
            object-fit: contain;
            transition: transform 0.3s ease, object-fit 0.3s ease;
        }

        video.fit-cover {
            object-fit: cover !important;
        }

        video.fit-fill {
            object-fit: fill !important;
        }

        video.zoom-120 {
            transform: scale(1.2) !important;
        }

        /* Loading Overlay */
        #loading {
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .loading-text {
            font-size: 1.75rem;
            font-weight: 800;
            letter-spacing: 0.15em;
            display: flex;
            gap: 4px;
        }

        .loading-text span {
            animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        /* Gestures Indicators */
        #zoom-indicator {
            position: absolute;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 0.5rem 1.25rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 700;
            border: 1px solid rgba(255, 255, 255, 0.15);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 10000;
            backdrop-filter: blur(8px);
        }

        #gesture-ripple {
            position: absolute;
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.3);
            pointer-events: none;
            transform: scale(0);
            opacity: 0;
            transition: transform 0.4s ease-out, opacity 0.4s ease-out;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 900;
            font-size: 1.25rem;
            color: #fff;
        }

        /* Sleep Timer Indicator */
        #sleep-indicator {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: rgba(0, 0, 0, 0.75);
            border: 1px solid rgba(239, 68, 68, 0.4);
            padding: 0.35rem 0.85rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 800;
            color: #ef4444;
            display: none;
            align-items: center;
            gap: 0.4rem;
            z-index: 9999;
            backdrop-filter: blur(8px);
        }
    
        /* Disable TV spatial navigation borders */
    *:focus, *:focus-visible, *:-webkit-direct-focus, *:focus-within { 
        outline: none !important; 
        outline-width: 0 !important;
        box-shadow: none !important; 
        -webkit-tap-highlight-color: transparent !important;
    }
    ::-moz-focus-inner {
        border: 0;
    }
    .tv-focus-disabled {
        outline: none !important;
    }
</style>
    <style>
        .plyr { touch-action: pan-y pinch-zoom !important; }
    </style>
</head>
<body>

    <!-- Loading Screen -->
    <div id="loading">
        <div class="loading-text mb-4">
            <span class="text-red-500">P</span>
            <span class="text-red-500">U</span>
            <span class="text-red-500">R</span>
            <span class="text-red-500">E</span>
            <span class="text-white ml-2">H</span>
            <span class="text-white">L</span>
            <span class="text-white">S</span>
        </div>
        <p class="text-xs text-zinc-400 font-medium uppercase tracking-widest mb-6">Initializing High-Speed Stream...</p>
        <div id="loading-fallback" class="hidden">
             <button onclick="location.reload()" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2 backdrop-blur-sm cursor-pointer">
                 <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                 <span>Stream slow? <strong class="ml-1">Force Reload</strong></span>
             </button>
        </div>
    </div>

    <!-- Floating Indicators -->
    <div id="zoom-indicator">Fit to Screen</div>
    <div id="gesture-ripple"></div>
    <div id="sleep-indicator">
        <i data-lucide="clock" class="w-3.5 h-3.5 animate-pulse"></i>
        <span id="sleep-time">00:00</span>
    </div>

    <!-- Main Player Canvas -->
    <div id="player-container">
        <video id="player" autoplay playsinline crossorigin="anonymous"></video>
    </div>

    <!-- Sleep Timer Modal -->
    <div id="sleepModal" class="hidden fixed inset-0 z-[10001] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl text-center">
            <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500">
                <i data-lucide="clock" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Set Sleep Timer</h3>
            <p class="text-xs text-zinc-400 mb-6">Playback will pause automatically when timer expires.</p>
            <div class="grid grid-cols-2 gap-3 mb-6">
                <button onclick="setSleepTimer(15)" class="py-2.5 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700">15 Minutes</button>
                <button onclick="setSleepTimer(30)" class="py-2.5 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700">30 Minutes</button>
                <button onclick="setSleepTimer(45)" class="py-2.5 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700">45 Minutes</button>
                <button onclick="setSleepTimer(60)" class="py-2.5 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700">60 Minutes</button>
            </div>
            <div class="flex gap-3">
                <button onclick="setSleepTimer(0)" class="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs rounded-xl transition-all">Turn Off</button>
                <button onclick="closeSleepModal()" class="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all">Cancel</button>
            </div>
        </div>
    </div>

    <!-- Multi-Audio Modal -->
    <div id="audioModal" class="hidden fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="volume-2" class="w-5 h-5 text-red-500"></i> Audio Tracks
                </h3>
                <button onclick="closeAudioModal()" class="text-zinc-400 hover:text-white p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="audio-tracks-list" class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <p class="text-xs text-zinc-500 text-center py-4">No secondary audio tracks detected</p>
            </div>
        </div>
    </div>

    <!-- Subtitles Modal -->
    <div id="subtitleModal" class="hidden fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="subtitles" class="w-5 h-5 text-red-500"></i> Subtitles & Captions
                </h3>
                <button onclick="closeSubtitleModal()" class="text-zinc-400 hover:text-white p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="subtitle-tracks-list" class="space-y-2 max-h-48 overflow-y-auto mb-4 pr-1">
                <p class="text-xs text-zinc-500 text-center py-2">No embedded captions found</p>
            </div>
            <div class="border-t border-zinc-800 pt-4">
                <label class="block text-xs font-semibold text-zinc-400 mb-2">Upload Custom Subtitles (.srt, .vtt)</label>
                <input type="file" id="sub-file-input" accept=".srt,.vtt" class="block w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"/>
            </div>
        </div>
    </div>

    <!-- 4K & 8K Resolution Quality Selector Modal -->
    <div id="qualityModal" class="hidden fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-5 h-5 text-red-500"></i> Stream Quality (4K/8K)
                </h3>
                <button onclick="closeQualityModal()" class="text-zinc-400 hover:text-white p-1">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="quality-tracks-list" class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <p class="text-xs text-zinc-500 text-center py-4">Detecting video resolution levels...</p>
            </div>
        </div>
    </div>

    <!-- Error Overlay -->
    <div id="player-error" class="hidden fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
        <div class="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                <i data-lucide="alert-triangle" class="w-8 h-8 animate-pulse"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Stream Playback Failed</h3>
            <p id="error-message-text" class="text-zinc-400 text-sm mb-6 leading-relaxed">Unable to establish connection with stream provider. The link may be offline or blocked.</p>
            <div class="flex gap-4">
                <button onclick="location.reload()" class="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium text-sm rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center gap-2 cursor-pointer">
                    <i data-lucide="rotate-ccw" class="w-4 h-4"></i> Retry Stream
                </button>
                <button onclick="window.history.back()" class="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-sm rounded-xl transition-all border border-zinc-700 flex items-center gap-2 cursor-pointer">
                    <i data-lucide="arrow-left" class="w-4 h-4"></i> Go Back
                </button>
            </div>
        </div>
    </div>

    <script>
        window.currentRotation = 0;
        window.originalContainerStyles = null;
        window.toggleRotation = function() {
            if (screen.orientation && screen.orientation.lock) {
                const currentType = screen.orientation.type;
                if (currentType.startsWith('portrait')) {
                    screen.orientation.lock('landscape').catch(e => {
                        console.warn("Screen orientation lock failed:", e);
                        fallbackRotation();
                    });
                } else {
                    screen.orientation.lock('portrait').catch(e => {
                        console.warn("Screen orientation lock failed:", e);
                        fallbackRotation();
                    });
                }
            } else {
                fallbackRotation();
            }

            function fallbackRotation() {
                const playerContainer = document.getElementById('player-container');
                if (!playerContainer) return;
                if (!window.originalContainerStyles) {
                    window.originalContainerStyles = {
                        position: playerContainer.style.position || window.getComputedStyle(playerContainer).position,
                        width: playerContainer.style.width || window.getComputedStyle(playerContainer).width,
                        height: playerContainer.style.height || window.getComputedStyle(playerContainer).height,
                        top: playerContainer.style.top || window.getComputedStyle(playerContainer).top,
                        left: playerContainer.style.left || window.getComputedStyle(playerContainer).left,
                        zIndex: playerContainer.style.zIndex || window.getComputedStyle(playerContainer).zIndex
                    };
                }
                window.currentRotation = (window.currentRotation + 90) % 360;
                
                if (window.currentRotation === 90 || window.currentRotation === 270) {
                    playerContainer.style.width = window.innerHeight + 'px';
                    playerContainer.style.height = window.innerWidth + 'px';
                    playerContainer.style.position = 'fixed';
                    playerContainer.style.top = '50%';
                    playerContainer.style.left = '50%';
                    playerContainer.style.transform = `translate(-50%, -50%) rotate(${window.currentRotation}deg)`;
                    playerContainer.style.zIndex = '9999';
                } else {
                    playerContainer.style.width = window.originalContainerStyles.width;
                    playerContainer.style.height = window.originalContainerStyles.height;
                    playerContainer.style.position = window.originalContainerStyles.position;
                    playerContainer.style.top = window.originalContainerStyles.top;
                    playerContainer.style.left = window.originalContainerStyles.left;
                    playerContainer.style.transform = `rotate(${window.currentRotation}deg)`;
                    playerContainer.style.zIndex = window.originalContainerStyles.zIndex;
                }
                const indicator = document.getElementById('zoom-indicator') || document.getElementById('indicator');
                if (indicator) {
                    indicator.textContent = 'Rotated ' + window.currentRotation + '°';
                    indicator.style.opacity = '1';
                    setTimeout(() => indicator.style.opacity = '0', 1500);
                }
            }
        };
        
        document.addEventListener("DOMContentLoaded", () => {
            document.addEventListener("fullscreenchange", () => {
                if (document.fullscreenElement) {
                    if (screen.orientation && screen.orientation.lock) {
                        screen.orientation.lock("landscape").catch(() => {});
                    }
                } else {
                    if (screen.orientation && screen.orientation.unlock) {
                        screen.orientation.unlock();
                    }
                }
            });
            if (typeof lucide !== 'undefined') lucide.createIcons();

            const src = "<?php echo htmlspecialchars($stream_url); ?>";
            const name = "<?php echo htmlspecialchars($name); ?>";
            const source = "<?php echo htmlspecialchars($source); ?>";
            
            const video = document.getElementById('player');
            const loading = document.getElementById('loading');
            const zoomIndicator = document.getElementById('zoom-indicator');
            const sleepModal = document.getElementById('sleepModal');
            const sleepIndicator = document.getElementById('sleep-indicator');
            const sleepTimeLabel = document.getElementById('sleep-time');

            let hls = null;
            let mpegPlayer = null;
            let player = null;
            let isReconnecting = false;
            let watchdogTimer = null;
            let lastCurrentTime = -1;
            let lastProgressTime = Date.now();
            let sleepTimerInterval = null;
            let sleepTargetTime = null;

            // Aspect ratio state: 0=fit(contain), 1=fill(cover), 2=stretch(fill), 3=zoom-120
            let aspectState = 0;
            const aspectModes = ['Default (Fit)', 'Fill Screen', 'Stretch 16:9', 'Zoom 120%'];

            function showIndicator(text) {
                if (!zoomIndicator) return;
                zoomIndicator.textContent = text;
                zoomIndicator.style.opacity = '1';
                setTimeout(() => { zoomIndicator.style.opacity = '0'; }, 2000);
            }

            function toggleAspectRatio() {
                aspectState = (aspectState + 1) % aspectModes.length;
                video.classList.remove('fit-cover', 'fit-fill', 'zoom-120');
                
                if (aspectState === 1) video.classList.add('fit-cover');
                else if (aspectState === 2) video.classList.add('fit-fill');
                else if (aspectState === 3) video.classList.add('zoom-120');

                showIndicator(`Aspect Mode: ${aspectModes[aspectState]}`);
            }

            // Audio & Subtitle Modals
            window.toggleAudioModal = function() {
                const modal = document.getElementById('audioModal');
                const list = document.getElementById('audio-tracks-list');
                list.innerHTML = '';
                if (window.hls && window.hls.audioTracks && window.hls.audioTracks.length > 0) {
                    window.hls.audioTracks.forEach((track, idx) => {
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.audioTrack === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<span>${track.name || track.lang || 'Audio Track ' + (idx + 1)}</span> ${window.hls.audioTrack === idx ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => {
                            window.hls.audioTrack = idx;
                            showIndicator('Audio Track: ' + (track.name || track.lang || 'Track ' + (idx + 1)));
                            closeAudioModal();
                        };
                        list.appendChild(btn);
                    });
                } else {
                    list.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Standard Default Audio Active</p>';
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
                modal.classList.remove('hidden');
            };

            window.closeAudioModal = function() {
                document.getElementById('audioModal').classList.add('hidden');
            };

            window.toggleSubtitleModal = function() {
                const modal = document.getElementById('subtitleModal');
                const list = document.getElementById('subtitle-tracks-list');
                list.innerHTML = '';

                if (window.hls && window.hls.subtitleTracks && window.hls.subtitleTracks.length > 0) {
                    const offBtn = document.createElement('button');
                    offBtn.className = `w-full text-left px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.subtitleTrack === -1 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                    offBtn.innerHTML = '<span>Off</span>';
                    offBtn.onclick = () => { window.hls.subtitleTrack = -1; closeSubtitleModal(); };
                    list.appendChild(offBtn);

                    window.hls.subtitleTracks.forEach((track, idx) => {
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.subtitleTrack === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<span>${track.name || track.lang || 'Subtitle ' + (idx + 1)}</span>`;
                        btn.onclick = () => { window.hls.subtitleTrack = idx; closeSubtitleModal(); };
                        list.appendChild(btn);
                    });
                } else {
                    list.innerHTML = '<p class="text-xs text-zinc-500 text-center py-2">No embedded captions found</p>';
                }
                modal.classList.remove('hidden');
            };

            window.closeSubtitleModal = function() {
                document.getElementById('subtitleModal').classList.add('hidden');
            };

            // Quality Modal (4K / 8K / 1080p / Auto)
            window.toggleQualityModal = function() {
                const modal = document.getElementById('qualityModal');
                const list = document.getElementById('quality-tracks-list');
                list.innerHTML = '';

                if (window.hls && window.hls.levels && window.hls.levels.length > 0) {
                    // Auto Option
                    const autoBtn = document.createElement('button');
                    autoBtn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.currentLevel === -1 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                    autoBtn.innerHTML = `<span>Auto (Adaptive 4K/HD)</span> ${window.hls.currentLevel === -1 ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                    autoBtn.onclick = () => {
                        window.hls.currentLevel = -1;
                        showIndicator('Quality: Auto Adaptive');
                        closeQualityModal();
                    };
                    list.appendChild(autoBtn);

                    window.hls.levels.forEach((level, idx) => {
                        let label = `${level.height || 'SD'}p`;
                        let badge = '';
                        if (level.height >= 4320) {
                            label = '8K Ultra HD (7680x4320)';
                            badge = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase border border-amber-500/30">8K UHD</span>';
                        } else if (level.height >= 2160) {
                            label = '4K Ultra HD (3840x2160)';
                            badge = '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[10px] uppercase border border-red-500/30">4K UHD</span>';
                        } else if (level.height >= 1440) {
                            label = '2K QHD (2560x1440)';
                            badge = '<span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">2K</span>';
                        } else if (level.height >= 1080) {
                            label = '1080p Full HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">FHD</span>';
                        } else if (level.height >= 720) {
                            label = '720p HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">HD</span>';
                        }

                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.currentLevel === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<div class="flex items-center gap-2"><span>${label}</span> ${badge}</div> ${window.hls.currentLevel === idx ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => {
                            window.hls.currentLevel = idx;
                            if (level.height >= 2160) {
                                window.hls.config.maxBufferLength = 60;
                                window.hls.config.maxMaxBufferLength = 300;
                            }
                            showIndicator('Quality: ' + label);
                            closeQualityModal();
                        };
                        list.appendChild(btn);
                    });
                } else {
                    list.innerHTML = `
                        <div class="space-y-2 py-2">
                            <p class="text-xs text-zinc-400 text-center font-bold">Standard Single Stream Active</p>
                            <div class="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/50 text-center">
                                <span class="px-2.5 py-1 rounded bg-red-600/30 text-red-400 font-black text-xs uppercase tracking-wider inline-block">4K / 8K Passthrough Ready</span>
                                <p class="text-[11px] text-zinc-400 mt-1">Hardware acceleration and native 4K/8K decoding enabled.</p>
                            </div>
                        </div>
                    `;
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
                modal.classList.remove('hidden');
            };

            window.closeQualityModal = function() {
                document.getElementById('qualityModal').classList.add('hidden');
            };

            // Custom Subtitle File Handling (.srt / .vtt)
            document.addEventListener('change', (e) => {
                if (e.target && e.target.id === 'sub-file-input') {
                    const file = e.target.files[0];
                    if (!file) return;

                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        let text = evt.target.result;
                        if (file.name.endsWith('.srt')) {
                            text = 'WEBVTT\n\n' + text.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
                        }
                        const blob = new Blob([text], { type: 'text/vtt' });
                        const subUrl = URL.createObjectURL(blob);

                        const existingTracks = video.querySelectorAll('track');
                        existingTracks.forEach(t => t.remove());

                        const track = document.createElement('track');
                        track.kind = 'subtitles';
                        track.label = file.name;
                        track.srclang = 'custom';
                        track.src = subUrl;
                        track.default = true;
                        video.appendChild(track);

                        showIndicator('Subtitles Loaded: ' + file.name);
                        closeSubtitleModal();
                    };
                    reader.readAsText(file);
                }
            });

            // Sleep Timer
            window.toggleSleepTimer = function() {
                sleepModal.classList.remove('hidden');
            };

            window.closeSleepModal = function() {
                sleepModal.classList.add('hidden');
            };

            window.setSleepTimer = function(minutes) {
                closeSleepModal();
                if (sleepTimerInterval) clearInterval(sleepTimerInterval);

                if (minutes <= 0) {
                    sleepIndicator.style.display = 'none';
                    showIndicator('Sleep Timer Cancelled');
                    return;
                }

                sleepTargetTime = Date.now() + (minutes * 60 * 1000);
                sleepIndicator.style.display = 'flex';
                showIndicator(`Sleep Timer: ${minutes} Minutes`);

                sleepTimerInterval = setInterval(() => {
                    const remaining = Math.max(0, Math.floor((sleepTargetTime - Date.now()) / 1000));
                    if (remaining <= 0) {
                        clearInterval(sleepTimerInterval);
                        if (player) player.pause();
                        video.pause();
                        sleepIndicator.style.display = 'none';
                        showIndicator('Sleep Timer Expired: Stream Paused');
                    } else {
                        const m = Math.floor(remaining / 60);
                        const s = remaining % 60;
                        sleepTimeLabel.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    }
                }, 1000);
            };

            function showPlayerError(msg) {
                document.getElementById('error-message-text').innerText = msg;
                document.getElementById('player-error').classList.remove('hidden');
                loading.style.display = 'none';
            }

            // Top Control Bar Overlay (Back, Title, Aspect, PiP, Sleep, Reconnect)
            function initTopControls(plyrInstance) {
                let topControls = document.getElementById('top-controls');
                if (!topControls) {
                    topControls = document.createElement('div');
                    topControls.id = 'top-controls';
                    topControls.className = 'absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-[9998] flex items-center justify-between transition-opacity duration-300 opacity-0 pointer-events-none';

                    // Left controls group
                    const leftGroup = document.createElement('div');
                    leftGroup.className = 'flex items-center gap-3 pointer-events-auto';

                    // Back button
                    const backBtn = document.createElement('button');
                    backBtn.onclick = () => window.history.back();
                    backBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-5 h-5"></i>';
                    leftGroup.appendChild(backBtn);

                    // Title pill
                    const titlePill = document.createElement('div');
                    titlePill.className = 'flex items-center gap-2 bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md max-w-[200px] sm:max-w-xs md:max-w-md truncate';
                    titlePill.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span class="text-xs md:text-sm font-bold text-white truncate">${name}</span>`;
                    leftGroup.appendChild(titlePill);

                    topControls.appendChild(leftGroup);

                    // Right controls group
                    const rightGroup = document.createElement('div');
                    rightGroup.className = 'flex items-center gap-2 sm:gap-3 pointer-events-auto';

                    // Reconnect Button
                    const reconnectBtn = document.createElement('button');
                    reconnectBtn.title = "Force Reconnect Stream";
                    reconnectBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    reconnectBtn.innerHTML = '<i data-lucide="rotate-ccw" class="w-5 h-5"></i>';
                    reconnectBtn.onclick = (e) => { e.stopPropagation(); triggerAutoReconnect(); };
                    rightGroup.appendChild(reconnectBtn);

                    // Aspect Ratio Button
                    const aspectBtn = document.createElement('button');
                    aspectBtn.title = "Toggle Aspect Ratio";
                    aspectBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    aspectBtn.innerHTML = '<i data-lucide="maximize" class="w-5 h-5"></i>';
                    aspectBtn.onclick = (e) => { e.stopPropagation(); toggleAspectRatio(); };
                    rightGroup.appendChild(aspectBtn);

                    // Rotate Button
                    const rotateBtn = document.createElement('button');
                    rotateBtn.title = "Rotate View";
                    rotateBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    rotateBtn.innerHTML = '<i data-lucide="smartphone" class="w-5 h-5"></i>';
                    rotateBtn.onclick = (e) => { e.stopPropagation(); window.toggleRotation(); };
                    rightGroup.appendChild(rotateBtn);

                    // Quality Selector Button (4K / 8K)
                    const qualityBtn = document.createElement('button');
                    qualityBtn.title = "Stream Quality (4K / 8K / HD)";
                    qualityBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    qualityBtn.innerHTML = '<i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i>';
                    qualityBtn.onclick = (e) => { e.stopPropagation(); window.toggleQualityModal(); };
                    rightGroup.appendChild(qualityBtn);

                    // Audio Track Button
                    const audioBtn = document.createElement('button');
                    audioBtn.title = "Audio Tracks";
                    audioBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
                    audioBtn.onclick = (e) => { e.stopPropagation(); window.toggleAudioModal(); };
                    rightGroup.appendChild(audioBtn);

                    // Subtitle Button
                    const subBtn = document.createElement('button');
                    subBtn.title = "Subtitles & Captions";
                    subBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    subBtn.innerHTML = '<i data-lucide="subtitles" class="w-5 h-5"></i>';
                    subBtn.onclick = (e) => { e.stopPropagation(); window.toggleSubtitleModal(); };
                    rightGroup.appendChild(subBtn);

                    // Sleep Timer Button
                    const sleepBtn = document.createElement('button');
                    sleepBtn.title = "Set Sleep Timer";
                    sleepBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                    sleepBtn.innerHTML = '<i data-lucide="clock" class="w-5 h-5"></i>';
                    sleepBtn.onclick = (e) => { e.stopPropagation(); window.toggleSleepTimer(); };
                    rightGroup.appendChild(sleepBtn);

                    // PiP Button
                    if (document.pictureInPictureEnabled || video.webkitSupportsPresentationMode) {
                        const pipBtn = document.createElement('button');
                        pipBtn.title = "Picture in Picture";
                        pipBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
                        pipBtn.innerHTML = '<i data-lucide="picture-in-picture-2" class="w-5 h-5"></i>';
                        pipBtn.onclick = async (e) => {
                            e.stopPropagation();
                            try {
                                if (document.pictureInPictureElement) {
                                    await document.exitPictureInPicture();
                                } else {
                                    await video.requestPictureInPicture();
                                }
                            } catch(err) { console.warn("PiP failed:", err); }
                        };
                        rightGroup.appendChild(pipBtn);
                    }

                    topControls.appendChild(rightGroup);

                    const container = document.getElementById('player-container');
                    container.appendChild(topControls);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }

                if (plyrInstance) {
                    plyrInstance.on('controlsshown', () => {
                        topControls.classList.remove('opacity-0', 'pointer-events-none');
                    });
                    plyrInstance.on('controlshidden', () => {
                        topControls.classList.add('opacity-0', 'pointer-events-none');
                    });
                }
                topControls.classList.remove('opacity-0', 'pointer-events-none');
            }

            // Advanced Touch Gestures (Double Tap -10s/+10s)
            function initAdvancedGestures(player, video) {
                const container = player.elements?.container || video.closest('.plyr');
                if (!container) return;

                const indicator = document.getElementById('zoom-indicator');
                function showIndicator(text) {
                    if (!indicator) return;
                    indicator.textContent = text;
                    indicator.style.opacity = '1';
                    setTimeout(() => indicator.style.opacity = '0', 1500);
                }

                // --- MOBILE GESTURES ---
                let startX, startY;
                let isDragging = false;
                let dragType = null; // 'volume', 'brightness', 'seek'
                let initialValue = 0;
                let brightness = 100;

                container.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.plyr__controls')) return;
                    if (e.touches.length === 1) {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                        isDragging = false;
                        dragType = null;
                    }
                }, { passive: true });

                container.addEventListener('touchmove', (e) => {
                    if (e.target.closest('.plyr__controls')) return;
                    if (e.touches.length === 1) {
                        let moveX = e.touches[0].clientX;
                        let moveY = e.touches[0].clientY;
                        let diffX = moveX - startX;
                        let diffY = moveY - startY;
                        let logicalX = startX;
                        let logicalY = startY;
                        
                        const rect = container.getBoundingClientRect();

                        if (window.currentRotation === 90) {
                            diffY = -diffX;
                            logicalX = startY;
                        } else if (window.currentRotation === 270) {
                            diffY = diffX;
                            logicalX = rect.height - (startY - rect.top);
                        } else {
                            logicalX = startX - rect.left;
                        }

                        if (!isDragging && (Math.abs(diffX) > 20 || Math.abs(diffY) > 20)) {
                            isDragging = true;
                            if (logicalX < (window.currentRotation === 90 || window.currentRotation === 270 ? rect.height / 2 : rect.width / 2)) {
                                dragType = 'brightness';
                                initialValue = brightness;
                            } else {
                                dragType = 'volume';
                                initialValue = player.volume * 100;
                            }
                        }

                        if (isDragging) {
                            e.preventDefault(); // Prevent scrolling/zooming while dragging
                            const rect = container.getBoundingClientRect();
                            if (dragType === 'brightness') {
                                const change = (diffY / rect.height) * -200;
                                brightness = Math.max(10, Math.min(200, initialValue + change));
                                document.body.style.filter = `brightness(${brightness}%)`;
                                showIndicator(`Brightness: ${Math.round(brightness)}%`);
                            } else if (dragType === 'volume') {
                                const change = (diffY / rect.height) * -1;
                                const newVolume = Math.max(0, Math.min(1, (initialValue / 100) + change));
                                player.volume = newVolume;
                                showIndicator(`Volume: ${Math.round(newVolume * 100)}%`);
                            }
                        }
                    }
                }, { passive: false });

                // Double tap side to skip
                let lastTap = 0;
                container.addEventListener('touchend', (e) => {
                    if (e.touches.length === 0) {
                        const currentTime = new Date().getTime();
                        const tapLength = currentTime - lastTap;
                        if (tapLength < 300 && tapLength > 0 && !isDragging) {
                            const rect = container.getBoundingClientRect();
                            const x = e.changedTouches[0].clientX - rect.left;
                            if (x < rect.width * 0.25) {
                                player.rewind(10);
                                showIndicator('Rewind 10s');
                                e.preventDefault();
                            } else if (x > rect.width * 0.75) {
                                player.forward(10);
                                showIndicator('Forward 10s');
                                e.preventDefault();
                            } else if (x > rect.width * 0.3 && x < rect.width * 0.7) {
                                // Center double tap for zoom
                                document.body.classList.toggle('video-zoom-fill');
                                showIndicator(document.body.classList.contains('video-zoom-fill') ? 'Zoomed to Fill' : 'Original Fit');
                                e.preventDefault();
                            }
                        }
                        lastTap = currentTime;
                    }
                });

            }
                // Keyboard Shortcuts
            document.addEventListener('keydown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                
                switch(e.key.toLowerCase()) {
                    case ' ':
                    case 'k':
                        e.preventDefault();
                        if (video.paused) video.play(); else video.pause();
                        break;
                    case 'arrowright':
                    case 'l':
                        e.preventDefault();
                        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
                        showIndicator('+10s Forward');
                        break;
                    case 'arrowleft':
                    case 'j':
                        e.preventDefault();
                        video.currentTime = Math.max(0, video.currentTime - 10);
                        showIndicator('-10s Rewind');
                        break;
                    case 'arrowup':
                        e.preventDefault();
                        video.volume = Math.min(1, video.volume + 0.1);
                        showIndicator(`Volume: ${Math.round(video.volume * 100)}%`);
                        break;
                    case 'arrowdown':
                        e.preventDefault();
                        video.volume = Math.max(0, video.volume - 0.1);
                        showIndicator(`Volume: ${Math.round(video.volume * 100)}%`);
                        break;
                    case 'f':
                        e.preventDefault();
                        if (!document.fullscreenElement) {
                            document.getElementById('player-container').requestFullscreen().catch(() => {});
                        } else {
                            document.exitFullscreen();
                        }
                        break;
                    case 'm':
                        e.preventDefault();
                        video.muted = !video.muted;
                        showIndicator(video.muted ? 'Muted' : 'Unmuted');
                        break;
                    case 'a':
                        e.preventDefault();
                        toggleAspectRatio();
                        break;
                }
            });

            // Smart Auto-Reconnect Watchdog
            async function triggerAutoReconnect() {
                if (isReconnecting) return;
                isReconnecting = true;
                console.warn("[Player] Triggering Auto-Reconnect...");
                loading.style.display = 'flex';
                
                if (typeof destroyMpegPlayer === 'function') {
                    destroyMpegPlayer();
                } else if (mpegPlayer) {
                    try {
                        mpegPlayer.pause();
                        mpegPlayer.unload();
                        mpegPlayer.detachMediaElement();
                        mpegPlayer.destroy();
                    } catch(e){}
                    mpegPlayer = null;
                }
                if (hls) {
                    try { hls.destroy(); } catch(e){}
                    hls = null;
                }

                const urlParams = new URLSearchParams(window.location.search);
                const rawIdParam = urlParams.get('id') || urlParams.get('url') || '';
                if (rawIdParam && !rawIdParam.startsWith('http') && !rawIdParam.includes('.mp4') && !rawIdParam.includes('.mkv')) {
                    try {
                        const resolveRes = await fetch(`/api/resolve_stream/${encodeURIComponent(rawIdParam)}`);
                        if (resolveRes.ok) {
                            const resolveData = await resolveRes.json();
                            if (resolveData && resolveData.status === 'success' && resolveData.url) {
                                streamUrl = resolveData.url;
                                console.log('[Auto-Reconnect] Resolved fresh stream token:', streamUrl);
                            }
                        }
                    } catch(e) {
                        console.warn('[Auto-Reconnect] Fresh token resolve failed:', e);
                    }
                }

                setTimeout(() => {
                    isReconnecting = false;
                    initPlayer();
                }, 1500);
            }

            function jumpToSafeLiveBuffer(vid) {
                if (!vid || vid.paused || vid.seeking || !vid.buffered || vid.buffered.length === 0) return;
                const start = vid.buffered.start(0);
                const end = vid.buffered.end(vid.buffered.length - 1);

                // If currentTime is behind buffer start when playing, move safely forward
                if (vid.currentTime < start - 0.5) {
                    console.warn(`[Live Guard] currentTime (${vid.currentTime}) behind buffer start (${start}). Fast-forwarding...`);
                    vid.currentTime = Math.max(start + 0.1, end - 0.5);
                    vid.play().catch(() => {});
                }
            }

            function startWatchdog() {
                if (watchdogTimer) clearInterval(watchdogTimer);
                lastCurrentTime = video.currentTime;
                lastProgressTime = Date.now();

                watchdogTimer = setInterval(() => {
                    if (isReconnecting || video.paused || video.ended) {
                        lastCurrentTime = video.currentTime;
                        lastProgressTime = Date.now();
                        return;
                    }

                    if (video.currentTime !== lastCurrentTime) {
                        lastCurrentTime = video.currentTime;
                        lastProgressTime = Date.now();
                    } else {
                        const stalledTime = Date.now() - lastProgressTime;
                        if (stalledTime > 2500) {
                            jumpToSafeLiveBuffer(video);
                        }
                        if (stalledTime > 45000) {
                            console.warn(`[Watchdog] Stream playback completely frozen for ${Math.round(stalledTime/1000)}s. Auto-reconnecting...`);
                            triggerAutoReconnect();
                        }
                    }
                }, 1000);
            }

            // Main Player Initialization
            function initPlayer() {
                if (!src) {
                    showPlayerError("No stream URL specified.");
                    return;
                }

                // 15 seconds fallback warning
                setTimeout(() => {
                    const fallbackBtn = document.getElementById('loading-fallback');
                    if (fallbackBtn) fallbackBtn.classList.remove('hidden');
                }, 15000);

                const lowerSrc = src.toLowerCase();
                const isDirectMedia = lowerSrc.endsWith('.mp4') || lowerSrc.endsWith('.mkv') || lowerSrc.endsWith('.webm') || lowerSrc.endsWith('.avi') || lowerSrc.endsWith('.mp3');

                // Treat stream links with /play/, .ts, custom_ts, transcode=1, or custom M3U IPTV links as MPEG-TS by default
                                const isM3U8 = lowerSrc.includes('.m3u8') || lowerSrc.includes('m3u=1') || lowerSrc.includes('m3u8=1') || lowerSrc.includes('type=m3u8');
                const isTs = !isDirectMedia && !isM3U8 && (
                    lowerSrc.includes('/play/') ||
                    lowerSrc.includes('.ts') ||
                    lowerSrc.includes('transcode=1') ||
                    lowerSrc.includes('ffmpeg=1') ||
                    lowerSrc.includes('custom_ts=1') ||
                    lowerSrc.includes('/api/stream-proxy') ||
                    true // If it's not direct media and not HLS, assume TS
                );

                let resolvedSrc = src;
                if ((src.startsWith('http://') || src.startsWith('https://')) && !src.includes('live.php') && !src.includes('xtream.php') && !src.includes('/api/stream-proxy')) {
                    if (isTs || lowerSrc.includes('/play/') || src.includes('transcode=1') || src.includes('ffmpeg=1') || src.includes('custom_ts=1') || src.includes('source=consumet') || src.includes('custom_m3u')) {
                        resolvedSrc = `/api/stream-proxy?url=${encodeURIComponent(src)}`;
                    } else {
                        resolvedSrc = `live.php?id=${encodeURIComponent(src)}`;
                    }
                }
                try {
                    resolvedSrc = new URL(resolvedSrc, window.location.origin).href;
                } catch(e) {
                    console.warn("URL resolution error:", e);
                }

                function destroyMpegPlayer() {
                    if (mpegPlayer) {
                        try {
                            mpegPlayer.pause();
                            mpegPlayer.unload();
                            mpegPlayer.detachMediaElement();
                            mpegPlayer.destroy();
                        } catch(e){}
                        mpegPlayer = null;
                    }
                }

                function loadMpegTs(streamUrl) {
                    try {
                        streamUrl = new URL(streamUrl, window.location.origin).href;
                    } catch(e){}
                    console.log("[MPEG-TS Engine] Initializing mpegts.js for stream:", streamUrl);
                    destroyMpegPlayer();

                    try {
                        mpegPlayer = mpegts.createPlayer({
                            type: 'mpegts',
                            isLive: true,
                            url: streamUrl
                        }, {
                            enableWorker: true,
                            enableStashBuffer: true,
                            stashInitialSize: 1024 * 4,
                            liveBufferLatencyChasing: true,
                            liveBufferLatencyMaxLatency: 15,
                            liveBufferLatencyMinLatency: 2,
                            liveBufferLatencyChasingOnStall: false,
                            fixAudioTimestampGap: true,
                            reuse33bitClip: true,
                            autoCleanupSourceBuffer: true,
                            autoCleanupMaxBackwardDuration: 120,
                            autoCleanupMinBackwardDuration: 60,
                        lazyLoad: false
                    });

                        mpegPlayer.attachMediaElement(video);
                        mpegPlayer.load();

                        mpegPlayer.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
                            console.log("[MPEG-TS Engine] Media Info parsed:", mediaInfo);
                            if (video.paused) {
                                const p = video.play();
                                if (p && p.catch) {
                                    p.catch(() => {
                                        console.warn("[MPEG-TS] Autoplay unmuted blocked, muting video to auto-start...");
                                        video.muted = true;
                                        video.play().catch(() => {});
                                    });
                                }
                            }
                        });

                        mpegPlayer.on(mpegts.Events.ERROR, (type, details, data) => {
                            console.error('[MPEG-TS Engine Error]', type, details, data);
                            if (type === mpegts.ErrorTypes.MEDIA_ERROR || details === mpegts.ErrorDetails.FORMAT_UNSUPPORTED) {
                                console.warn("[MPEG-TS] Fallback to native or HLS video playback...");
                                destroyMpegPlayer();
                                if (Hls.isSupported()) {
                                    loadHls(streamUrl);
                                } else {
                                    video.src = streamUrl;
                                    video.load();
                                    video.play().catch(e => {
                                        showPlayerError("Playback failed: Incompatible MPEG-TS video/audio codecs or unreachable stream.");
                                    });
                                }
                                return;
                            } else if (type === mpegts.ErrorTypes.NETWORK_ERROR) {
                                console.warn("[MPEG-TS Network Error] Attempting auto-reconnect...");
                                triggerAutoReconnect();
                                return;
                            }
                            triggerAutoReconnect();
                        });

                        // Anti-Freeze & Rate Guard
                        video.addEventListener('ratechange', () => {
                            if (video.playbackRate !== 1.0) {
                                video.playbackRate = 1.0;
                            }
                        });
                    } catch (err) {
                        console.error("[MPEG-TS Engine Init Failed]", err);
                        if (Hls.isSupported()) {
                            loadHls(streamUrl);
                        } else {
                            video.src = streamUrl;
                            video.load();
                            video.play().catch(() => {
                                showPlayerError("Failed to initialize MPEG-TS player: " + (err.message || "Unknown error"));
                            });
                        }
                        return;
                    }

                    if (!player) {
                        player = new Plyr(video, {
                            controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                            autoplay: true,
                            muted: false,
                                hideControls: { enabled: true, delay: 4000 },
                clickToPlay: true, fullscreen: { enabled: true, fallback: true, iosNative: false }
                            });
                        window.plyrPlayer = player;
                    }

                    video.style.opacity = '1';
                    loading.style.display = 'none';

                    video.play().catch(e => {
                        console.warn("[MPEG-TS] Autoplay blocked, click play to start:", e);
                    });

                    initTopControls(player);
                    initAdvancedGestures(player, video);
                    startWatchdog();
                    window.mpegPlayer = mpegPlayer;
                }

                function loadHls(streamUrl) {
                    try {
                        streamUrl = new URL(streamUrl, window.location.origin).href;
                    } catch(e){}
                    console.log("[HLS Engine] Initializing Hls.js for stream:", streamUrl);
                    if (hls) {
                        try { hls.destroy(); } catch(e){}
                        hls = null;
                    }
                    hls = new Hls({
                        enableWorker: true,
                        maxBufferLength: 30,
                        maxMaxBufferLength: 60,
                        maxBufferSize: 256 * 1024 * 1024,
                        backBufferLength: 60,
                        maxBufferHole: 0.5,
                        highBufferWatchdogPeriod: 2,
                        nudgeOffset: 0.1,
                        nudgeMaxRetry: 5,
                        liveSyncDurationCount: 3,
                        liveMaxLatencyDurationCount: 10,
                        lowLatencyMode: false,
                        manifestLoadingTimeOut: 30000,
                        manifestLoadingMaxRetry: 8,
                        manifestLoadingRetryDelay: 1000,
                        levelLoadingTimeOut: 30000,
                        levelLoadingMaxRetry: 8,
                        fragLoadingTimeOut: 30000,
                        fragLoadingMaxRetry: 8,
                        fragLoadingRetryDelay: 1000,
                        xhrSetup: (xhr) => {
                            xhr.withCredentials = false;
                        }
                    });

                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);

                    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                        console.log(`[HLS] Manifest parsed. Quality levels: ${data.levels.length}`);
                        video.style.opacity = '1';
                        loading.style.display = 'none';
                        
                        if (!player) {
                            player = new Plyr(video, {
                                controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                                autoplay: true,
                                muted: false,
                                hideControls: { enabled: true, delay: 4000 },
                                clickToPlay: true, fullscreen: { enabled: true, fallback: true, iosNative: false }
                            });
                            window.plyrPlayer = player;
                        }

                        video.play().catch(e => {
                            console.warn("[HLS] Autoplay blocked, click play to start:", e);
                        });

                        initTopControls(player);
                        initAdvancedGestures(player, video);
                        startWatchdog();
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.warn('[HLS Error Event]', data.type, data.details, data.fatal ? 'FATAL' : 'NON-FATAL');

                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            if (data.details === 'bufferSeekOverHole' || data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
                                if (data.buffer) {
                                    video.currentTime = data.buffer.nextStart;
                                }
                                return;
                            }
                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                console.warn('[HLS] Non-fatal buffer stall detected. Nudging playhead...');
                                if (video.buffered && video.buffered.length > 0) {
                                    var end = video.buffered.end(video.buffered.length - 1);
                                    if (video.currentTime < end - 0.2) {
                                        video.currentTime += 0.1;
                                    }
                                }
                                if (video.paused && !video.ended) {
                                    video.play().catch(() => {});
                                }
                                return;
                            }
                        }

                        if (data.fatal) {
                            switch (data.type) {
                                case Hls.ErrorTypes.NETWORK_ERROR:
                                    console.warn('[HLS Network Error] Retrying stream load...');
                                    triggerAutoReconnect();
                                    break;
                                case Hls.ErrorTypes.MEDIA_ERROR:
                                    console.warn('[HLS Media Error] Recovering media error...');
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    console.error('[HLS Fatal Error] Unrecoverable error. Trying MPEG-TS fallback...');
                                    if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                                        loadMpegTs(streamUrl);
                                    } else {
                                        triggerAutoReconnect();
                                    }
                                    break;
                            }
                        }
                    });

                    window.hls = hls;
                }

                const finalIsTs = isTs || resolvedSrc.includes('/api/stream-proxy') || lowerSrc.includes('/play/');

                if (finalIsTs && typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                    loadMpegTs(resolvedSrc);
                } else if (Hls.isSupported() && !resolvedSrc.includes('/api/stream-proxy')) {
                    loadHls(resolvedSrc);
                } else {
                    video.src = resolvedSrc;
                    video.load();
                    video.play().catch(() => {});
                }
            }

            initPlayer();
        });
    </script>

    <!-- Touch Gestures Overlay -->
    <div id="touchGestureOverlay" class="absolute inset-0 z-40 hidden md:block" style="touch-action: none; pointer-events: none;"></div>
    
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const plyrContainer = document.querySelector('.plyr') || document.getElementById('player-container');
            if(!plyrContainer) return;
        });
    </script>
    <script src="/watchdog.js" id="maintenance-watchdog"></script>
</body>
</html>
