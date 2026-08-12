<?php
require_once "stalker_api.php";
global $SCARLET_WITCH;
$id = $_GET['id'] ?? '';
$name = $_GET['name'] ?? 'Unknown';
$source = $_GET['source'] ?? 'index.php';
$isXtream = strpos($id, 'xtream_') === 0;

$extension = 'm3u8';
if ($isXtream) {
    $DARK_SIDE = "doctor_strange";
    $token_file = $DARK_SIDE . "/token.stalker";
    if (file_exists($token_file)) {
        $token_data = json_decode(file_get_contents($token_file), true);
        $allowed = $token_data['STALKER']['data']['user_info']['allowed_output_formats'] ?? null;
        if (is_array($allowed) && !in_array('m3u8', $allowed) && in_array('ts', $allowed)) {
            $extension = 'ts';
        }
    }
}

$stream_url = '';
if (strpos($id, 'http://') === 0 || strpos($id, 'https://') === 0) {
    $stream_url = $id;
} else {
    $stream_url = ($isXtream ? "xtream.php?id=" : "live.php?id=") . urlencode($id);
    if ($isXtream) {
        $stream_url .= '.' . $extension;
    }
}

$ROLEX  = $SCARLET_WITCH["meta_data"];
function e($str)
{
    return htmlspecialchars($str ?? '', ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html>

<head>

    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=5.0,user-scalable=yes" />
    <title>{{NAME}} | Stalker Pro Player</title>
    <link rel="icon" type="image/png" href="https://freepngimg.com/thumb/gift/71372-tv-logo-television-old-android-free-download-image.png">
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest" crossorigin></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/plyr@3.6.2/dist/plyr.css" />
    <script src="https://cdn.jsdelivr.net/npm/plyr@3.6.12/dist/plyr.min.js" crossorigin></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1.1.4/dist/hls.min.js" crossorigin></script>
    <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js" crossorigin></script>
    <style>
        * { -webkit-tap-highlight-color: transparent !important; }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html,
        body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #000;
            font-family: Poppins;
        }

        video,
        .plyr,
        .plyr__video-wrapper {
            width: 100vw;
            height: 100dvh;
        }

        video,
        .plyr {
            position: fixed;
            top: 0;
            left: 0;
        }

        .plyr {
            margin: 0 !important;
        }

        .plyr video,
        video {
            object-fit: contain !important;
            opacity: 1;
        }

        /* Zoom to Fill functionality */
        .video-zoom-fill .plyr video,
        .video-zoom-fill video {
            object-fit: cover !important;
        }

        #zoom-indicator {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 14px 28px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 800;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .video-aspect-4-3 video { object-fit: contain !important; aspect-ratio: 4/3; }
        .video-aspect-16-9 video { object-fit: contain !important; aspect-ratio: 16/9; }
        .video-aspect-stretch video { object-fit: fill !important; }
        .video-aspect-fill video { object-fit: cover !important; }

        .sleep-timer-active #sleep-indicator { 
            opacity: 1 !important; 
            transform: translateY(0);
        }
        #sleep-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(220, 38, 38, 0.9);
            color: white;
            padding: 10px 18px;
            border-radius: 14px;
            font-size: 11px;
            font-weight: 800;
            z-index: 10001;
            opacity: 0;
            pointer-events: none;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex;
            align-items: center;
            gap: 8px;
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transform: translateY(-20px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        /* Loader */
        .loading {
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2rem;
        }

        .loading-text {
            text-align: center;
        }

        .loading-text span {
            display: inline-block;
            margin: 0 8px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 2.5rem;
            font-weight: 900;
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }

        .loading-text span:nth-child(1) {
            animation: blur-text 1.5s 0s infinite linear alternate;
        }

        .loading-text span:nth-child(2) {
            animation: blur-text 1.5s 0.15s infinite linear alternate;
        }

        .loading-text span:nth-child(3) {
            animation: blur-text 1.5s 0.3s infinite linear alternate;
        }

        .loading-text span:nth-child(4) {
            animation: blur-text 1.5s 0.45s infinite linear alternate;
        }

        .loading-text span:nth-child(5) {
            animation: blur-text 1.5s 0.6s infinite linear alternate;
        }

        .loading-text span:nth-child(6) {
            animation: blur-text 1.5s 0.75s infinite linear alternate;
        }

        .loading-text span:nth-child(7) {
            animation: blur-text 1.5s 0.9s infinite linear alternate;
        }

        .loading-text span:nth-child(8) {
            animation: blur-text 1.5s 1.05s infinite linear alternate;
        }

        .loading-text span:nth-child(9) {
            animation: blur-text 1.5s 1.2s infinite linear alternate;
        }

        .loading-text span:nth-child(10) {
            animation: blur-text 1.5s 1.35s infinite linear alternate;
        }

        .loading-text span:nth-child(11) {
            animation: blur-text 1.5s 1.5s infinite linear alternate;
        }

        .loading-text span:nth-child(12) {
            animation: blur-text 1.5s 1.65s infinite linear alternate;
        }

        .loading-text span:nth-child(13) {
            animation: blur-text 1.5s 1.8s infinite linear alternate;
        }

        .loading-text span:nth-child(14) {
            animation: blur-text 1.5s 1.95s infinite linear alternate;
        }

        .loading-text span:nth-child(15) {
            animation: blur-text 1.5s 2.1s infinite linear alternate;
        }

        .loading-text span:nth-child(16) {
            animation: blur-text 1.5s 2.25s infinite linear alternate;
        }

        .loading-text span:nth-child(17) {
            animation: blur-text 1.5s 2.4s infinite linear alternate;
        }

        .loading-text span:nth-child(18) {
            animation: blur-text 1.5s 2.55s infinite linear alternate;
        }

        @keyframes blur-text {
            0% {
                filter: blur(0px);
            }

            100% {
                filter: blur(4px);
            }
        }

        /* Logos */
        .plyr__video-wrapper::before {
            content: '';
            position: absolute;
            top: 10px;
            right: 10px;
            width: 35px;
            height: 35px;
            background: url('<?= e($ROLEX['Rimg'] ?? '') ?>') no-repeat;
            background-size: cover;
            z-index: 10;
            pointer-events: none;
        }

        .plyr__video-wrapper::after {
            content: '';
            position: absolute;
            top: 100px;
            left: 15px;
            width: 300px;
            height: 150px;
            background: url('<?= e($ROLEX['Limg'] ?? '') ?>') no-repeat;
            background-size: contain;
            z-index: 10;
            pointer-events: none;
        }

        @media (max-width: 768px) {
            .plyr__video-wrapper::after {
                top: auto;
                bottom: 75px;
                left: 10px;
                width: 140px;
                height: 70px;
            }
            .plyr__video-wrapper::before {
                top: 12px;
                right: 12px;
                width: 24px;
                height: 24px;
            }
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
    <div id="loading" class="loading">
        <div class="loading-text">
            <span style="color:#FF9966">M</span>
            <span style="color:#FF9966">Y</span>
            <span style="color:transparent">&nbsp;</span>
            <span style="color:#FF0000">I</span>
            <span style="color:#FF0000">P</span>
            <span style="color:#FF0000">T</span>
            <span style="color:#FF0000">V</span>
            <span style="color:transparent">&nbsp;</span>
            <span style="color:#66CC66">P</span>
            <span style="color:#66CC66">L</span>
            <span style="color:#66CC66">A</span>
            <span style="color:#66CC66">Y</span>
            <span style="color:#66CC66">E</span>
            <span style="color:#66CC66">R</span>
        </div>
        <div id="loading-fallback" class="hidden">
             <button onclick="location.reload()" class="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2 backdrop-blur-sm">
                 <i data-lucide="refresh-cw" class="w-5 h-5"></i>
                 <span>Stream taking too long? <strong class="ml-1">Force Reload</strong></span>
             </button>
        </div>
    </div>
    <div id="zoom-indicator">Zoomed to Fill</div>
    <div id="sleep-indicator">
        <i data-lucide="clock" class="w-3 h-3"></i>
        <span id="sleep-time">00:00</span>
    </div>
    <div id="player-container" class="fixed inset-0 bg-black z-0">
        <video id="player" autoplay muted controls playsinline poster="<?= heaven(); ?>">
            <source src="{{STREAM_URL}}" type="application/x-mpegURL">
        </video>
    </div>

    <!-- Playback Error Overlay -->
    <div id="player-error" class="hidden fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-6 text-center">
        <div class="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20 text-red-500">
                <i data-lucide="alert-triangle" class="w-8 h-8 animate-pulse"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Playback Connection Error</h3>
            <p id="error-message-text" class="text-zinc-400 text-sm mb-6 leading-relaxed">Failed to load the stream. The stream might be temporarily offline, or the portal is slow to respond.</p>
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

    <!-- Smart Auto-Reconnect Overlay -->
    <div id="reconnect-overlay" class="hidden fixed inset-0 z-[9998] bg-black/80 flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
        <div class="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
            <div class="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6 border border-amber-500/20 text-amber-500 animate-spin" style="animation-duration: 3s;">
                <i data-lucide="refresh-cw" class="w-8 h-8"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2" id="reconnect-title">Connecting...</h3>
            <p id="reconnect-status" class="text-zinc-400 text-sm mb-6 leading-relaxed">Stream dropped. Automatically reconnecting in <span id="reconnect-countdown" class="font-bold text-amber-500">5</span> seconds...</p>
            <div class="text-[10px] uppercase tracking-wider font-mono text-zinc-500 px-3 py-1 bg-zinc-800 rounded-full" id="reconnect-attempt-info">
                Attempt 1
            </div>
        </div>
    </div>

    <!-- Playback Sleep Overlay -->
    <div id="player-sleep-screen" class="hidden fixed inset-0 z-[10000] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
        <div class="max-w-md bg-zinc-950 border border-zinc-900 rounded-2xl p-8 shadow-2xl flex flex-col items-center space-y-6">
            <div class="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20 text-teal-500 animate-pulse">
                <i data-lucide="moon" class="w-8 h-8"></i>
            </div>
            <div class="space-y-1">
                <p class="text-[10px] font-black tracking-[0.3em] text-teal-500 uppercase">System Asleep</p>
                <h3 class="text-3xl font-black text-white" id="playerSleepClock">00:00:00</h3>
            </div>
            <p class="text-zinc-500 text-xs leading-relaxed max-w-xs">The playback has been put to sleep to conserve bandwidth and power.</p>
            <div class="flex gap-4 pt-2">
                <button onclick="wakePlayerUp()" class="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 cursor-pointer">
                    <i data-lucide="play" class="w-4 h-4"></i> Resume Stream
                </button>
                <button onclick="window.history.back()" class="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-zinc-800 flex items-center gap-2 cursor-pointer">
                    <i data-lucide="home" class="w-4 h-4"></i> Dashboard
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
        
        // Override MediaSource.prototype.addSourceBuffer to handle unsupported audio/video codecs (like Dolby AC-3) gracefully
        if (typeof window.MediaSource !== 'undefined' && window.MediaSource.prototype) {
            const originalAddSourceBuffer = window.MediaSource.prototype.addSourceBuffer;
            window.MediaSource.prototype.addSourceBuffer = function(type) {
                try {
                    return originalAddSourceBuffer.call(this, type);
                } catch (e) {
                    if (type.includes('codecs=ac-3') || type.includes('codecs=ec-3') || type.includes('codecs=mp4a.a6') || type.includes('codecs=mp4a.A6') || type.includes('codecs=ac3')) {
                        console.warn("[MediaSource] Unsupported Dolby AC-3 / EC-3 codec blocked to prevent player crash. Returning dummy source buffer.", type);
                        
                        // Construct a dummy SourceBuffer mock object to prevent client-side player crashes
                        const dummySB = {
                            updating: false,
                            buffered: {
                                length: 0,
                                start: () => 0,
                                end: () => 0
                            },
                            listeners: {},
                            addEventListener: function(event, cb) {
                                if (!this.listeners[event]) this.listeners[event] = [];
                                this.listeners[event].push(cb);
                            },
                            removeEventListener: function(event, cb) {
                                if (this.listeners[event]) {
                                    this.listeners[event] = this.listeners[event].filter(l => l !== cb);
                                }
                            },
                            appendBuffer: function(buf) {
                                this.updating = true;
                                setTimeout(() => {
                                    this.updating = false;
                                    if (this.listeners['updateend']) {
                                        this.listeners['updateend'].forEach(cb => {
                                            try { cb({ target: this }); } catch(err) {}
                                        });
                                    }
                                }, 5);
                            },
                            abort: function() {},
                            changeType: function() {},
                            dispatchEvent: function() { return true; }
                        };
                        return dummySB;
                    }
                    throw e;
                }
            };
        }

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
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            function initTopControls(player, video) {
                const setupControls = () => {
                    let topControls = document.getElementById('top-controls');
                    if (!topControls) {
                        topControls = document.createElement('div');
                        topControls.id = 'top-controls';
                        topControls.className = 'absolute top-4 left-4 md:top-6 md:left-6 z-[9998] flex items-center gap-3 transition-opacity duration-300 opacity-0 pointer-events-none';
                        
                        // Create Back Button
                        const backBtn = document.createElement('button');
                        backBtn.onclick = () => {
                            window.history.back();
                        };
                        backBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 group backdrop-blur-md';
                        backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-5 h-5 group-hover:-translate-x-0.5 transition-transform"></i>';
                        topControls.appendChild(backBtn);

                        // Create PiP Button if supported
                        // Create Rotate Button
                        const rotateBtn = document.createElement('button');
rotateBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md pointer-events-auto';
rotateBtn.innerHTML = '<i data-lucide="rotate-cw" class="w-5 h-5"></i>';
rotateBtn.onclick = () => window.toggleRotation();
                        topControls.appendChild(rotateBtn);

                        const container = document.getElementById('player-container') || document.body;
                        container.appendChild(topControls);
                        if (window.lucide) window.lucide.createIcons();
                    }
                };
                if (player) {
                    setupControls();
                } else {
                    video.addEventListener('loadedmetadata', setupControls);
                    setTimeout(setupControls, 50);
                }
            }

            const video = document.getElementById("player");
            if (!video) return;

            window.addEventListener('error', function(event) {
                console.error('[Global Error]', event.error || event.message);
                if (event.message && (event.message.includes('Unhandled error') || event.message.includes('undefined'))) {
                    console.warn('Caught suspicious unhandled error. Suppressing crash.');
                    event.preventDefault();
                }
            });
            window.addEventListener('unhandledrejection', function(event) {
                console.error('[Unhandled Rejection]', event.reason);
            });

            const source = video.querySelector("source");
            if (!source) return;

            const domSrc = source.src;

            const urlParams = new URLSearchParams(window.location.search);
            const lowerId = (urlParams.get('id') || '').toLowerCase();
            let isDirectVideo = lowerId.includes('.mp4') || 
                                  lowerId.includes('.mkv') || 
                                  lowerId.includes('.avi') || 
                                  lowerId.includes('.mp3') || 
                                  lowerId.includes('.m4a') || 
                                  lowerId.includes('_mp4') || 
                                  lowerId.includes('_mkv') || 
                                  lowerId.includes('_avi') || 
                                  lowerId.includes('movie') || 
                                  lowerId.includes('series');

            const src = "{{STREAM_URL}}";
            const name = "{{NAME}}";
            const isXtream = {{IS_XTREAM}};
            const srcUrl = src; 
            window.isXtream = isXtream;

            const hasVodKeywords = lowerId.includes('movie') || 
                                   lowerId.includes('series') || 
                                   lowerId.includes('media') || 
                                   lowerId.includes('vod') || 
                                   lowerId.includes('/media/');
             const hasVodExtension = src.toLowerCase().includes('.mp4') || 
                                     src.toLowerCase().includes('.mkv') || 
                                     src.toLowerCase().includes('.avi');
             const isLive = !hasVodKeywords && !hasVodExtension;
             window.isLive = isLive;

            // --- SMART AUTO-RECONNECT LOGIC ---
            let lastPlayProgressTime = Date.now();
            let lastPlayProgressPosition = -1;
            let isReconnecting = false;
            window.hasStartedPlaying = false;
            let hasStartedPlaying = false; // keep local ref for backward compat in this scope
            Object.defineProperty(window, 'hasStartedPlaying', {
                get: () => hasStartedPlaying,
                set: (v) => { hasStartedPlaying = v; }
            });

            document.addEventListener('playing', (e) => {
                if (e.target && e.target.tagName !== 'VIDEO') return;
                window.hasStartedPlaying = true;
                const overlay = document.getElementById('play-overlay');
                if (overlay) overlay.remove();
                
                reconnectAttemptCount = 0;
                isReconnecting = false;
                if (typeof countdownInterval !== 'undefined' && countdownInterval) {
                    clearInterval(countdownInterval);
                }
                if (typeof reconnectTimer !== 'undefined' && reconnectTimer) {
                    clearTimeout(reconnectTimer);
                }
                if (typeof showReconnectUI === 'function') {
                    showReconnectUI(false);
                }
                const errDiv = document.getElementById('player-error');
                if (errDiv) errDiv.classList.add('hidden');

                // Show floating unmute badge if muted
                setTimeout(() => {
                    const videoEl = document.getElementById('player');
                    if (videoEl && (videoEl.muted || (window.plyrPlayer && window.plyrPlayer.muted))) {
                        if (typeof window.showUnmuteBadge === 'function') {
                            window.showUnmuteBadge();
                        }
                    }
                }, 1200);
            }, true);

            let reconnectAttemptCount = 0;
            const MAX_RECONNECT_RETRIES = 8;
            let reconnectTimer = null;
            let watchdogInterval = null;
            let countdownInterval = null;
            let currentEngine = null;
            let art = null;
            let xtreamRetryCount = 0;
            let xtreamRetryTimeout = null;

            window.showPlayerError = function(msg) {
                document.getElementById('loading').style.display = 'none';
                const errDiv = document.getElementById('player-error');
                if (errDiv) {
                    errDiv.classList.remove('hidden');
                    const textEl = document.getElementById('error-message-text');
                    if (textEl && msg) {
                        textEl.textContent = msg;
                    }
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            };
            const showPlayerError = window.showPlayerError;

            window.showUnmuteBadge = function() {
                if (document.getElementById('unmute-badge')) return;
                const badge = document.createElement('div');
                badge.id = 'unmute-badge';
                badge.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] bg-gradient-to-r from-red-600 to-rose-500 text-white font-black uppercase text-[11px] tracking-widest px-6 py-3.5 rounded-full flex items-center gap-2.5 shadow-[0_10px_30px_rgba(239,68,68,0.5)] hover:from-red-500 hover:to-rose-400 active:scale-95 transition-all cursor-pointer animate-bounce border border-red-400/20';
                badge.innerHTML = `
                    <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="display:inline-block; vertical-align:middle;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg>
                    <span>Tap to Unmute Audio</span>
                `;
                badge.onclick = function(e) {
                    e.stopPropagation();
                    console.log("[Player] Unmute badge clicked");
                    const video = document.getElementById('player');
                    if (video) video.muted = false;
                    if (window.plyrPlayer) {
                        window.plyrPlayer.muted = false;
                        window.plyrPlayer.volume = 1;
                        window.plyrPlayer.play();
                    }
                    badge.remove();
                };
                document.body.appendChild(badge);
            };

            function showReconnectUI(show = true) {
                const overlay = document.getElementById('reconnect-overlay');
                if (!overlay) return;
                
                if (show) {
                    const errDiv = document.getElementById('player-error');
                    if (errDiv) errDiv.classList.add('hidden');
                    overlay.classList.remove('hidden');
                    overlay.classList.add('flex');
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                } else {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex');
                }
            }

            // Global interaction handler to resume blocked playback
            document.addEventListener('click', () => {
                console.log("[Player] Interaction detected, attempting forced play/unmute...");
                if (window.art && window.art.video) {
                    window.art.video.muted = false;
                    window.art.video.play().catch(() => {});
                }
                const players = document.querySelectorAll('video');
                players.forEach(p => {
                    p.muted = false;
                    p.play().catch(() => {});
                });
            }, { once: true });


            // Artplayer configs removed in favor of native Plyr.

            function attachAutoReconnect(engine, streamUrl) {
                const onError = (event, data) => {
                    if ((data && data.fatal) || !data) {
                        triggerAutoReconnect(video, engine, streamUrl);
                    }
                };
                const onLoaded = () => {
                    reconnectAttemptCount = 0;
                    showReconnectUI(false);
                };

                if (typeof Hls !== 'undefined' && engine instanceof Hls) {
                    engine.on(Hls.Events.ERROR, onError);
                    engine.on(Hls.Events.FRAG_LOADED, onLoaded);
                } else if (typeof mpegts !== 'undefined') {
                    engine.on('error', onError);
                    engine.on('statistics_info', onLoaded);
                }
            }

            function triggerAutoReconnect(videoElement, engine, srcUrl) {
                if (isReconnecting) return;
                isReconnecting = true;
                hasStartedPlaying = false;

                if (reconnectTimer) clearTimeout(reconnectTimer);
                if (countdownInterval) clearInterval(countdownInterval);

                reconnectAttemptCount++;
                if (reconnectAttemptCount > MAX_RECONNECT_RETRIES) {
                    showPlayerError("Connection failed after multiple attempts.");
                    return;
                }

                const backoffSeconds = Math.min(Math.pow(2, reconnectAttemptCount), 15);
                showReconnectUI(true);
                
                const titleEl = document.getElementById('reconnect-title');
                if (titleEl) titleEl.textContent = "Connecting...";

                let remaining = backoffSeconds;
                countdownInterval = setInterval(async () => {
                    remaining--;
                    if (remaining <= 0) {
                        clearInterval(countdownInterval);
                        if (engine && engine.destroy) engine.destroy();
                        isReconnecting = false;
                        let newSrc = srcUrl;
                        
                        const rawIdParam = urlParams.get('id') || '';
                        if (rawIdParam && !rawIdParam.startsWith('http') && !rawIdParam.includes('.mp4') && !rawIdParam.includes('.mkv')) {
                            try {
                                const resolveRes = await fetch(`/api/resolve_stream/${encodeURIComponent(rawIdParam)}`);
                                if (resolveRes.ok) {
                                    const resolveData = await resolveRes.json();
                                    if (resolveData && resolveData.status === 'success' && resolveData.url) {
                                        newSrc = resolveData.url;
                                        console.log('[Auto-Reconnect] Successfully resolved fresh token:', newSrc);
                                    }
                                }
                            } catch (e) {
                                console.warn('[Auto-Reconnect] Token resolve fetch failed, falling back to cached URL:', e);
                            }
                        }

                        if (newSrc.includes('nocache=')) {
                            newSrc = newSrc.replace(/nocache=\d+/, 'nocache=' + Date.now());
                        } else {
                            newSrc += (newSrc.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
                        }
                        initLegacyPlayer(newSrc);
                    }
                }, 1000);
            }

            function startWatchdog(videoElement, hlsInstance, srcUrl) {
                if (!isLive) return;
                if (watchdogInterval) clearInterval(watchdogInterval);
                
                lastPlayProgressTime = Date.now();
                lastPlayProgressPosition = videoElement.currentTime;

                watchdogInterval = setInterval(() => {
                    if (isReconnecting) return;
                    if (!hasStartedPlaying) return;

                    // If paused, sleeping, or ended, we shouldn't trigger reconnect
                    const sleepScreen = document.getElementById('player-sleep-screen');
                    const isSleeping = sleepScreen && !sleepScreen.classList.contains('hidden');
                    
                    if (videoElement.paused || videoElement.ended || isSleeping) {
                        lastPlayProgressTime = Date.now();
                        lastPlayProgressPosition = videoElement.currentTime;
                        return;
                    }

                    const currentPos = videoElement.currentTime;
                    if (currentPos !== lastPlayProgressPosition) {
                        // Playback is active and progressing!
                        lastPlayProgressTime = Date.now();
                        lastPlayProgressPosition = currentPos;
                    } else {
                        // Playback is stalled/frozen!
                        const timeStalled = Date.now() - lastPlayProgressTime;
                        if (timeStalled > 45000) {
                            console.warn(`Watchdog: Playback has been frozen for ${Math.round(timeStalled/1000)}s while expected to play. Reconnecting...`);
                            triggerAutoReconnect(videoElement, hlsInstance, srcUrl);
                        }
                    }
                }, 1000);
            }

            let options = {
                controls: [
                    'play-large',
                    'play',
                    'progress',
                    'current-time',
                    'mute',
                    'volume',
                    'settings',
                    'pip',
                    'download',
                    'fullscreen'
                ],
                settings: ['quality', 'speed'],
                hideControls: { enabled: true, delay: 4000 },
                clickToPlay: true, fullscreen: { enabled: true, fallback: true, iosNative: true }
            };
            let speed = navigator.connection?.downlink || 5;
            let targetQuality = 720;
            if (speed < 1) targetQuality = 240;
            else if (speed < 2) targetQuality = 360;
            else if (speed < 5) targetQuality = 480;

            initLegacyPlayer(src);

            async function initLegacyPlayer(srcUrl) {
                let lowerSrc = (srcUrl || '').toLowerCase();
                let isM3U8 = (lowerSrc.includes('.m3u8') || lowerId.includes('m3u8') || lowerSrc.includes('xtream_live_') || lowerSrc.includes('m3u=1') || lowerSrc.includes('m3u8=1') || lowerSrc.includes('type=m3u8')) && !lowerSrc.includes('/play/');
                let isTs = !isM3U8 && (lowerSrc.includes('/api/stream-proxy') || lowerSrc.includes('/play/') || lowerSrc.includes('.ts') || lowerSrc.includes('transcode=1') || lowerSrc.includes('ffmpeg=1') || lowerSrc.includes('custom_ts=1'));

                if ((srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) && (isTs || srcUrl.includes('/play/') || srcUrl.includes('transcode=1') || srcUrl.includes('ffmpeg=1') || srcUrl.includes('custom_ts=1')) && !srcUrl.includes('/api/stream-proxy') && !srcUrl.includes('live.php') && !srcUrl.includes('xtream.php')) {
                    srcUrl = `/api/stream-proxy?url=${encodeURIComponent(srcUrl)}`;
                    isTs = true;
                } else if (srcUrl && !srcUrl.startsWith('http') && !srcUrl.startsWith('blob')) {
                    srcUrl = new URL(srcUrl, window.location.origin).href;
                }

                let hls = null;
                let mpegPlayer = null;
                let player = null;
                let seekOffset = 0;

                const originalDurationGetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'duration').get;
                const originalCurrentTimeGetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime').get;
                const originalCurrentTimeSetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime').set;
                const originalBufferedGetter = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'buffered').get;
                
                // Retrieve VOD duration from server to override native video tag read-only property
                let movieDuration = 0;
                if (!isLive) {
                    try {
                        const infoRes = await fetch(`stalker_api.php?action=stream_info`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: lowerId })
                        });
                        const infoData = await infoRes.json();
                        if (infoData.status === 'success') {
                            movieDuration = infoData.duration || 0;
                            if (movieDuration > 0) {
                                console.log("[Player] Resolved movie duration:", movieDuration);
                            }
                            
                            if (infoData.isM3U8) {
                                console.log("[Player] Server detected stream format: HLS (M3U8)");
                                isM3U8 = true;
                                isTs = false;
                                isDirectVideo = false;
                            } else if (infoData.isTs) {
                                console.log("[Player] Server detected stream format: MPEG-TS");
                                isM3U8 = false;
                                isTs = true;
                                isDirectVideo = false;
                            } else if (infoData.isDirectVideo) {
                                console.log("[Player] Server detected stream format: Direct Video");
                                isM3U8 = false;
                                isTs = false;
                                isDirectVideo = true;
                            }
                            
                            Object.defineProperty(video, 'duration', {
                                get: function() {
                                    if (movieDuration > 0) {
                                        return movieDuration;
                                    }
                                    return originalDurationGetter.call(this);
                                },
                                configurable: true
                            });

                             window.draggedTime = undefined;

                             Object.defineProperty(video, 'currentTime', {
                                get: function() {
                                    const stack = new Error().stack || '';
                                    const nativeTime = originalCurrentTimeGetter.call(this);
                                    if (isTs || stack.includes('hls') || stack.includes('Hls') || stack.includes('mpegts') || stack.includes('tsdemuxer') || stack.includes('jumpToSafeLiveBuffer')) {
                                        return nativeTime;
                                    }
                                    if (window.isSeekingReload) {
                                        return seekOffset;
                                    }
                                    if (window.draggedTime !== undefined) {
                                        return window.draggedTime;
                                    }
                                    return nativeTime + seekOffset;
                                },
                                set: function(val) {
                                    const stack = new Error().stack || '';
                                    if (isTs || stack.includes('hls') || stack.includes('Hls') || stack.includes('mpegts') || stack.includes('tsdemuxer') || stack.includes('jumpToSafeLiveBuffer') || stack.includes('Watchdog')) {
                                        originalCurrentTimeSetter.call(this, val);
                                    } else {
                                        const isScrubbing = player && (player.seeking || player.scrubbing);
                                        if (isScrubbing) {
                                            window.draggedTime = val;
                                        } else {
                                            triggerSeekReload(val);
                                        }
                                    }
                                },
                                configurable: true
                             });
 
                             Object.defineProperty(video, 'buffered', {
                                get: function() {
                                    const nativeBuffered = originalBufferedGetter.call(this);
                                    const stack = new Error().stack || '';
                                    if (isTs || stack.includes('hls') || stack.includes('Hls') || stack.includes('mpegts') || stack.includes('tsdemuxer') || stack.includes('jumpToSafeLiveBuffer')) {
                                        return nativeBuffered;
                                    }
                                    const len = nativeBuffered ? nativeBuffered.length : 0;
                                    return {
                                        length: len,
                                        start: function(index) { return nativeBuffered.start(index) + seekOffset; },
                                        end: function(index) { return nativeBuffered.end(index) + seekOffset; }
                                    };
                                },
                                configurable: true
                             });
                            
                            // Force Plyr refresh on metadata loaded
                            video.addEventListener('loadedmetadata', () => {
                                console.log("[Player] Metadata loaded. Triggering duration change update...");
                                video.dispatchEvent(new Event('durationchange'));
                            });
                        }
                    } catch(e) {
                        console.error("[Player] Failed to load VOD duration:", e);
                    }
                }

                // Unified VOD seek event listener
                function triggerSeekReload(targetTime) {
                    if (isDirectVideo && !mpegPlayer) return; // Native direct videos handle seeks natively
                    if (window.isSeekingReload) return;
                    if (Math.abs(targetTime - (originalCurrentTimeGetter.call(video) + seekOffset)) < 2) return;
                    
                    const wasPaused = video.paused;
                    window.isSeekingReload = true;
                    
                    let seekUrl = srcUrl;
                    if (seekUrl.includes('seek=')) {
                        seekUrl = seekUrl.replace(/seek=\d+/, `seek=${Math.round(targetTime)}`);
                    } else {
                        seekUrl += (seekUrl.includes('?') ? '&' : '?') + `seek=${Math.round(targetTime)}`;
                    }
                    
                    console.log("[Player] Seeking VOD via Virtual Timeline to:", targetTime, "Reloading:", seekUrl);
                    seekOffset = targetTime;
                    
                    if (mpegPlayer) {
                        mpegPlayer.unload();
                        mpegPlayer.detachMediaElement();
                        mpegPlayer.destroy();
                        
                        mpegPlayer = mpegts.createPlayer({
                            type: 'mpegts',
                            isLive: isLive,
                            url: new URL(seekUrl, window.location.origin).href
                        }, {
                            enableWorker: true,
                            enableStashBuffer: true,
                            stashInitialSize: 1024 * 4,
                            liveBufferLatencyChasing: true,
                            fixAudioTimestampGap: true
                        });
                        mpegPlayer.attachMediaElement(video);
                        mpegPlayer.load();

                        mpegPlayer.on(mpegts.Events.ERROR, (type, details, data) => {
                            console.error('mpegts.js Seek Error:', type, details, data);
                            if (type === mpegts.ErrorTypes.MEDIA_ERROR) {
                                console.warn("MSE Error detected. Trying native playback fallback...");
                                mpegPlayer.destroy();
                                window.currentEngine = null;
                                mpegPlayer = null;
                                video.src = srcUrl;
                                video.load();
                                video.currentTime = targetTime;
                                video.play().catch(e => {
                                    console.error("Native fallback play failed:", e);
                                    showPlayerError("Playback failed: Incompatible audio/video codecs (e.g. HEVC/H.265). Your browser/device cannot decode this stream natively.");
                                });
                                window.isSeekingReload = false;
                                return;
                            }
                            triggerAutoReconnect(video, mpegPlayer, srcUrl);
                        });
                        
                        if (wasPaused) {
                            video.pause();
                            window.isSeekingReload = false;
                        } else {
                            mpegPlayer.play().then(() => {
                                window.isSeekingReload = false;
                            }).catch(() => {
                                window.isSeekingReload = false;
                            });
                        }
                    } else if (hls) {
                        hls.destroy();
                        hls = new Hls({
                            enableWorker: true,
                            maxBufferLength: 30,
                            maxMaxBufferLength: 60,
                            maxBufferSize: 256 * 1024 * 1024,
                            backBufferLength: 30,
                            maxBufferHole: 1.5,
                            highBufferWatchdogPeriod: 0,
                            nudgeOffset: 0.2,
                            nudgeMaxRetry: 3,
                            liveSyncDurationCount: 8,
                            liveMaxLatencyDurationCount: 30,
                            lowLatencyMode: false,
                            manifestLoadingTimeOut: 15000,
                            manifestLoadingMaxRetry: 10,
                            manifestLoadingRetryDelay: 1000,
                            levelLoadingTimeOut: 15000,
                            levelLoadingMaxRetry: 10,
                            fragLoadingTimeOut: 20000,
                            fragLoadingMaxRetry: 10,
                            fragLoadingRetryDelay: 1000,
                            xhrSetup: (xhr) => { xhr.withCredentials = false; }
                        });
                        hls.loadSource(new URL(seekUrl, window.location.origin).href);
                        hls.attachMedia(video);
                        
                        hls.on(Hls.Events.MANIFEST_PARSED, () => {
                            if (wasPaused) {
                                video.pause();
                                window.isSeekingReload = false;
                            } else {
                                video.play().then(() => {
                                    window.isSeekingReload = false;
                                }).catch(() => {
                                    window.isSeekingReload = false;
                                });
                            }
                        });
                    } else {
                        if (player) {
                            player.source = {
                                type: 'video',
                                sources: [
                                    {
                                        src: new URL(seekUrl, window.location.origin).href
                                    }
                                ]
                            };
                        } else {
                            video.src = new URL(seekUrl, window.location.origin).href;
                        }
                        
                        if (wasPaused) {
                            video.pause();
                            window.isSeekingReload = false;
                        } else {
                            video.play().then(() => {
                                window.isSeekingReload = false;
                            }).catch(() => {
                                window.isSeekingReload = false;
                            });
                        }
                    }
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

                const finalIsTs = isTs || srcUrl.includes('/api/stream-proxy') || lowerSrc.includes('/play/');

                if (finalIsTs && mpegts.isSupported()) {
                    console.log("[Player] Initializing mpegts.js for TS stream:", srcUrl);
                    mpegPlayer = mpegts.createPlayer({
                        type: 'mpegts',
                        isLive: isLive,
                        url: srcUrl
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
                        console.error('mpegts.js Error:', type, details, data);
                        if (type === mpegts.ErrorTypes.MEDIA_ERROR || details === mpegts.ErrorDetails.FORMAT_UNSUPPORTED) {
                            console.warn("MSE/Format Error detected. Trying native playback fallback...");
                            mpegPlayer.destroy();
                            window.currentEngine = null;
                            mpegPlayer = null;
                            video.src = srcUrl;
                            video.load();
                            video.play().catch(e => {
                                console.error("Native fallback play failed:", e);
                                showPlayerError("Playback failed: Incompatible audio/video codecs (e.g. HEVC/H.265). Your browser/device cannot decode this stream natively.");
                            });
                            return;
                        } else if (type === mpegts.ErrorTypes.NETWORK_ERROR && details === mpegts.ErrorDetails.HTTP_STATUS_CODE_INVALID) {
                            console.error("Stream is currently offline or returning HTTP error. Retrying...");
                            triggerAutoReconnect(video, mpegPlayer, srcUrl);
                            return;
                        }
                        triggerAutoReconnect(video, mpegPlayer, srcUrl);
                    });

                    // Anti-Freeze & Rate Guard
                    video.addEventListener('ratechange', () => {
                        if (video.playbackRate !== 1.0) {
                            video.playbackRate = 1.0;
                        }
                    });

                    player = new Plyr(video, options);
                    window.plyrPlayer = player;
                    player.on('error', (err) => {
                        console.error('Plyr error:', err);
                    });
                    video.style.opacity = 1;
                    document.getElementById('loading').style.display = 'none';
                    player.play().catch(() => {});

                    initTopControls(player, video);
                    startWatchdog(video, mpegPlayer, srcUrl);
                    window.currentEngine = mpegPlayer;

                    // Restrict live seek limit in mpegts
                    if (isLive) {
                        player.on('seeking', () => {
                            let maxBuffered = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : video.currentTime;
                            if (player.currentTime < maxBuffered - 50) {
                                player.currentTime = maxBuffered - 50;
                            }
                        });
                    }

                    // Native Multi-audio / Subtitles tracks selection support for Plyr
                    video.addEventListener('loadedmetadata', () => {
                        console.log("[Player] Loaded metadata. Scanning for embedded audio/subtitle tracks...");
                        
                        // Handle native audio track selection UI or triggers
                        if (video.audioTracks && video.audioTracks.length > 1) {
                            console.log("[Player] Found native multi-audio tracks:", video.audioTracks.length);
                            // Set up custom audio select elements or log
                        }
                    });
                } else if (Hls.isSupported() && !isDirectVideo) {
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
                        capLevelToPlayerSize: true,
                        manifestLoadingTimeOut: 30000,
                        manifestLoadingMaxRetry: 8,
                        manifestLoadingRetryDelay: 1000,
                        levelLoadingTimeOut: 30000,
                        levelLoadingMaxRetry: 8,
                        levelLoadingRetryDelay: 1000,
                        fragLoadingTimeOut: 30000,
                        fragLoadingMaxRetry: 8,
                        fragLoadingRetryDelay: 1000,
                    });

                let manifestLoaded = false;
                let loadingTimeout = setTimeout(() => {
                    if (!manifestLoaded) {
                        console.error("Manifest load timed out (App Level Fallback). Triggering Smart Auto-Reconnect...");
                        triggerAutoReconnect(video, hls, src);
                    }
                }, 45000); // 45 seconds fallback timeout

                let bufferAppendErrorCount = 0;
                let networkRetryCount = 0;
                let mediaRetryCount = 0;

                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        console.error('HLS Fatal Error:', data.type, data.details);
                    } else {
                        console.warn('HLS Warning:', data.type, data.details);
                    }
                    
                    const statusCode = data.response?.code || data.response?.status;
                    if (statusCode === 401 || statusCode === 403) {
                        console.error(`Authorization error (${statusCode}) encountered. Reconnecting...`);
                        triggerAutoReconnect(video, hls, src);
                        return;
                    }

                    // Handle direct codec error or MSE incompatibility immediately by falling back to native player
                    if (data.details === 'bufferIncompatibleCodecsError' || 
                        data.details === 'bufferAddCodecError' || 
                        data.details === 'bufferIncompatibleCodecs' || 
                        (data.details && data.details.toLowerCase().includes('codec'))) {
                        if (supportsNativeHls) {
                            console.warn(`Browser MSE codec incompatibility (${data.details}). Falling back to native player...`);
                            clearTimeout(loadingTimeout);
                            if (reconnectTimer) clearTimeout(reconnectTimer);
                            if (countdownInterval) clearInterval(countdownInterval);
                            isReconnecting = false;
                            try {
                                hls.destroy();
                            } catch (e) {}
                            while (video.firstChild) {
                                video.removeChild(video.firstChild);
                            }
                            video.removeAttribute('type');
                            video.src = src;
                            video.load();
                            video.play()
                                .then(() => {
                                    console.log("Native player fallback: Playback started successfully!");
                                    document.getElementById('loading').style.display = 'none';
                                })
                                .catch(e => {
                                    console.error("Native fallback play failed:", e);
                                    showPlayerError("Playback failed: Incompatible audio/video codecs. Your browser/device cannot decode this stream.");
                                });
                        } else {
                            console.error(`Browser MSE codec incompatibility (${data.details}) and native HLS is NOT supported. Triggering Smart Auto-Reconnect...`);
                            clearTimeout(loadingTimeout);
                            triggerAutoReconnect(video, hls, src);
                        }
                        return;
                    }
                    
                    // Proactively handle bufferAppendError (whether fatal or non-fatal) to prevent playback freezing/stuck issues
                    if (data.details === 'bufferAppendError' || data.details === 'bufferAppendedError' || data.details === Hls.ErrorDetails?.BUFFER_APPEND_ERROR) {
                        bufferAppendErrorCount++;
                        if (bufferAppendErrorCount <= 3) {
                            console.warn(`Buffer append error detected (${bufferAppendErrorCount}/3). Attempting media recovery...`);
                            hls.recoverMediaError();
                        } else {
                            if (supportsNativeHls) {
                                console.error('Persistent buffer append error. Falling back to native player...');
                                bufferAppendErrorCount = 0;
                                clearTimeout(loadingTimeout);
                                if (reconnectTimer) clearTimeout(reconnectTimer);
                                if (countdownInterval) clearInterval(countdownInterval);
                                isReconnecting = false;
                                try {
                                    hls.destroy();
                                } catch (e) {}
                                while (video.firstChild) {
                                    video.removeChild(video.firstChild);
                                }
                                video.removeAttribute('type');
                                video.src = src;
                                video.load();
                                video.play().catch(e => {
                                    console.error("Native fallback play failed:", e);
                                    showPlayerError("Playback failed: Incompatible audio/video codecs. Your browser/device cannot decode this stream.");
                                });
                            } else {
                                console.error('Persistent buffer append error and native HLS is NOT supported. Triggering Smart Auto-Reconnect...');
                                bufferAppendErrorCount = 0;
                                clearTimeout(loadingTimeout);
                                triggerAutoReconnect(video, hls, src);
                            }
                        }
                        return;
                    } else if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails?.BUFFER_STALLED_ERROR) {
                        console.warn('[HLS] Non-fatal buffer stall detected. Nudging playhead...');
                        if (video.buffered && video.buffered.length > 0) {
                            const end = video.buffered.end(video.buffered.length - 1);
                            if (video.currentTime < end - 0.2) {
                                video.currentTime += 0.1;
                            }
                        }
                        if (video.paused && !video.ended) {
                            video.play().catch(() => {});
                        }
                    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                        // Reset count on successful recovery or other non-append media events
                        bufferAppendErrorCount = 0;
                    }

                    if (data.fatal) {
                        switch (data.type) {
                            case Hls.ErrorTypes.NETWORK_ERROR:
                                networkRetryCount++;
                                if (networkRetryCount <= 5) {
                                    console.warn(`Fatal network error (${data.details}), retrying (${networkRetryCount}/5)...`);
                                    const delay = Math.min(1000 * Math.pow(2, networkRetryCount - 1), 8000);
                                    setTimeout(() => {
                                        if (data.details === 'manifestLoadError' || 
                                            data.details === 'manifestLoadTimeOut' || 
                                            data.details === Hls.ErrorDetails?.MANIFEST_LOAD_ERROR || 
                                            data.details === Hls.ErrorDetails?.MANIFEST_LOAD_TIMEOUT) {
                                            console.log("HLS SRC:", src); hls.loadSource(src);
                                        } else {
                                            hls.startLoad();
                                        }
                                    }, delay);
                                } else {
                                    console.error('Max network retries reached. Triggering background Smart Auto-Reconnect...');
                                    clearTimeout(loadingTimeout);
                                    triggerAutoReconnect(video, hls, src);
                                }
                                break;
                            case Hls.ErrorTypes.MEDIA_ERROR:
                                mediaRetryCount++;
                                if (mediaRetryCount <= 5) {
                                    console.warn(`Fatal media error (${data.details}), recovering (${mediaRetryCount}/5)...`);
                                    hls.recoverMediaError();
                                } else {
                                    if (supportsNativeHls) {
                                        console.error('Max media retries reached. Falling back to native player...');
                                        mediaRetryCount = 0;
                                        clearTimeout(loadingTimeout);
                                        if (reconnectTimer) clearTimeout(reconnectTimer);
                                        if (countdownInterval) clearInterval(countdownInterval);
                                        isReconnecting = false;
                                        try {
                                            hls.destroy();
                                        } catch (e) {}
                                        while (video.firstChild) {
                                            video.removeChild(video.firstChild);
                                        }
                                        video.removeAttribute('type');
                                        video.src = src;
                                        video.load();
                                        video.play().catch(e => {
                                            console.error("Native fallback play failed:", e);
                                            showPlayerError("Playback failed: Incompatible audio/video codecs. Your browser/device cannot decode this stream.");
                                        });
                                    } else {
                                        console.error('Max media retries reached and native HLS is NOT supported. Triggering fresh Smart Auto-Reconnect...');
                                        mediaRetryCount = 0;
                                        clearTimeout(loadingTimeout);
                                        triggerAutoReconnect(video, hls, src);
                                    }
                                }
                                break;
                            default:
                                console.error('Unrecoverable HLS error. Triggering background Smart Auto-Reconnect...');
                                clearTimeout(loadingTimeout);
                                triggerAutoReconnect(video, hls, src);
                                break;
                        }
                    }
                });

                console.log("HLS SRC:", src); hls.loadSource(src);
                hls.attachMedia(video);

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    clearTimeout(loadingTimeout);
                    manifestLoaded = true;

                    const levels = hls.levels;
                    let qualities = [];
                    levels.forEach(l => {
                        if (l.height && !qualities.includes(l.height)) {
                            qualities.push(l.height);
                        }
                    });
                    qualities.unshift(0);

                    hls.currentLevel = -1;

                    options.quality = {
                        default: 0,
                        options: qualities,
                        forced: true,
                        onChange: q => {
                            if (q === 0) {
                                hls.currentLevel = -1;
                            } else {
                                const idx = levels.findIndex(l => l.height === q);
                                if (idx > -1) hls.currentLevel = idx;
                            }
                        }
                    };
                    
                    options.i18n = {
                        qualityLabel: {
                            0: 'Auto'
                        }
                    };

                    player = new Plyr(video, options);
                    window.plyrPlayer = player;
                    player.on('error', (err) => {
                        console.error('Plyr error:', err);
                    });
                    video.style.opacity = 1;
                    document.getElementById('loading').style.display = 'none';
                    player.play().catch(() => {});
                    
                    player.on('ready', () => {
                        video.style.opacity = 1;
                        document.getElementById('loading').style.display = 'none';
                    });
                    initTopControls(player, video);
                    startWatchdog(video, hls, src);
                    window.currentEngine = hls;
                });

                window.hls = hls;

            } else {
                if (isDirectVideo) {
                    while (video.firstChild) {
                        video.removeChild(video.firstChild);
                    }
                    video.removeAttribute('type');
                    video.src = src;
                }

                let manifestLoaded = false;
                let loadingTimeout = setTimeout(() => {
                    if (!manifestLoaded) {
                        console.error("Native player loading timed out. Triggering Smart Auto-Reconnect...");
                        triggerAutoReconnect(video, null, src);
                    }
                }, 45000);

                player = new Plyr(video, options);
                window.plyrPlayer = player;
                video.style.opacity = 1;
                document.getElementById('loading').style.display = 'none';
                player.play().catch(() => {});
                
                video.addEventListener('error', function() {
                    const err = video.error;
                    console.error('Native video element error:', err);
                    let errMsg = "A native playback error occurred.";
                    if (err) {
                        if (err.code === 1) errMsg = "Playback aborted by user.";
                        else if (err.code === 2) errMsg = "Network error while downloading the stream.";
                        else if (err.code === 3) errMsg = "Media decoding failed. The format may not be supported.";
                        else if (err.code === 4) errMsg = "The stream is not playable or access was denied.";
                    }
                    showPlayerError(errMsg);
                });
                
                player.on('ready', () => {
                    video.style.opacity = 1;
                    document.getElementById('loading').style.display = 'none';
                    clearTimeout(loadingTimeout);
                    manifestLoaded = true;
                });
                initTopControls(player, video);
                startWatchdog(video, null, src);
                window.currentEngine = player;

                if (!isLive) {
                    player.on('seeked', () => {
                        if (window.draggedTime !== undefined) {
                            const target = window.draggedTime;
                            window.draggedTime = undefined;
                            triggerSeekReload(target);
                        }
                    });
                }
            }
        }
        });

        // Global interaction listener for autoplay/unmute recovery
        document.addEventListener('click', function(e) {
            if (e.target && e.target.closest && (e.target.closest('.plyr__controls') || e.target.closest('.plyr__video-wrapper'))) return;
            if (!window.hasStartedPlaying) {
                console.log("[Player] Interaction detected, attempting forced play/unmute...");
                const video = document.getElementById('player');
                if (video) {
                    video.muted = false;
                }
                if (window.plyrPlayer) {
                    window.plyrPlayer.muted = false;
                    window.plyrPlayer.volume = 1;
                    window.plyrPlayer.play().then(() => {
                        window.hasStartedPlaying = true;
                        const overlay = document.getElementById('play-overlay');
                        if (overlay) overlay.remove();
                        const badge = document.getElementById('unmute-badge');
                        if (badge) badge.remove();
                    }).catch(e => console.warn("Plyr forced play failed:", e));
                } else if (video) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                        playPromise.then(() => {
                            window.hasStartedPlaying = true;
                            const overlay = document.getElementById('play-overlay');
                            if (overlay) overlay.remove();
                            const badge = document.getElementById('unmute-badge');
                            if (badge) badge.remove();
                        }).catch(e => console.warn("Video forced play failed:", e));
                    }
                }
            }
        }, { once: false });

        const targetVideo = document.getElementById('player');
        if (targetVideo) {
            targetVideo.addEventListener('loadedmetadata', () => {
                // Track selector logic removed
            });
        }
    </script>

    <script src="assets/tv-navigation.js"></script>

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