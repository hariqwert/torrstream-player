
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta name="robots" content="noindex">
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <title><?php echo htmlspecialchars($name); ?> | Stalker Pro Pure HLS Player</title>

    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest" crossorigin></script>
    <!-- Plyr, Hls.js & mpegts.js Libraries -->
    <link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
    <script src="https://cdn.plyr.io/3.7.8/plyr.polyfilled.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@1"></script>
    <script src="https://cdn.jsdelivr.net/npm/mpegts.js@1.7.3/dist/mpegts.min.js" crossorigin></script>
    <script src="https://cdn.jsdelivr.net/npm/dashjs@4.7.4/dist/dash.all.min.js" crossorigin></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/shaka-player/4.7.11/shaka-player.compiled.js"></script>
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
        /* High-Precision Smooth Touch Responsive Timeline & Seeking */

        /* Subtitle Visual Controller Variables & Typography */
        :root {
            --sub-font-size: 1.15rem;
            --sub-color: #ffffff;
            --sub-bg: rgba(0, 0, 0, 0.78);
            --sub-shadow: 0 2px 5px rgba(0, 0, 0, 0.95);
        }

        /* Force native captions to show & respect visual typography */
        ::cue {
            font-size: var(--sub-font-size) !important;
            color: var(--sub-color) !important;
            background-color: var(--sub-bg) !important;
            text-shadow: var(--sub-shadow) !important;
            line-height: 1.4 !important;
            border-radius: 6px !important;
        }
        .plyr__captions .plyr__caption {
            font-size: var(--sub-font-size) !important;
            color: var(--sub-color) !important;
            background: var(--sub-bg) !important;
            text-shadow: var(--sub-shadow) !important;
            line-height: 1.4 !important;
            border-radius: 6px !important;
            padding: 4px 10px !important;
            backdrop-filter: blur(4px) !important;
        }
        .plyr--video video::-webkit-media-text-track-container {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }
        .plyr--video video::-webkit-media-text-track-display {
            display: inline-block !important;
            opacity: 1 !important;
            visibility: visible !important;
        }

        .plyr__progress {
            position: relative !important;
            touch-action: none !important;
            padding: 10px 0 !important;
            cursor: pointer !important;
            user-select: none !important;
            -webkit-user-select: none !important;
            min-height: 28px !important;
            display: flex !important;
            align-items: center !important;
        }
        .plyr__progress input[type="range"] {
            position: relative !important;
            height: 28px !important;
            cursor: pointer !important;
            touch-action: none !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 10 !important;
        }
        /* Progress track */
        .plyr--video .plyr__progress__buffer,
        .plyr--video .plyr__progress input[type="range"]::-webkit-slider-runnable-track,
        .plyr--video .plyr__progress input[type="range"]::-moz-range-track {
            height: 6px !important;
            border-radius: 9999px !important;
            transition: height 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        /* Smooth Expand on hover, active, touch or scrubbing */
        .plyr__progress:hover .plyr__progress__buffer,
        .plyr__progress:active .plyr__progress__buffer,
        .plyr__progress:hover input[type="range"]::-webkit-slider-runnable-track,
        .plyr__progress:active input[type="range"]::-webkit-slider-runnable-track,
        .plyr__progress.is-scrubbing .plyr__progress__buffer,
        .plyr__progress.is-scrubbing input[type="range"]::-webkit-slider-runnable-track {
            height: 9px !important;
        }
        /* Scrubber thumb - smooth glowing & enlarged touch radius */
        .plyr--video input[type="range"]::-webkit-slider-thumb {
            width: 15px !important;
            height: 15px !important;
            background: #ef4444 !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 0 2px 6px rgba(0,0,0,0.6) !important;
            border-radius: 50% !important;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease !important;
            margin-top: -4.5px !important;
            cursor: pointer !important;
        }
        .plyr--video input[type="range"]:active::-webkit-slider-thumb,
        .plyr--video input[type="range"]:focus::-webkit-slider-thumb,
        .plyr__progress.is-scrubbing input[type="range"]::-webkit-slider-thumb {
            transform: scale(1.45) !important;
            background: #ff3b30 !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 1), 0 0 0 7px rgba(239, 68, 68, 0.35) !important;
        }
        .plyr--video input[type="range"]::-moz-range-thumb {
            width: 15px !important;
            height: 15px !important;
            background: #ef4444 !important;
            border: 2px solid #ffffff !important;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.8), 0 2px 6px rgba(0,0,0,0.6) !important;
            border-radius: 50% !important;
            transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease !important;
        }
        .plyr--video input[type="range"]:active::-moz-range-thumb,
        .plyr__progress.is-scrubbing input[type="range"]::-moz-range-thumb {
            transform: scale(1.45) !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 1), 0 0 0 7px rgba(239, 68, 68, 0.35) !important;
        }
        .plyr__tooltip {
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
            font-weight: 800 !important;
            font-size: 11px !important;
            letter-spacing: 0.04em !important;
            border-radius: 8px !important;
            padding: 5px 9px !important;
            background: rgba(10, 10, 15, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.2) !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
            backdrop-filter: blur(12px) !important;
            color: #ffffff !important;
        }
        /* Touch Seek HUD overlay */
        .touch-seek-hud {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.95);
            background: rgba(10, 10, 15, 0.92);
            border: 1px solid rgba(239, 68, 68, 0.4);
            box-shadow: 0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(239, 68, 68, 0.2);
            color: #fff;
            padding: 16px 28px;
            border-radius: 24px;
            font-size: 14px;
            font-weight: 800;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            z-index: 10002;
            backdrop-filter: blur(16px);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            min-width: 200px;
        }
        .touch-seek-hud.active {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        .touch-seek-hud .hud-time {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 0.05em;
            color: #fff;
        }
        .touch-seek-hud .hud-diff {
            font-size: 13px;
            font-weight: 800;
            color: #ef4444;
        }
        .touch-seek-hud .hud-bar {
            width: 100%;
            height: 5px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 9999px;
            overflow: hidden;
            margin-top: 6px;
        }
        .touch-seek-hud .hud-bar-fill {
            height: 100%;
            background: #ef4444;
            border-radius: 9999px;
            transition: width 0.05s linear;
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
        /* Minimal Loading Screen */
        #loading {
            position: fixed;
            inset: 0;
            background: #000;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            transition: opacity 0.3s;
        }
        .loading-text {
            font-size: 1.5rem;
            font-weight: 800;
            letter-spacing: 0.1em;
            display: flex;
            gap: 4px;
            color: #fff;
        }
        .loading-text span {
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        /* Fallback buttons */
        .apple-glass-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 9px 20px;
            background: rgba(255,255,255,0.07);
            border: 1px solid rgba(255,255,255,0.13);
            color: #ffffff; font-size: 12px; font-weight: 700;
            border-radius: 9999px; backdrop-filter: blur(20px);
            cursor: pointer; letter-spacing: 0.02em;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .apple-glass-btn:hover { background: rgba(255,255,255,0.16); border-color: rgba(255,255,255,0.25); transform: scale(1.04); }
        /* Legacy aliases used by JS */
        .apple-tv-ambient-glow { display: none; }
        .apple-tv-loading-card { display: contents; }
        .apple-spinner-wrapper,.apple-spinner-outer,.apple-spinner-inner,.apple-spinner-core { display: none; }
        .apple-badge { font-size:9px;font-weight:900;letter-spacing:0.1em;color:rgba(255,255,255,0.65);background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.13);padding:3px 9px;border-radius:5px;backdrop-filter:blur(8px); }
        .apple-status-ticker { display: none !important; }
        .apple-status-dot,.apple-badge { display: none; }
        @keyframes appleDotPulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        /* Apple TV Floating HUD Indicator */
        #zoom-indicator {
            position: absolute;
            top: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(18, 18, 24, 0.85);
            color: #fff;
            padding: 0.55rem 1.4rem;
            border-radius: 9999px;
            font-size: 0.825rem;
            font-weight: 700;
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(25px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s;
            z-index: 10000;
        }
        /* Apple TV Skip Intro Pill Button */
        .apple-skip-btn {
            position: absolute;
            bottom: 85px;
            right: 25px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(20, 20, 26, 0.82);
            border: 1px solid rgba(255, 255, 255, 0.22);
            color: #ffffff;
            padding: 10px 22px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 13px;
            cursor: pointer;
            backdrop-filter: blur(25px);
            box-shadow: 0 12px 35px rgba(0, 0, 0, 0.65), 0 0 20px rgba(255, 255, 255, 0.08);
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s, box-shadow 0.2s;
        }
        .apple-skip-btn:hover {
            transform: scale(1.05);
            background: rgba(255, 255, 255, 0.18);
            border-color: rgba(255, 255, 255, 0.4);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(255, 255, 255, 0.15);
        }
        .apple-skip-btn:active {
            transform: scale(0.97);
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
        /* Modern Cinematic Screen Stop (Pause State) Animation */
        #screen-stop-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.92);
            opacity: 0;
            pointer-events: none;
            z-index: 9998;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 22px 30px;
            border-radius: 24px;
            background: linear-gradient(145deg, rgba(14, 14, 20, 0.90), rgba(6, 6, 10, 0.95));
            border: 1px solid rgba(255, 255, 255, 0.14);
            box-shadow: 0 30px 70px rgba(0, 0, 0, 0.9), 0 0 40px rgba(220, 38, 38, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
            transition: opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1), transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            user-select: none;
            min-width: 230px;
            max-width: 90vw;
        }
        #screen-stop-overlay.active {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
            pointer-events: auto;
        }
        #screen-stop-overlay.resuming {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.1);
            pointer-events: none;
        }
        .screen-stop-ring {
            position: relative;
            width: 62px;
            height: 62px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(239, 68, 68, 0.32) 0%, rgba(239, 68, 68, 0.08) 65%, transparent 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid rgba(239, 68, 68, 0.6);
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
            transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.25s;
        }
        #screen-stop-overlay:hover .screen-stop-ring {
            transform: scale(1.08);
            border-color: rgba(239, 68, 68, 0.9);
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.6);
        }
        .screen-stop-ring::before {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            border: 1px dashed rgba(255, 255, 255, 0.22);
            animation: spinStopRing 16s linear infinite;
        }
        .screen-stop-ring::after {
            content: '';
            position: absolute;
            inset: -12px;
            border-radius: 50%;
            border: 1px solid rgba(239, 68, 68, 0.15);
            animation: pulseStopRing 2.4s ease-out infinite;
        }
        @keyframes spinStopRing {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes pulseStopRing {
            0% { transform: scale(0.92); opacity: 0.8; }
            50% { transform: scale(1.08); opacity: 0.2; }
            100% { transform: scale(0.92); opacity: 0.8; }
        }
        .stop-equalizer-bars {
            display: flex;
            align-items: center;
            gap: 2.5px;
            height: 12px;
        }
        .stop-equalizer-bar {
            width: 2px;
            background: #ef4444;
            border-radius: 9999px;
            opacity: 0.85;
            animation: eqFreeze 1.6s ease-in-out infinite alternate;
        }
        .stop-equalizer-bar:nth-child(1) { height: 5px; animation-delay: 0s; }
        .stop-equalizer-bar:nth-child(2) { height: 11px; animation-delay: 0.2s; }
        .stop-equalizer-bar:nth-child(3) { height: 7px; animation-delay: 0.4s; }
        .stop-equalizer-bar:nth-child(4) { height: 12px; animation-delay: 0.1s; }
        .stop-equalizer-bar:nth-child(5) { height: 6px; animation-delay: 0.3s; }
        @keyframes eqFreeze {
            0% { transform: scaleY(0.6); opacity: 0.5; }
            100% { transform: scaleY(1); opacity: 0.95; }
        }
        /* Mobile-exclusive compact pause animation and HUD styling */
        @media (max-width: 768px), (pointer: coarse) {
            #screen-stop-overlay {
                padding: 10px 16px !important;
                border-radius: 16px !important;
                gap: 6px !important;
                min-width: unset !important;
                max-width: 85vw !important;
                box-shadow: 0 12px 35px rgba(0, 0, 0, 0.8), 0 0 20px rgba(220, 38, 38, 0.2) !important;
            }
            .screen-stop-ring {
                width: 38px !important;
                height: 38px !important;
                border-width: 1px !important;
            }
            .screen-stop-ring svg {
                width: 16px !important;
                height: 16px !important;
            }
            .screen-stop-ring::before {
                inset: -3px !important;
            }
            .screen-stop-ring::after {
                inset: -6px !important;
            }
            #screen-stop-overlay span.text-red-400 {
                font-size: 8px !important;
                padding: 2px 8px !important;
            }
            #stop-overlay-title {
                font-size: 11px !important;
                max-width: 200px !important;
            }
            #screen-stop-overlay p {
                display: none !important;
            }
            .plyr__control--overlaid {
                width: 44px !important;
                height: 44px !important;
                min-width: 44px !important;
                min-height: 44px !important;
                padding: 10px !important;
                border-radius: 50% !important;
                background: rgba(18, 18, 24, 0.82) !important;
                border: 1px solid rgba(255, 255, 255, 0.22) !important;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 10px rgba(239, 68, 68, 0.25) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                transform: translate(-50%, -50%) scale(0.9) !important;
                transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease !important;
            }
            .plyr__control--overlaid:active {
                transform: translate(-50%, -50%) scale(0.8) !important;
            }
            .plyr__control--overlaid svg {
                width: 16px !important;
                height: 16px !important;
                margin-left: 2px !important;
            }
            #zoom-indicator {
                top: 0.75rem !important;
                padding: 0.25rem 0.75rem !important;
                font-size: 0.72rem !important;
            }
            #gesture-ripple {
                width: 52px !important;
                height: 52px !important;
                font-size: 0.8rem !important;
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
        /* Smooth, anti-flicker control bar transitions on touch, mouse & mobile */
        .plyr__controls {
            background: transparent !important;
            padding: 1.25rem 1rem !important;
            transition: opacity 0.25s ease, transform 0.25s ease !important;
            will-change: opacity, transform;
            -webkit-tap-highlight-color: transparent !important;
            z-index: 99999 !important;
            pointer-events: auto !important;
        }
        .plyr__controls * {
            pointer-events: auto !important;
        }
        .plyr__controls button,
        .plyr__control {
            opacity: 1 !important;
            color: #ffffff !important;
            background: rgba(20, 20, 28, 0.92) !important;
            border: 1px solid rgba(255, 255, 255, 0.22) !important;
            border-radius: 9999px !important;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6) !important;
            pointer-events: auto !important;
            cursor: pointer !important;
        }
        .plyr__controls button:hover,
        .plyr__control:hover {
            background: rgba(239, 68, 68, 0.95) !important;
            border-color: rgba(255, 255, 255, 0.5) !important;
            transform: scale(1.08) !important;
        }
        .plyr--hide-controls .plyr__controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(12px) !important;
        }
        .plyr--hide-controls #top-controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(-12px) !important;
        }
        /* Reveal controls instantly on mouse hover, tap, focus, or interaction */
        .plyr:hover .plyr__controls,
        .plyr:focus-within .plyr__controls,
        .plyr.plyr--hover .plyr__controls,
        #player-container:hover .plyr__controls {
            opacity: 1 !important;
            pointer-events: auto !important;
            transform: translateY(0) !important;
        }
        .plyr:hover #top-controls,
        .plyr:focus-within #top-controls,
        .plyr.plyr--hover #top-controls,
        #player-container:hover #top-controls {
            opacity: 1 !important;
            pointer-events: auto !important;
            transform: translateY(0) !important;
        }
        #top-controls {
            position: absolute !important;
            top: 1rem !important;
            left: 1rem !important;
            right: 1rem !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            gap: 0.75rem !important;
            pointer-events: auto !important;
            transition: opacity 0.25s ease, transform 0.25s ease !important;
            will-change: opacity, transform;
            -webkit-tap-highlight-color: transparent !important;
            z-index: 99999 !important;
        }
        #top-controls * {
            pointer-events: auto !important;
        }
        @media (min-width: 640px) {
            #top-controls {
                top: 1.5rem !important;
                left: 1.5rem !important;
                right: 1.5rem !important;
            }
        }
        #top-controls button {
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            width: 2.75rem !important;
            height: 2.75rem !important;
            min-width: 2.75rem !important;
            min-height: 2.75rem !important;
            padding: 0 !important;
            border-radius: 9999px !important;
            background: rgba(18, 18, 24, 0.9) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            flex-shrink: 0 !important;
            pointer-events: auto !important;
        }
        #top-controls button:hover {
            background: rgba(239, 68, 68, 0.95) !important;
            border-color: rgba(255, 255, 255, 0.6) !important;
            transform: scale(1.08) !important;
        }
        #top-controls button:active {
            transform: scale(0.95) !important;
        }
        #top-controls .title-pill {
            display: inline-flex !important;
            align-items: center !important;
            gap: 0.5rem !important;
            padding: 0.5rem 1rem !important;
            border-radius: 9999px !important;
            background: rgba(18, 18, 24, 0.9) !important;
            color: #ffffff !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            box-shadow: 0 4px 18px rgba(0, 0, 0, 0.7) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            font-size: 0.8125rem !important;
            font-weight: 700 !important;
            max-width: min(320px, 50vw) !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
        }
        /* Live Stream Timeline & Timestamp Optimization: Clean presentation without / 00:00 */
        .is-live-stream .plyr__time--duration,
        .plyr--is-live .plyr__time--duration {
            display: none !important;
            visibility: hidden !important;
            width: 0 !important;
        }
        .is-live-stream .plyr__time--current::after,
        .plyr--is-live .plyr__time--current::after {
            display: none !important;
            content: "" !important;
        }
        .is-live-stream .plyr__time--current,
        .plyr--is-live .plyr__time--current {
            padding-right: 4px !important;
            font-variant-numeric: tabular-nums !important;
        }
        /* Clean HLS Embed Mode: Hide timeline/timestamps, keep all other controls present and balanced */
        .hls-embed-active .plyr__progress,
        .hls-embed-active .plyr__time,
        .hls-embed-active .plyr__progress__container {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        .hls-embed-active .plyr__controls {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-start !important;
            z-index: 50 !important;
            transition: opacity 0.3s ease, transform 0.3s ease !important;
        }
        .hls-embed-active.plyr--hide-controls .plyr__controls,
        .hls-embed-active .plyr--hide-controls .plyr__controls,
        .plyr--hide-controls .plyr__controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(14px) !important;
        }
        .hls-embed-active.plyr--hide-controls #top-controls,
        .hls-embed-active .plyr--hide-controls #top-controls,
        .plyr--hide-controls #top-controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(-14px) !important;
        }
        .hls-embed-active .plyr__controls > [data-plyr="play"],
        .hls-embed-active .plyr__controls > [data-plyr="pause"],
        .hls-embed-active .plyr__controls > [data-plyr="mute"],
        .hls-embed-active .plyr__controls > .plyr__volume,
        .hls-embed-active .plyr__controls > [data-plyr="rewind"],
        .hls-embed-active .plyr__controls > [data-plyr="fast-forward"],
        .hls-embed-active .plyr__controls > .plyr__progress__container,
        .hls-embed-active .plyr__controls > .plyr__time,
        .hls-embed-active .plyr__controls > [data-plyr="live-edge"] {
            display: none !important;
        }
        .hls-embed-active video#player {
            opacity: 0 !important;
            pointer-events: none !important;
        }
        .hls-embed-active .plyr__video-wrapper {
            position: relative !important;
            overflow: hidden !important;
            background: #000000 !important;
        }
        .hls-embed-active #hls-cropped-container {
            display: flex !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 10 !important;
            background: #000000 !important;
            overflow: hidden !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .hls-embed-active #hls-secondary-container {
            display: flex !important;
            position: absolute !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 10 !important;
            background: #000000 !important;
            overflow: hidden !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .hls-embed-active #top-controls {
            z-index: 50 !important;
        }
        #embed-zoom-controls {
            display: none !important;
            transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .hls-embed-active #embed-zoom-controls {
            display: flex !important;
        }
        .plyr--hide-controls #top-controls,
        .hls-embed-active.plyr--hide-controls #top-controls,
        .hls-embed-active .plyr--hide-controls #top-controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(-14px) !important;
            transition: opacity 0.35s ease, transform 0.35s ease !important;
        }
        .plyr--hide-controls .plyr__controls,
        .hls-embed-active.plyr--hide-controls .plyr__controls,
        .hls-embed-active .plyr--hide-controls .plyr__controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(14px) !important;
            transition: opacity 0.35s ease, transform 0.35s ease !important;
        }
        .plyr--hide-controls #embed-zoom-controls,
        .hls-embed-active.plyr--hide-controls #embed-zoom-controls,
        .hls-embed-active .plyr--hide-controls #embed-zoom-controls {
            opacity: 0 !important;
            pointer-events: none !important;
            transform: translateY(14px) !important;
            transition: opacity 0.35s ease, transform 0.35s ease !important;
        }
    </style>
    <link rel="icon" type="image/png" href="stalker_pro_infinity.svg">
    <link rel="stylesheet" href="assets/local-ai.css?v=2.0">
</head>
<body>
    <!-- 3-Second Seamless Black Curtain for Instant Embed / Geoblock Transition -->
    <div id="hls-embed-curtain" class="hidden fixed inset-0 z-[100] bg-black transition-opacity duration-700 pointer-events-auto flex flex-col items-center justify-center select-none">
        <div class="relative flex flex-col items-center">
            <div class="w-12 h-12 rounded-full border-2 border-white/20 border-t-red-500 animate-spin mb-4"></div>
            <p id="hls-curtain-text" class="text-sm font-semibold tracking-wide text-zinc-300">Connecting direct live stream...</p>
        </div>
    </div>

    <div id="loading">
        <div class="loading-text">
            <span style="animation-delay: 0s">L</span><span style="animation-delay: 0.1s">O</span><span style="animation-delay: 0.2s">A</span><span style="animation-delay: 0.3s">D</span><span style="animation-delay: 0.4s">I</span><span style="animation-delay: 0.5s">N</span><span style="animation-delay: 0.6s">G</span>
        </div>
        <div style="margin-top: 1rem; color: #888; font-size: 0.85rem;" id="apple-loading-status">
            Resolving feed...
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
        <!-- Modern Cinematic Broadcast Screen Stop (Pause State) Overlay -->
        <div id="screen-stop-overlay" class="group" title="Tap to Resume Playback">
            <div class="screen-stop-ring">
                <svg class="w-7 h-7 text-red-500 fill-current drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
                    <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
                </svg>
            </div>
            <div class="flex flex-col items-center text-center gap-1.5">
                <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></span>
                        BROADCAST PAUSED
                    </span>
                    <div class="stop-equalizer-bars" title="Audio / Visual Sync">
                        <span class="stop-equalizer-bar"></span>
                        <span class="stop-equalizer-bar"></span>
                        <span class="stop-equalizer-bar"></span>
                        <span class="stop-equalizer-bar"></span>
                        <span class="stop-equalizer-bar"></span>
                    </div>
                </div>
                <h4 id="stop-overlay-title" class="text-xs sm:text-sm font-extrabold text-white tracking-wide truncate max-w-[280px] drop-shadow leading-snug">Live Stream</h4>
                <p class="text-[10px] text-zinc-400 font-semibold tracking-wider flex items-center gap-1 group-hover:text-white transition-colors">
                    <span>Tap screen or press Space to resume</span>
                    <svg class="w-3 h-3 text-red-400 fill-current ml-0.5" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </p>
            </div>
        </div>
        <!-- Pure Video Screen Embed Iframe Cropped & Scaled to Container with Interactive Zoom -->
        <div id="hls-cropped-container" class="hidden absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center pointer-events-auto z-10">
            <div id="hls-viewport-scaler" style="width: 784px; height: 441px; position: relative; overflow: hidden; transform-origin: center center; flex-shrink: 0; background: #000; transition: transform 0.15s ease-out;">
                <iframe id="hls-demo-embed-frame" scrolling="no" class="border-0 bg-black select-none pointer-events-auto" style="position: absolute; top: -736px; left: -98px; width: 980px; height: 1400px; border: 0; overflow: hidden;" allow="autoplay; fullscreen; encrypted-media" title="Direct Video Stream"></iframe>
            </div>

            <!-- User Zoom & Position Controls Overlay for Embed Screen -->
            <div id="embed-zoom-controls" class="absolute bottom-16 sm:bottom-20 z-30 flex items-center gap-1.5 sm:gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-2xl transition-all select-none pointer-events-auto">
                <button type="button" onclick="window.adjustEmbedZoom(-0.1)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all" title="Zoom Out (-)">−</button>
                <button type="button" id="embed-zoom-mode-btn" onclick="window.toggleEmbedFitMode()" class="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-emerald-400 font-extrabold text-[11px] sm:text-xs cursor-pointer tracking-wider flex items-center gap-1 transition-all" title="Toggle Fit / Fill / 100%">
                    <span id="embed-zoom-label">FIT</span>
                </button>
                <button type="button" onclick="window.adjustEmbedZoom(0.1)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition-all" title="Zoom In (+)">+</button>
                <div class="w-px h-4 bg-white/20 mx-0.5"></div>
                <button type="button" onclick="window.adjustEmbedNudge(-6)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-zinc-300 flex items-center justify-center cursor-pointer transition-all" title="Nudge Up (Align Video)">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
                </button>
                <button type="button" onclick="window.adjustEmbedNudge(6)" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-white/25 active:scale-95 text-zinc-300 flex items-center justify-center cursor-pointer transition-all" title="Nudge Down">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <button type="button" onclick="window.resetEmbedZoom()" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/10 hover:bg-red-500/80 active:scale-95 text-zinc-400 hover:text-white flex items-center justify-center text-xs cursor-pointer transition-all" title="Reset Zoom & Position">↺</button>
            </div>
        </div>
        <!-- Secondary Pure Local r.html Embed Container -->
        <div id="hls-secondary-container" class="hidden absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center pointer-events-auto z-10">
            <iframe id="hls-secondary-embed-frame" scrolling="no" class="w-full h-full border-0 bg-black select-none pointer-events-auto" allow="autoplay; fullscreen; encrypted-media" title="Secondary Direct Video Stream (r.html)"></iframe>
        </div>
    </div>
    <!-- Sleep Timer Modal -->
    <div id="sleepModal" class="hidden fixed inset-0 z-[10001] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 transition-all">
        <div class="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl text-center relative flex flex-col max-h-[85vh] overflow-y-auto">
            <button onclick="closeSleepModal()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-zinc-300 flex items-center justify-center cursor-pointer transition-all shadow-lg active:scale-95" title="Close Sleep Timer">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/20 text-red-500">
                <i data-lucide="clock" class="w-6 h-6"></i>
            </div>
            <h3 class="text-lg font-bold text-white mb-1">Set Sleep Timer</h3>
            <p class="text-xs text-zinc-400 mb-5">Playback will pause automatically when timer expires.</p>
            <div class="grid grid-cols-2 gap-3 mb-5">
                <button onclick="setSleepTimer(15)" class="py-3 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700 active:scale-95">15 Minutes</button>
                <button onclick="setSleepTimer(30)" class="py-3 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700 active:scale-95">30 Minutes</button>
                <button onclick="setSleepTimer(45)" class="py-3 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700 active:scale-95">45 Minutes</button>
                <button onclick="setSleepTimer(60)" class="py-3 bg-zinc-800 hover:bg-red-600 hover:text-white text-zinc-300 font-bold text-xs rounded-xl transition-all border border-zinc-700 active:scale-95">60 Minutes</button>
            </div>
            <div class="flex gap-3">
                <button onclick="setSleepTimer(0)" class="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-xs rounded-xl transition-all active:scale-95">Turn Off</button>
                <button onclick="closeSleepModal()" class="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all active:scale-95">Cancel</button>
            </div>
        </div>
    </div>
    <!-- Apple TV+ Standard Audio & Language Modal -->
    <div id="audioModal" class="hidden fixed inset-0 z-[10002] bg-black/85 backdrop-blur-xl flex items-end sm:items-center justify-center p-2 sm:p-4 transition-all">
        <div class="bg-[#141419]/95 border border-white/15 rounded-t-3xl sm:rounded-[28px] p-5 sm:p-7 w-full max-w-md shadow-2xl backdrop-blur-3xl flex flex-col max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white shadow-inner">
                        <i data-lucide="headphones" class="w-5 h-5 text-white"></i>
                    </div>
                    <div>
                        <h3 class="text-base font-bold text-white tracking-tight">Audio & Languages</h3>
                        <p class="text-[11px] text-zinc-400 font-medium">Apple TV+ Spatial Audio & Dubbed Feeds</p>
                    </div>
                </div>
                <button onclick="closeAudioModal()" class="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 shrink-0" title="Close Audio Menu">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="audio-tracks-list" class="space-y-2.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                <p class="text-xs text-zinc-500 text-center py-4">Standard Default Audio Active</p>
            </div>
        </div>
    </div>
    <!-- Subtitles Modal with Visual & Sync Controller -->
    <div id="subtitleModal" class="hidden fixed inset-0 z-[10002] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4">
        <div class="bg-[#141419]/95 border border-white/10 rounded-[28px] p-5 sm:p-6 w-full max-w-lg shadow-[0_30px_80px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh]">
            <div class="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div class="flex items-center gap-2.5">
                    <div class="w-9 h-9 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                        <i data-lucide="subtitles" class="w-5 h-5"></i>
                    </div>
                    <div>
                        <h3 class="text-sm sm:text-base font-bold text-white leading-tight">Subtitles & Visual Controller</h3>
                        <p class="text-[11px] text-zinc-400">Captions track selector, typography & audio sync</p>
                    </div>
                </div>
                <button onclick="closeSubtitleModal()" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-zinc-400 hover:text-white transition cursor-pointer">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <!-- Tabs: Tracks vs Visual Appearance -->
            <div class="flex rounded-xl bg-white/5 p-1 mb-3">
                <button id="sub-tab-tracks" type="button" onclick="window.switchSubTab('tracks')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-red-600 text-white shadow cursor-pointer">
                    Language Tracks
                </button>
                <button id="sub-tab-visual" type="button" onclick="window.switchSubTab('visual')" class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-zinc-400 hover:text-white cursor-pointer">
                    Visual & Audio Sync
                </button>
            </div>

            <!-- Tab 1: Tracks List -->
            <div id="sub-tab-content-tracks" class="flex-1 flex flex-col min-h-0">
                <div id="subtitle-tracks-list" class="space-y-1.5 max-h-56 overflow-y-auto mb-3 pr-1 custom-scrollbar flex-1">
                    <p class="text-xs text-zinc-500 text-center py-2">No embedded captions found</p>
                </div>
                <div class="border-t border-white/10 pt-3 mt-auto">
                    <label class="block text-[11px] font-semibold text-zinc-400 mb-1.5">Upload Custom Subtitles (.srt, .vtt)</label>
                    <input type="file" id="sub-file-input" accept=".srt,.vtt" class="block w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"/>
                </div>
            </div>

            <!-- Tab 2: Visual Controller & Audio Sync -->
            <div id="sub-tab-content-visual" class="hidden flex-1 overflow-y-auto pr-1 space-y-3.5 custom-scrollbar">
                <!-- Live Preview Card -->
                <div class="p-3 bg-black/60 rounded-2xl border border-white/10 text-center">
                    <div class="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-2">Live Preview</div>
                    <div id="sub-preview-box" class="py-2.5 px-3 rounded-lg inline-block transition-all" style="font-size: var(--sub-font-size, 1.15rem); color: var(--sub-color, #ffffff); background-color: var(--sub-bg, rgba(0,0,0,0.78)); text-shadow: var(--sub-shadow, 0 2px 4px rgba(0,0,0,0.95)); font-weight: 600;">
                        The quick brown fox jumps over the lazy dog
                    </div>
                </div>

                <!-- Font Size Controls -->
                <div>
                    <label class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Font Size</label>
                    <div class="grid grid-cols-4 gap-1.5">
                        <button type="button" onclick="window.setSubtitleFontSize('0.85rem')" id="sub-font-small" class="sub-font-btn py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer">75% Small</button>
                        <button type="button" onclick="window.setSubtitleFontSize('1.15rem')" id="sub-font-medium" class="sub-font-btn py-1.5 px-2 bg-red-600 text-white rounded-xl text-xs font-semibold transition cursor-pointer">100% Normal</button>
                        <button type="button" onclick="window.setSubtitleFontSize('1.45rem')" id="sub-font-large" class="sub-font-btn py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer">125% Large</button>
                        <button type="button" onclick="window.setSubtitleFontSize('1.75rem')" id="sub-font-xlarge" class="sub-font-btn py-1.5 px-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-zinc-300 transition cursor-pointer">150% Huge</button>
                    </div>
                </div>

                <!-- Text Color Controls -->
                <div>
                    <label class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Text Color</label>
                    <div class="grid grid-cols-4 gap-2">
                        <button type="button" onclick="window.setSubtitleColor('#ffffff')" class="sub-color-btn py-2 px-2 rounded-xl border border-white/20 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 transition cursor-pointer" data-color="#ffffff">
                            <span class="w-3.5 h-3.5 rounded-full bg-white border border-black/30"></span> White
                        </button>
                        <button type="button" onclick="window.setSubtitleColor('#facc15')" class="sub-color-btn py-2 px-2 rounded-xl border border-yellow-400/30 flex items-center justify-center gap-1.5 text-xs font-bold text-yellow-300 bg-yellow-400/10 hover:bg-yellow-400/20 transition cursor-pointer" data-color="#facc15">
                            <span class="w-3.5 h-3.5 rounded-full bg-yellow-400"></span> Yellow
                        </button>
                        <button type="button" onclick="window.setSubtitleColor('#38bdf8')" class="sub-color-btn py-2 px-2 rounded-xl border border-sky-400/30 flex items-center justify-center gap-1.5 text-xs font-bold text-sky-300 bg-sky-400/10 hover:bg-sky-400/20 transition cursor-pointer" data-color="#38bdf8">
                            <span class="w-3.5 h-3.5 rounded-full bg-sky-400"></span> Cyan
                        </button>
                        <button type="button" onclick="window.setSubtitleColor('#4ade80')" class="sub-color-btn py-2 px-2 rounded-xl border border-emerald-400/30 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-400/10 hover:bg-emerald-400/20 transition cursor-pointer" data-color="#4ade80">
                            <span class="w-3.5 h-3.5 rounded-full bg-emerald-400"></span> Green
                        </button>
                    </div>
                </div>

                <!-- Background Style -->
                <div>
                    <label class="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">Background & Outline</label>
                    <div class="grid grid-cols-3 gap-2">
                        <button type="button" onclick="window.setSubtitleBg('rgba(0, 0, 0, 0.78)')" id="sub-bg-translucent" class="sub-bg-btn py-2 px-2 rounded-xl bg-white/20 border border-white/40 text-xs font-bold text-white transition cursor-pointer">
                            Translucent
                        </button>
                        <button type="button" onclick="window.setSubtitleBg('#000000')" id="sub-bg-solid" class="sub-bg-btn py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition cursor-pointer">
                            Solid Black
                        </button>
                        <button type="button" onclick="window.setSubtitleBg('transparent')" id="sub-bg-none" class="sub-bg-btn py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 transition cursor-pointer">
                            No Box (Shadow)
                        </button>
                    </div>
                </div>

                <!-- Live Audio/Subtitle Timing Sync Stepper -->
                <div class="p-3 bg-white/5 rounded-2xl border border-white/10">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-[11px] font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                            <i data-lucide="timer" class="w-3.5 h-3.5 text-red-400"></i> Audio / Subtitle Sync Offset
                        </span>
                        <span id="sub-offset-display" class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold">
                            0.00s (Synced)
                        </span>
                    </div>
                    <p class="text-[10px] text-zinc-400 mb-2.5">Delay or advance subtitle text timing to match spoken voice</p>
                    <div class="grid grid-cols-5 gap-1.5">
                        <button type="button" onclick="window.adjustSubtitleSync(-1.0)" class="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer">-1.0s</button>
                        <button type="button" onclick="window.adjustSubtitleSync(-0.25)" class="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer">-0.25s</button>
                        <button type="button" onclick="window.resetSubtitleSync()" class="py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition cursor-pointer">Reset 0s</button>
                        <button type="button" onclick="window.adjustSubtitleSync(0.25)" class="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer">+0.25s</button>
                        <button type="button" onclick="window.adjustSubtitleSync(1.0)" class="py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition cursor-pointer">+1.0s</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- 4K & 8K Resolution Quality Selector Modal -->
    <div id="qualityModal" class="hidden fixed inset-0 z-[10002] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 transition-all">
        <div class="bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col max-h-[85vh] overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-base font-bold text-white flex items-center gap-2">
                    <i data-lucide="sparkles" class="w-5 h-5 text-red-500"></i> Stream Quality (4K/8K)
                </h3>
                <button onclick="closeQualityModal()" class="w-10 h-10 rounded-full bg-white/10 hover:bg-red-600 hover:text-white border border-white/20 text-zinc-200 flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 shrink-0" title="Close Quality Menu">
                    <i data-lucide="x" class="w-5 h-5"></i>
                </button>
            </div>
            <div id="quality-tracks-list" class="space-y-2 max-h-60 overflow-y-auto pr-1">
                <p class="text-xs text-zinc-500 text-center py-4">Detecting video resolution levels...</p>
            </div>
        </div>
    </div>

    <!-- Live Stream Error Overlay -->
    <div id="player-error" class="hidden fixed inset-0 z-[10001] bg-black/95 flex flex-col items-center justify-center p-6 text-center">
        <div class="max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            <div class="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20 text-red-500">
                <i data-lucide="tv" class="w-8 h-8 animate-pulse"></i>
            </div>
            <h3 class="text-xl font-bold text-white mb-2">Live Stream Notice</h3>
            <p id="error-message-text" class="text-zinc-400 text-xs sm:text-sm mb-5 leading-relaxed">The live broadcast feed is geo-restricted or buffering. You can launch VLC Player directly or reconnect.</p>
            
            <div class="flex flex-col gap-2 w-full">
                <!-- Direct HLS Embed Action Button -->
                <button onclick="window.loadHlsDemoEmbed()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <i data-lucide="globe" class="w-4 h-4"></i> Switch to Official HLS Embed (Bypass Geoblock)
                </button>
                <!-- Secondary Local r.html Embed Button -->
                <button onclick="window.loadSecondaryHlsEmbed()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <i data-lucide="sparkles" class="w-4 h-4"></i> Switch to Secondary Embed (Pure Local r.html)
                </button>
                <!-- Direct VLC Action Button -->
                <a id="vlc-direct-btn" href="#" target="_blank" class="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.84L18.5 17H5.5L12 5.84zM12 8l-3.5 6h7L12 8z"/></svg> ⚡ Open in VLC Player (Smooth)
                </a>
                <button onclick="copyVlcStreamLink()" class="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium text-xs rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-2 cursor-pointer active:scale-95">
                    <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copy Stream URL for VLC / TiviMate
                </button>
                <div class="flex gap-2 w-full mt-1">
                    <button onclick="triggerAutoReconnect()" class="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer">
                        <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Retry Web
                    </button>
                    <button onclick="window.history.back()" class="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-medium text-xs rounded-xl transition-all border border-zinc-700 flex items-center justify-center gap-1.5 cursor-pointer">
                        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i> Back
                    </button>
                </div>
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
            let src = "<?php echo htmlspecialchars($stream_url); ?>";
            let name = "<?php echo htmlspecialchars($name); ?>";
            let source = "<?php echo htmlspecialchars($source); ?>";
            const urlParams = new URLSearchParams(window.location.search);
            if (!src || src.startsWith('<?php') || src.startsWith('{{')) {
                src = urlParams.get('url') || urlParams.get('stream') || '';
                const chParam = urlParams.get('channel_id') || urlParams.get('id') || urlParams.get('channel') || '';
                if (!src && chParam) {
                    if (chParam.startsWith('tim_') || chParam.startsWith('tim-')) {
                        src = `/api/play_stream/${chParam}`;
                    } else {
                        src = chParam;
                    }
                }
            }
            if (!name || name.startsWith('<?php') || name.startsWith('{{')) {
                name = urlParams.get('name') || urlParams.get('title') || 'Live Stream';
            }
            if (!source || source.startsWith('<?php') || source.startsWith('{{')) {
                source = urlParams.get('source') || 'consumet.html';
            }
            window.currentStreamId = urlParams.get('channel_id') || urlParams.get('id') || urlParams.get('stream_id') || urlParams.get('streamId') || urlParams.get('channel') || '';
            function ensureProxiedSportsUrl(u) {
                if (urlParams.get('direct') === '1' || urlParams.get('raw') === '1') return u;
                if (!u) return u;
                // Unwrap any nested proxy query strings if present
                if (u.includes('stream_proxy.php?url=') || u.includes('/api/proxy/fancode?url=') || u.includes('/api/proxy/sonyliv?url=')) {
                    const m = u.match(/[?&]url=([^&]+)/);
                    if (m) {
                        try { u = decodeURIComponent(m[1]).trim(); } catch(e){}
                    }
                }
                const lower = u.toLowerCase();
                const isFanCode = lower.includes('in-mc-flive.fancode.com') ||
                                  lower.includes('in-ak-flive') ||
                                  lower.includes('fancode.com') ||
                                  lower.includes('fancode');
                const isSony = lower.includes('sonydaimenew') ||
                               lower.includes('sonymtmnew') ||
                               lower.includes('akamaized.net') || 
                               lower.includes('sonyliv') ||
                               lower.includes('slivcdn') ||
                               lower.includes('dishmt') ||
                               lower.includes('sony');

                if (isFanCode) {
                    if (!u.startsWith('https://proxy-web-sage.vercel.app/api/live-proxy?url=')) {
                        return `https://proxy-web-sage.vercel.app/api/live-proxy?url=${u}`;
                    }
                    return u;
                }
                if (isSony) {
                    if (!u.startsWith('/live.php') && !u.startsWith('/stream_proxy.php')) {
                        if (u.includes('sonydaimenew.akamaized.net')) {
                            u = u.replace(/sonydaimenew\.akamaized\.net/g, 'sonymtmnew.akamaized.net');
                        }
                        return `/live.php?url=${encodeURIComponent(u)}`;
                    }
                    return u;
                }

                if (u.startsWith('/api/proxy/') || u.startsWith('/live.php') || u.startsWith('/stream_proxy.php') || u.includes('live.php')) return u;
                if (lower.includes('junksonus.party') || lower.includes('justkidding') || lower.includes('tiktokcdn') || lower.includes('exmxbxe') || lower.includes('timst')) {
                    return `/live.php?url=${encodeURIComponent(u)}`;
                }
                const customUa = urlParams.get('ua') || urlParams.get('user-agent') || '';
                const customRef = urlParams.get('ref') || urlParams.get('referer') || '';
                
                let extraParams = '';
                if (customUa) extraParams += `&user-agent=${encodeURIComponent(customUa)}`;
                if (customRef) extraParams += `&referer=${encodeURIComponent(customRef)}`;

                if (window.location.protocol === 'https:' && u.startsWith('http://')) {
                    return `/live.php?url=${encodeURIComponent(u)}${extraParams}`;
                }
                if (customUa || customRef) {
                    return `/live.php?url=${encodeURIComponent(u)}${extraParams}`;
                }
                return u;
            }
            if (!src) {
                src = urlParams.get('url') || urlParams.get('stream') || '';
                const fallbackCh = urlParams.get('channel_id') || urlParams.get('id') || urlParams.get('channel') || '';
                if (!src && fallbackCh) {
                    if (fallbackCh.startsWith('tim_') || fallbackCh.startsWith('tim-')) {
                        src = `/api/play_stream/${fallbackCh}`;
                    } else {
                        src = fallbackCh;
                    }
                }
            }
            src = ensureProxiedSportsUrl(src);
            if (!name || name === 'Live Stream' || name === 'Live Channel') {
                name = urlParams.get('name') || urlParams.get('title') || name;
            }
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
                zoomIndicator.innerHTML = `<span class="flex items-center gap-2">${text}</span>`;
                zoomIndicator.style.opacity = '1';
                zoomIndicator.style.transform = 'translateX(-50%) translateY(6px)';
                setTimeout(() => { 
                    zoomIndicator.style.opacity = '0';
                    zoomIndicator.style.transform = 'translateX(-50%) translateY(0)';
                }, 2400);
            }

            function setAppleLoadingStatus(msg) {
                const el = document.getElementById('apple-loading-status');
                if (el) el.textContent = msg;
            }

            function hideLoadingScreen() {
                if (!loading || loading.style.display === 'none') return;
                setAppleLoadingStatus('Ready • Starting Playback...');
                loading.style.opacity = '0';
                loading.style.pointerEvents = 'none';
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 550);
            }

            if (video) {
                video.addEventListener('playing', () => { hideLoadingScreen(); });
                video.addEventListener('canplay', () => { hideLoadingScreen(); });
                video.addEventListener('loadeddata', () => { hideLoadingScreen(); });
            }

            function formatTimeMinutes(sec) {
                if (!sec || isNaN(sec)) return '0:00';
                const m = Math.floor(sec / 60);
                const s = Math.floor(sec % 60);
                return `${m}:${s < 10 ? '0' : ''}${s}`;
            }

            function toggleAspectRatio() {
                aspectState = (aspectState + 1) % aspectModes.length;
                video.classList.remove('fit-cover', 'fit-fill', 'zoom-120');
                let objFit = 'contain';
                if (aspectState === 1) { video.classList.add('fit-cover'); objFit = 'cover'; }
                else if (aspectState === 2) { video.classList.add('fit-fill'); objFit = 'fill'; }
                else if (aspectState === 3) { video.classList.add('zoom-120'); objFit = 'cover'; }
                const frame = document.getElementById('hls-demo-embed-frame');
                if (frame && frame.contentWindow) {
                    frame.contentWindow.postMessage({ action: 'setAspect', aspect: objFit }, '*');
                }
                const container = document.getElementById('player-container');
                if (container && container.classList.contains('hls-embed-active')) {
                    if (aspectState === 0) { window._embedFitMode = 'fit'; window._embedZoomMultiplier = 1.0; }
                    else if (aspectState === 1) { window._embedFitMode = 'fill'; window._embedZoomMultiplier = 1.0; }
                    else if (aspectState === 2) { window._embedFitMode = 'fill'; window._embedZoomMultiplier = 1.15; }
                    else if (aspectState === 3) { window._embedFitMode = 'fit'; window._embedZoomMultiplier = 1.25; }
                    if (window.resizeHlsViewport) window.resizeHlsViewport();
                }
                showIndicator(`<i data-lucide="scan" class="w-4 h-4 text-red-400"></i> Aspect Mode: ${aspectModes[aspectState]}`);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }

            // Apple TV+ Standard Audio & Language Modal
            window.toggleAudioModal = function() {
                const modal = document.getElementById('audioModal');
                const list = document.getElementById('audio-tracks-list');
                list.innerHTML = '';
                const video = document.getElementById('player');
                let internalAdded = false;
                
                // 1. Internal HLS Master Audio Tracks (Direct Multi-Audio Streams)
                if (window.hls && window.hls.audioTracks && window.hls.audioTracks.length > 0) {
                    internalAdded = true;
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 mt-1 px-2 flex items-center justify-between';
                    groupTitle.innerHTML = `<span>Master HLS Audio Tracks</span> <span class="text-[9px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full font-mono">${window.hls.audioTracks.length}</span>`;
                    list.appendChild(groupTitle);
                    
                    window.hls.audioTracks.forEach((track, idx) => {
                        const isActive = window.hls.audioTrack === idx;
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all mb-1.5 ${isActive ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg shadow-red-500/25 border border-white/20' : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5'}`;
                        const label = track.name || track.lang || ('Track ' + (idx + 1));
                        
                        // Apple TV Style Audio Format Badges
                        let badge = 'STEREO';
                        if (track.name && (track.name.includes('5.1') || track.name.includes('Surround'))) badge = 'DOLBY 5.1';
                        else if (track.name && track.name.includes('Atmos')) badge = 'DOLBY ATMOS';
                        else if (idx === 0) badge = 'ORIGINAL';

                        btn.innerHTML = `
                            <div class="flex items-center gap-2.5">
                                <i data-lucide="volume-2" class="w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}"></i>
                                <span>${label}</span>
                                <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400 border border-white/10'}">${badge}</span>
                            </div>
                            ${isActive ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}
                        `;
                        btn.onclick = () => {
                            try {
                                if (window.hls) {
                                    window.hls.audioTrack = idx;
                                    const cur = video ? video.currentTime : 0;
                                    // Instant buffer flush for audio so user does not wait 30s for stale audio buffer
                                    try {
                                        if (typeof Hls !== 'undefined' && Hls.Events && Hls.Events.BUFFER_FLUSHING) {
                                            window.hls.trigger(Hls.Events.BUFFER_FLUSHING, { startOffset: cur, endOffset: Infinity, type: 'audio' });
                                        }
                                    } catch(flushErr) {
                                        console.warn('[HLS Audio Buffer Flush]', flushErr);
                                    }
                                    // Re-sync playhead
                                    if (video) {
                                        video.currentTime = cur;
                                        if (video.paused) video.play().catch(()=>{});
                                    }
                                }
                                // Synchronize native HTML5 audio tracks if available
                                if (video && video.audioTracks && video.audioTracks.length > idx) {
                                    for (let a = 0; a < video.audioTracks.length; a++) {
                                        video.audioTracks[a].enabled = (a === idx);
                                    }
                                }
                                showIndicator(`<i data-lucide="headphones" class="w-4 h-4 text-purple-400"></i> Audio: ${label} • ${badge}`);
                                if (typeof lucide !== 'undefined') lucide.createIcons();
                            } catch (e) {
                                console.warn('[Audio Track Switch Error]', e);
                            }
                            closeAudioModal();
                        };
                        list.appendChild(btn);
                    });
                }
                
                // 2. Multi-Source Dubbed Languages (Polaris s70 / Hakunaymatata)
                const languageSources = (window.bingrSources || []).filter(s => s.language || (s.label && s.label.includes('—')));
                if (languageSources.length > 0) {
                    if (internalAdded) {
                        const div = document.createElement('div');
                        div.className = 'h-px w-full bg-white/10 my-3';
                        list.appendChild(div);
                    }
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-2 px-2 flex items-center justify-between';
                    groupTitle.innerHTML = `<span>Dubbed Regional Feeds (Polaris)</span> <span class="text-[9px] text-zinc-400 bg-white/10 px-2 py-0.5 rounded-full font-mono">${languageSources.length}</span>`;
                    list.appendChild(groupTitle);
                    
                    const scrollBox = document.createElement('div');
                    scrollBox.className = 'max-h-60 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar';
                    
                    languageSources.forEach((srcObj, idx) => {
                        const btn = document.createElement('button');
                        const isActive = (src === srcObj.url);
                        btn.className = `w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isActive ? 'bg-gradient-to-r from-red-600 to-purple-600 text-white shadow-lg shadow-red-500/25 border border-white/20' : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5'}`;
                        const labelText = srcObj.language || srcObj.label || ('Language ' + (idx + 1));
                        
                        btn.innerHTML = `
                            <div class="flex items-center gap-2.5">
                                <i data-lucide="globe" class="w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-400'}"></i>
                                <span>${labelText}</span>
                                <span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/10 text-zinc-300 font-mono">${srcObj.quality || '1080p'}</span>
                                <span class="text-[9px] font-bold text-amber-400 uppercase bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">DUB</span>
                            </div>
                            ${isActive ? '<i data-lucide="check" class="w-4 h-4 text-white"></i>' : ''}
                        `;
                        
                        // Apple TV Seamless Audio Switch with Playhead & State Preservation
                        btn.onclick = async () => {
                            const curTime = (window.plyrPlayer && typeof window.plyrPlayer.currentTime === 'number') 
                                ? window.plyrPlayer.currentTime 
                                : ((window.player && typeof window.player.currentTime === 'number') 
                                    ? window.player.currentTime 
                                    : (video ? video.currentTime : 0));
                            const wasPlaying = video && !video.paused;
                            const timeFmt = formatTimeMinutes(curTime);

                            showIndicator(`<i data-lucide="sparkles" class="w-4 h-4 text-purple-400"></i> Switching to ${labelText} (Resuming at ${timeFmt})...`);
                            if (typeof lucide !== 'undefined') lucide.createIcons();
                            closeAudioModal();

                            src = srcObj.url;
                            if (window.hls) {
                                try { window.hls.destroy(); video.src = ''; video.load(); } catch(e){}
                                window.hls = null;
                            }
                            if (typeof window.destroyMpegPlayer === 'function') window.destroyMpegPlayer();
                            initPlayer();

                            // Seamless Playhead & State Restoration with single-fire guard
                            let resumed = false;
                            const onResume = () => {
                                if (resumed) return;
                                resumed = true;
                                video.removeEventListener('loadedmetadata', onResume);
                                video.removeEventListener('canplay', onResume);
                                if (curTime > 0) {
                                    try {
                                        if (window.plyrPlayer) window.plyrPlayer.currentTime = curTime;
                                        if (window.player) window.player.currentTime = curTime;
                                        if (video) video.currentTime = curTime;
                                    } catch(e){}
                                }
                                if (wasPlaying && video && video.paused) {
                                    video.play().catch(()=>{});
                                }
                                showIndicator(`<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400"></i> Audio: ${labelText} • Resumed at ${timeFmt}`);
                                if (typeof lucide !== 'undefined') lucide.createIcons();
                            };
                            video.addEventListener('loadedmetadata', onResume, { once: true });
                            video.addEventListener('canplay', onResume, { once: true });

                        };
                        scrollBox.appendChild(btn);
                    });
                    list.appendChild(scrollBox);
                }

                if (list.innerHTML === '') {
                    list.innerHTML = `
                        <div class="py-6 text-center space-y-2">
                            <div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                                <i data-lucide="volume-2" class="w-5 h-5"></i>
                            </div>
                            <p class="text-xs text-zinc-300 font-bold">Standard Single Audio Stream Active</p>
                            <p class="text-[11px] text-zinc-500">Decoded with Apple TV Spatial Sound passthrough.</p>
                        </div>
                    `;
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
                const video = document.getElementById('player');
                let hasSubs = false;

                // 1. Off / Disable Button
                let anyActive = false;
                if (video && video.textTracks) {
                    for (let i = 0; i < video.textTracks.length; i++) {
                        if (video.textTracks[i].mode === 'showing') anyActive = true;
                    }
                }
                if (window.hls && window.hls.subtitleTrack !== -1) anyActive = true;

                const offBtn = document.createElement('button');
                offBtn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all mb-3 ${!anyActive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                offBtn.innerHTML = `<span>Off (Disable Subtitles)</span> ${!anyActive ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                offBtn.onclick = () => { 
                    if (window.hls) window.hls.subtitleTrack = -1; 
                    if (video && video.textTracks) {
                        for (let i = 0; i < video.textTracks.length; i++) {
                            video.textTracks[i].mode = 'disabled';
                        }
                    }
                    if (window.player) {
                        try { window.player.currentTrack = -1; } catch(e){}
                    }
                    showIndicator('Subtitles: Disabled');
                    closeSubtitleModal(); 
                };
                list.appendChild(offBtn);

                // 2. Internal HLS Subtitle Tracks
                if (window.hls && window.hls.subtitleTracks && window.hls.subtitleTracks.length > 0) {
                    hasSubs = true;
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 mt-1 px-2';
                    groupTitle.textContent = 'Embedded HLS Captions';
                    list.appendChild(groupTitle);

                    window.hls.subtitleTracks.forEach((track, idx) => {
                        const isActive = window.hls.subtitleTrack === idx;
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all mb-1 ${isActive ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<span>${track.name || track.lang || 'Subtitle ' + (idx + 1)}</span> ${isActive ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => { 
                            window.hls.subtitleTrack = idx; 
                            if (video && video.textTracks) {
                                for (let j = 0; j < video.textTracks.length; j++) video.textTracks[j].mode = 'disabled';
                            }
                            showIndicator('Subtitles: ' + (track.name || track.lang));
                            closeSubtitleModal(); 
                        };
                        list.appendChild(btn);
                    });
                }

                // 3. Multi-Language External WebVTT Subtitles (Bingr / VDRK)
                const extSubs = window.bingrSubtitles || [];
                if (extSubs.length > 0 || (video && video.textTracks && video.textTracks.length > 0)) {
                    hasSubs = true;
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 mt-2 px-2 flex items-center justify-between';
                    groupTitle.innerHTML = `<span>Available Languages</span> <span class="text-[9px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">${Math.max(extSubs.length, video?.textTracks?.length || 0)}</span>`;
                    list.appendChild(groupTitle);

                    const scrollBox = document.createElement('div');
                    scrollBox.className = 'max-h-60 overflow-y-auto pr-1 space-y-1 custom-scrollbar';

                    extSubs.forEach((sub, idx) => {
                        const label = sub.label || sub.lang || ('Subtitle ' + (idx + 1));
                        let isShowing = false;
                        if (video && video.textTracks) {
                            for (let t = 0; t < video.textTracks.length; t++) {
                                if (video.textTracks[t].label === label && video.textTracks[t].mode === 'showing') {
                                    isShowing = true;
                                }
                            }
                        }
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isShowing ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<div class="flex items-center gap-2"><span>${label}</span> <span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-mono">${(sub.lang || 'VTT').slice(0, 6)}</span></div> ${isShowing ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => {
                            let vttUrl = sub.url;
                            if (sub.url && sub.url.includes('.srt')) {
                                vttUrl = '/api/bingr/srt2vtt?url=' + encodeURIComponent(sub.url);
                            }
                            
                            // Find or inject track
                            let targetTrack = null;
                            let targetIdx = -1;
                            if (video && video.textTracks) {
                                for (let t = 0; t < video.textTracks.length; t++) {
                                    if (video.textTracks[t].label === label) {
                                        targetTrack = video.textTracks[t];
                                        targetIdx = t;
                                    }
                                }
                            }
                            
                            if (!targetTrack) {
                                const trackEl = document.createElement('track');
                                trackEl.kind = 'subtitles';
                                trackEl.label = label;
                                trackEl.srclang = (sub.lang || 'en').substring(0, 2);
                                trackEl.src = vttUrl;
                                trackEl.default = true;
                                video.appendChild(trackEl);
                                setTimeout(() => {
                                    for (let t = 0; t < video.textTracks.length; t++) {
                                        const isMatch = video.textTracks[t].label === label;
                                        video.textTracks[t].mode = isMatch ? 'showing' : 'disabled';
                                        if (isMatch && window.player) {
                                            try { window.player.currentTrack = t; } catch(e){}
                                        }
                                    }
                                }, 50);
                            } else {
                                for (let t = 0; t < video.textTracks.length; t++) {
                                    const isMatch = video.textTracks[t] === targetTrack;
                                    video.textTracks[t].mode = isMatch ? 'showing' : 'disabled';
                                    if (isMatch && window.player) {
                                        try { window.player.currentTrack = t; } catch(e){}
                                    }
                                }
                            }
                            if (window.hls) window.hls.subtitleTrack = -1;
                            showIndicator('Subtitles: ' + label);
                            closeSubtitleModal();
                        };
                        scrollBox.appendChild(btn);
                    });
                    list.appendChild(scrollBox);
                }

                if (!hasSubs) {
                    list.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">No subtitle tracks found for this stream</p>';
                }

                if (typeof lucide !== 'undefined') lucide.createIcons();
                modal.classList.remove('hidden');
            };

            window.closeSubtitleModal = function() {
                document.getElementById('subtitleModal').classList.add('hidden');
            };

            // -- SUBTITLE VISUAL & AUDIO SYNC CONTROLLER --
            let currentSubOffset = 0;
            let currentSubFontSize = localStorage.getItem('stalker_sub_font') || '1.15rem';
            let currentSubColor = localStorage.getItem('stalker_sub_color') || '#ffffff';
            let currentSubBg = localStorage.getItem('stalker_sub_bg') || 'rgba(0, 0, 0, 0.78)';

            window.switchSubTab = function(tab) {
                const tabTracks = document.getElementById('sub-tab-tracks');
                const tabVisual = document.getElementById('sub-tab-visual');
                const contentTracks = document.getElementById('sub-tab-content-tracks');
                const contentVisual = document.getElementById('sub-tab-content-visual');
                if (tab === 'tracks') {
                    if (tabTracks) tabTracks.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-red-600 text-white shadow cursor-pointer';
                    if (tabVisual) tabVisual.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-zinc-400 hover:text-white cursor-pointer';
                    if (contentTracks) contentTracks.classList.remove('hidden');
                    if (contentVisual) contentVisual.classList.add('hidden');
                } else {
                    if (tabVisual) tabVisual.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all bg-red-600 text-white shadow cursor-pointer';
                    if (tabTracks) tabTracks.className = 'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all text-zinc-400 hover:text-white cursor-pointer';
                    if (contentVisual) contentVisual.classList.remove('hidden');
                    if (contentTracks) contentTracks.classList.add('hidden');
                    window.applySubtitleStyles();
                }
            };

            window.applySubtitleStyles = function() {
                document.documentElement.style.setProperty('--sub-font-size', currentSubFontSize);
                document.documentElement.style.setProperty('--sub-color', currentSubColor);
                document.documentElement.style.setProperty('--sub-bg', currentSubBg);
                const prev = document.getElementById('sub-preview-box');
                if (prev) {
                    prev.style.fontSize = currentSubFontSize;
                    prev.style.color = currentSubColor;
                    prev.style.backgroundColor = currentSubBg;
                    prev.style.textShadow = currentSubBg === 'transparent' ? '0 2px 4px rgba(0,0,0,1), 0 0 8px rgba(0,0,0,0.8)' : '0 2px 4px rgba(0,0,0,0.95)';
                }
                document.querySelectorAll('.plyr__caption').forEach(el => {
                    el.style.fontSize = currentSubFontSize;
                    el.style.color = currentSubColor;
                    el.style.background = currentSubBg;
                });
            };

            window.setSubtitleFontSize = function(size) {
                currentSubFontSize = size;
                window.applySubtitleStyles();
                try { localStorage.setItem('stalker_sub_font', size); } catch(e){}
                document.querySelectorAll('.sub-font-btn').forEach(btn => {
                    btn.classList.remove('bg-red-600', 'text-white');
                    btn.classList.add('bg-white/5', 'text-zinc-300');
                });
                if (size === '0.85rem') document.getElementById('sub-font-small')?.classList.replace('bg-white/5', 'bg-red-600');
                if (size === '1.15rem') document.getElementById('sub-font-medium')?.classList.replace('bg-white/5', 'bg-red-600');
                if (size === '1.45rem') document.getElementById('sub-font-large')?.classList.replace('bg-white/5', 'bg-red-600');
                if (size === '1.75rem') document.getElementById('sub-font-xlarge')?.classList.replace('bg-white/5', 'bg-red-600');
                showIndicator('Subtitle Size: ' + (size === '0.85rem' ? '75% Small' : size === '1.15rem' ? '100% Normal' : size === '1.45rem' ? '125% Large' : '150% Huge'));
            };

            window.setSubtitleColor = function(color) {
                currentSubColor = color;
                window.applySubtitleStyles();
                try { localStorage.setItem('stalker_sub_color', color); } catch(e){}
                showIndicator('Subtitle Color Updated');
            };

            window.setSubtitleBg = function(bg) {
                currentSubBg = bg;
                window.applySubtitleStyles();
                try { localStorage.setItem('stalker_sub_bg', bg); } catch(e){}
                document.querySelectorAll('.sub-bg-btn').forEach(btn => {
                    btn.classList.remove('bg-white/20', 'border-white/40');
                    btn.classList.add('bg-white/5', 'border-white/10');
                });
                if (bg === 'rgba(0, 0, 0, 0.78)') document.getElementById('sub-bg-translucent')?.classList.replace('bg-white/5', 'bg-white/20');
                if (bg === '#000000') document.getElementById('sub-bg-solid')?.classList.replace('bg-white/5', 'bg-white/20');
                if (bg === 'transparent') document.getElementById('sub-bg-none')?.classList.replace('bg-white/5', 'bg-white/20');
                showIndicator('Subtitle Style Updated');
            };

            window.adjustSubtitleSync = function(delta) {
                currentSubOffset += delta;
                updateSubtitleSyncUI();
                applyOffsetToTracks(delta);
                showIndicator(`Subtitle Sync: ${currentSubOffset >= 0 ? '+' : ''}${currentSubOffset.toFixed(2)}s`);
            };

            window.resetSubtitleSync = function() {
                const diff = -currentSubOffset;
                currentSubOffset = 0;
                updateSubtitleSyncUI();
                applyOffsetToTracks(diff);
                showIndicator('Subtitle Sync: Reset to 0s');
            };

            function updateSubtitleSyncUI() {
                const disp = document.getElementById('sub-offset-display');
                if (!disp) return;
                if (Math.abs(currentSubOffset) < 0.01) {
                    disp.textContent = '0.00s (Synced)';
                    disp.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold';
                } else {
                    disp.textContent = `${currentSubOffset > 0 ? '+' : ''}${currentSubOffset.toFixed(2)}s`;
                    disp.className = 'px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold';
                }
            }

            function applyOffsetToTracks(delta) {
                const video = document.getElementById('player');
                if (!video || !video.textTracks) return;
                for (let i = 0; i < video.textTracks.length; i++) {
                    const track = video.textTracks[i];
                    if (track.cues) {
                        for (let c = 0; c < track.cues.length; c++) {
                            const cue = track.cues[c];
                            cue.startTime = Math.max(0, cue.startTime + delta);
                            cue.endTime = Math.max(0, cue.endTime + delta);
                        }
                    }
                }
            }

            // Restore saved subtitle visual preferences
            setTimeout(() => {
                window.applySubtitleStyles();
            }, 300);
            // ---------------------------------------------
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
                } else if (window.shakaPlayer && typeof window.shakaPlayer.getVariantTracks === 'function' && window.shakaPlayer.getVariantTracks().length > 0) {
                    const tracks = window.shakaPlayer.getVariantTracks();
                    const isAbr = window.shakaPlayer.getConfiguration().abr.enabled;
                    const activeTrack = tracks.find(t => t.active);

                    const autoBtn = document.createElement('button');
                    autoBtn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isAbr ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                    autoBtn.innerHTML = `<span>Auto (Adaptive 1080p/HD)</span> ${isAbr ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                    autoBtn.onclick = () => {
                        window.shakaPlayer.configure({ abr: { enabled: true } });
                        showIndicator('Quality: Auto Adaptive');
                        closeQualityModal();
                    };
                    list.appendChild(autoBtn);

                    const uniqueHeights = Array.from(new Set(tracks.map(t => t.height).filter(Boolean))).sort((a, b) => b - a);
                    uniqueHeights.forEach(h => {
                        const matchedTrack = tracks.find(t => t.height === h);
                        const isCurrent = !isAbr && activeTrack && activeTrack.height === h;
                        let label = `${h}p`;
                        let badge = '';
                        if (h >= 1080) {
                            label = '1080p Full HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">FHD</span>';
                        } else if (h >= 720) {
                            label = '720p HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">HD</span>';
                        } else if (h >= 540) {
                            label = '540p qHD';
                            badge = '<span class="px-2 py-0.5 rounded bg-zinc-700 text-zinc-300 font-bold text-[10px]">SD</span>';
                        }
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isCurrent ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<div class="flex items-center gap-2"><span>${label}</span> ${badge}</div> ${isCurrent ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => {
                            window.shakaPlayer.configure({ abr: { enabled: false } });
                            window.shakaPlayer.selectVariantTrack(matchedTrack, true);
                            showIndicator('Quality: ' + label);
                            closeQualityModal();
                        };
                        list.appendChild(btn);
                    });
                } else if (window.dashPlayer && typeof window.dashPlayer.getBitrateInfoListFor === 'function') {
                    const bitrates = window.dashPlayer.getBitrateInfoListFor('video');
                    const autoSwitch = window.dashPlayer.getSettings()?.streaming?.abr?.autoSwitchBitrate?.video !== false;
                    const currentQual = window.dashPlayer.getQualityFor('video');

                    const autoBtn = document.createElement('button');
                    autoBtn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${autoSwitch ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                    autoBtn.innerHTML = `<span>Auto (Adaptive 1080p/HD)</span> ${autoSwitch ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                    autoBtn.onclick = () => {
                        window.dashPlayer.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: true } } } });
                        showIndicator('Quality: Auto Adaptive');
                        closeQualityModal();
                    };
                    list.appendChild(autoBtn);

                    bitrates.forEach((b, idx) => {
                        let label = `${b.height || 'SD'}p`;
                        let badge = '';
                        if (b.height >= 1080) {
                            label = '1080p Full HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">FHD</span>';
                        } else if (b.height >= 720) {
                            label = '720p HD';
                            badge = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">HD</span>';
                        }
                        const isCurrent = !autoSwitch && currentQual === idx;
                        const btn = document.createElement('button');
                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${isCurrent ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
                        btn.innerHTML = `<div class="flex items-center gap-2"><span>${label}</span> ${badge}</div> ${isCurrent ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
                        btn.onclick = () => {
                            window.dashPlayer.updateSettings({ streaming: { abr: { autoSwitchBitrate: { video: false } } } });
                            window.dashPlayer.setQualityFor('video', idx);
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
            function getDirectVlcStreamUrl() {
                const urlParams = new URLSearchParams(window.location.search);
                const channelId = urlParams.get('channel_id') || urlParams.get('id') || '';
                const CANONICAL_DOMAIN = 'https://ellamoonu.ai.studio';

                let rawUrl = window._currentDirectStreamUrl || urlParams.get('url') || src || '';

                if (typeof rawUrl === 'string') {
                    if (rawUrl.includes('live.php?url=')) {
                        const m = rawUrl.match(/[?&]url=([^&]+)/);
                        if (m) rawUrl = decodeURIComponent(m[1]);
                    } else if (rawUrl.includes('stream_proxy.php?url=')) {
                        const m = rawUrl.match(/[?&]url=([^&]+)/);
                        if (m) rawUrl = decodeURIComponent(m[1]);
                    }
                }

                if (typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'))) {
                    return `${CANONICAL_DOMAIN}/live.php?url=${encodeURIComponent(rawUrl)}`;
                }

                if (channelId) {
                    if (window._currentDirectStreamUrl) {
                        return `${CANONICAL_DOMAIN}/live.php?url=${encodeURIComponent(window._currentDirectStreamUrl)}`;
                    }
                    return `${CANONICAL_DOMAIN}/live.php?token=STALKER_PRO&id=${encodeURIComponent(channelId)}&m3u=1`;
                }

                return `${CANONICAL_DOMAIN}/sports.m3u`;
            }

            window.copyVlcStreamLink = function() {
                const link = getDirectVlcStreamUrl();
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(link).then(() => {
                        showIndicator('✅ VLC Stream URL Copied!');
                    }).catch(() => {
                        prompt("Copy this direct stream URL into VLC / TiviMate:", link);
                    });
                } else {
                    prompt("Copy this direct stream URL into VLC / TiviMate:", link);
                }
            };

            window.openVlcStream = function(e) {
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                const streamUrl = getDirectVlcStreamUrl();
                if (!streamUrl) {
                    if (typeof showIndicator === 'function') showIndicator('⚠️ No stream URL available');
                    return;
                }

                // Copy stream URL to clipboard
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(streamUrl).catch(() => {});
                }

                if (typeof showIndicator === 'function') {
                    showIndicator('⚡ Opening in VLC Player...');
                }

                const isAndroid = /Android/i.test(navigator.userAgent);
                const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
                const cleanUrl = streamUrl.replace(/^https?:\/\//i, '');

                if (isAndroid) {
                    const intentUrl = `intent://${cleanUrl}#Intent;package=org.videolan.vlc;type=video/*;scheme=http;end`;
                    window.location.href = intentUrl;
                    setTimeout(() => {
                        window.location.href = `vlc://${streamUrl}`;
                    }, 1200);
                } else if (isIOS) {
                    window.location.href = `vlc-x-callback://x-callback-url/stream?url=${encodeURIComponent(streamUrl)}`;
                    setTimeout(() => {
                        window.location.href = `vlc://${streamUrl}`;
                    }, 1000);
                } else {
                    window.location.href = `vlc://${streamUrl}`;
                }
            };

            function showPlayerError(msg) {
                document.getElementById('error-message-text').innerText = msg;
                const vlcUrl = getDirectVlcStreamUrl();
                const vlcBtn = document.getElementById('vlc-direct-btn');
                if (vlcBtn) {
                    vlcBtn.href = vlcUrl;
                }
                document.getElementById('player-error').classList.remove('hidden');
                loading.style.display = 'none';
            }

            // Live Stream Routing & Helper Functions
            // If someone opened play_consumet.php with movie, TV series, or anime, redirect to dedicated player (play_bingr.php)
            const urlMediaId = urlParams.get('id') || urlParams.get('tmdbId') || urlParams.get('tmdb_id');
            const urlMediaType = (urlParams.get('type') || urlParams.get('media_type') || '').toLowerCase();
            const isMovieOrTvOrAnime = urlMediaType === 'movie' || urlMediaType === 'tv' || urlMediaType === 'series' || urlMediaType === 'anime' || urlParams.has('season') || urlParams.has('episode') || urlParams.has('s') || urlParams.has('e') || urlParams.has('malId') || urlParams.has('mal_id') || (urlMediaId && /^\d+$/.test(String(urlMediaId).trim()) && !urlParams.has('url') && !urlParams.get('name')?.toLowerCase().includes('tv'));
            if (isMovieOrTvOrAnime) {
                window.location.replace(`/play_bingr.php?${window.location.search.substring(1)}`);
                return;
            }





            window.copyCurrentStreamLink = function() {
                if (navigator.clipboard && src) {
                    navigator.clipboard.writeText(src).then(() => {
                        showIndicator('Live Stream URL Copied!');
                    }).catch(() => {
                        showIndicator(src);
                    });
                }
            };

            // Embed HLS Engine (Direct Video Screen Only without external website clutter, preserving all controls except timeline)
            window.loadHlsDemoEmbed = function(targetStreamUrl) {
                // Check all possible sources for channel / stream ID
                const searchParams = new URLSearchParams(window.location.search);
                let streamId = window.currentStreamId || searchParams.get('id') || searchParams.get('stream_id') || searchParams.get('streamId') || searchParams.get('channel') || searchParams.get('channel_id');
                const CANONICAL_DOMAIN = 'https://ellamoonu.ai.studio';

                let raw = targetStreamUrl || window._currentDirectStreamUrl || searchParams.get('url') || src || '';

                if (typeof raw === 'string') {
                    if (raw.includes('live.php?url=')) {
                        const match = raw.match(/[?&]url=([^&]+)/);
                        if (match) raw = decodeURIComponent(match[1]);
                    } else if (raw.includes('stream_proxy.php?url=')) {
                        const match = raw.match(/[?&]url=([^&]+)/);
                        if (match) raw = decodeURIComponent(match[1]);
                    }
                }

                let streamToPlay = '';
                if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) {
                    streamToPlay = `${CANONICAL_DOMAIN}/live.php?url=${encodeURIComponent(raw)}`;
                } else if (streamId) {
                    if (window._currentDirectStreamUrl) {
                        streamToPlay = `${CANONICAL_DOMAIN}/live.php?url=${encodeURIComponent(window._currentDirectStreamUrl)}`;
                    } else {
                        streamToPlay = `${CANONICAL_DOMAIN}/live.php?token=STALKER_PRO&id=${encodeURIComponent(streamId)}&m3u=1`;
                    }
                } else if (raw && raw.startsWith('/')) {
                    streamToPlay = `${CANONICAL_DOMAIN}${raw}`;
                } else {
                    streamToPlay = `${CANONICAL_DOMAIN}/sports.m3u`;
                }

                console.log("[HLS Demo Embed] Activating direct video screen embed with stream URL:", streamToPlay);

                // Stop other playback engines on native video element
                try {
                    if (window.hls) { window.hls.destroy(); window.hls = null; }
                    if (window.shakaPlayer) { window.shakaPlayer.destroy(); window.shakaPlayer = null; }
                    if (window.dashPlayer) { window.dashPlayer.reset(); window.dashPlayer = null; }
                    if (window.mpegPlayer) { window.mpegPlayer.destroy(); window.mpegPlayer = null; }
                    if (video) { video.pause(); video.src = ''; }
                } catch (e) {}

                // Hide error modal & loading
                document.getElementById('player-error').classList.add('hidden');
                loading.style.display = 'none';

                // Ensure Plyr instance exists so our rich controls are built
                if (!player) {
                    player = new Plyr(video, {
                        controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                        autoplay: true,
                        muted: false,
                        hideControls: { enabled: true, delay: 4000 },
                        clickToPlay: false,
                        fullscreen: { enabled: true, fallback: true, iosNative: true }
                    });
                    window.plyrPlayer = player;
                    window.player = player;
                }

                // Add active embed classes to hide timeline while preserving all controls
                const container = document.getElementById('player-container');
                if (container) container.classList.add('hls-embed-active');
                const plyrEl = document.querySelector('.plyr');
                if (plyrEl) {
                    plyrEl.classList.add('hls-embed-active');
                    plyrEl.style.display = 'flex';
                }

                const croppedContainer = document.getElementById('hls-cropped-container');
                const frame = document.getElementById('hls-demo-embed-frame');
                if (croppedContainer && frame) {
                    // Move cropped container into Plyr video wrapper so controls naturally overlay on top
                    const plyrVideoWrapper = document.querySelector('.plyr__video-wrapper');
                    if (plyrVideoWrapper && croppedContainer.parentElement !== plyrVideoWrapper) {
                        plyrVideoWrapper.prepend(croppedContainer);
                    }
                    croppedContainer.classList.remove('hidden');

                    // Load official HLS.js demo cleanly without invalid Base64 configs
                    const embedUrl = `https://hlsjs.video-dev.org/demo/?src=${encodeURIComponent(streamToPlay)}`;
                    if (frame.src !== embedUrl) {
                        frame.src = embedUrl;
                    }

                    // 3-Second Seamless Black Curtain for Instant Embed Transition
                    const curtain = document.getElementById('hls-embed-curtain');
                    if (curtain) {
                        curtain.classList.remove('hidden');
                        curtain.style.opacity = '1';
                        curtain.style.display = 'flex';
                    }

                    if (window.resizeHlsViewport) {
                        window.resizeHlsViewport();
                    }

                    setTimeout(() => {
                        if (window.resizeHlsViewport) {
                            window.resizeHlsViewport();
                        }
                        if (curtain) {
                            curtain.style.opacity = '0';
                            setTimeout(() => {
                                curtain.classList.add('hidden');
                                curtain.style.display = 'none';
                            }, 700);
                        }
                    }, 3000);

                    // Bind control events to forward to iframe
                    const playBtns = document.querySelectorAll('.plyr__controls button[data-plyr="play"], button.plyr__control--overlaid');
                    playBtns.forEach(btn => {
                        if (!btn._embedBound) {
                            btn._embedBound = true;
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                if (frame.contentWindow) {
                                    frame.contentWindow.postMessage({ action: 'togglePlay' }, '*');
                                }
                            });
                        }
                    });

                    const muteBtn = document.querySelector('.plyr__controls button[data-plyr="mute"]');
                    if (muteBtn && !muteBtn._embedBound) {
                        muteBtn._embedBound = true;
                        muteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (frame.contentWindow) {
                                frame.contentWindow.postMessage({ action: 'toggleMute' }, '*');
                            }
                        });
                    }

                    const volInput = document.querySelector('.plyr__controls input[data-plyr="volume"]');
                    if (volInput && !volInput._embedBound) {
                        volInput._embedBound = true;
                        volInput.addEventListener('input', (e) => {
                            const val = parseFloat(volInput.value);
                            if (frame.contentWindow && !isNaN(val)) {
                                frame.contentWindow.postMessage({ action: 'setVolume', volume: val }, '*');
                            }
                        });
                    }

                    showIndicator('<i data-lucide="shield-check" class="w-4 h-4 text-emerald-400"></i> Pure HLS Video Stream Connected');
                    if (typeof lucide !== 'undefined') lucide.createIcons();

                    // Ensure top controls overlay is initialized with Back, Title, Reconnect & Aspect
                    initTopControls(player);
                }
            };

            // Secondary HLS Engine (Local r.html Pure Video Stream with native controls & auto-hide)
            window.loadSecondaryHlsEmbed = function(targetStreamUrl) {
                const searchParams = new URLSearchParams(window.location.search);
                let streamId = window.currentStreamId || searchParams.get('id') || searchParams.get('stream_id') || searchParams.get('streamId') || searchParams.get('channel') || searchParams.get('channel_id');
                const CANONICAL_DOMAIN = 'https://ellamoonu.ai.studio';

                let raw = targetStreamUrl || window._currentDirectStreamUrl || searchParams.get('url') || src || '';

                if (typeof raw === 'string') {
                    if (raw.includes('live.php?url=')) {
                        const match = raw.match(/[?&]url=([^&]+)/);
                        if (match) raw = decodeURIComponent(match[1]);
                    } else if (raw.includes('stream_proxy.php?url=')) {
                        const match = raw.match(/[?&]url=([^&]+)/);
                        if (match) raw = decodeURIComponent(match[1]);
                    }
                }

                // In bracket pure m3u: streamToPlay is the pure stream URL
                let streamToPlay = '';
                if (typeof raw === 'string' && (raw.startsWith('http://') || raw.startsWith('https://'))) {
                    streamToPlay = raw;
                } else if (streamId) {
                    if (window._currentDirectStreamUrl) {
                        streamToPlay = window._currentDirectStreamUrl;
                    } else {
                        streamToPlay = `${CANONICAL_DOMAIN}/live.php?token=STALKER_PRO&id=${encodeURIComponent(streamId)}&m3u=1`;
                    }
                } else if (raw && raw.startsWith('/')) {
                    streamToPlay = `${CANONICAL_DOMAIN}${raw}`;
                } else {
                    streamToPlay = `${CANONICAL_DOMAIN}/sports.m3u`;
                }

                const liveStreamUrl = (streamToPlay.includes('/live.php?token=STALKER_PRO'))
                    ? streamToPlay
                    : `${CANONICAL_DOMAIN}/live.php?url=${encodeURIComponent(streamToPlay)}`;

                console.log("[Secondary HLS Embed] Activating pure local r.html engine with stream URL:", liveStreamUrl);

                // Stop other playback engines on native video element
                try {
                    if (window.hls) { window.hls.destroy(); window.hls = null; }
                    if (window.shakaPlayer) { window.shakaPlayer.destroy(); window.shakaPlayer = null; }
                    if (window.dashPlayer) { window.dashPlayer.reset(); window.dashPlayer = null; }
                    if (window.mpegPlayer) { window.mpegPlayer.destroy(); window.mpegPlayer = null; }
                    if (video) { video.pause(); video.src = ''; }
                } catch (e) {}

                // Hide error modal & loading
                document.getElementById('player-error').classList.add('hidden');
                loading.style.display = 'none';

                // Hide primary embed if showing
                const primaryCrop = document.getElementById('hls-cropped-container');
                if (primaryCrop) primaryCrop.classList.add('hidden');

                // Ensure Plyr instance exists so our rich controls are built
                if (!player) {
                    player = new Plyr(video, {
                        controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                        autoplay: true,
                        muted: false,
                        hideControls: { enabled: true, delay: 4000 },
                        clickToPlay: false,
                        fullscreen: { enabled: true, fallback: true, iosNative: true }
                    });
                    window.plyrPlayer = player;
                    window.player = player;
                }

                const container = document.getElementById('player-container');
                if (container) container.classList.add('hls-embed-active');
                const plyrEl = document.querySelector('.plyr');
                if (plyrEl) {
                    plyrEl.classList.add('hls-embed-active');
                    plyrEl.style.display = 'flex';
                }

                const secContainer = document.getElementById('hls-secondary-container');
                const secFrame = document.getElementById('hls-secondary-embed-frame');
                if (secContainer && secFrame) {
                    const plyrVideoWrapper = document.querySelector('.plyr__video-wrapper');
                    if (plyrVideoWrapper && secContainer.parentElement !== plyrVideoWrapper) {
                        plyrVideoWrapper.prepend(secContainer);
                    }
                    secContainer.classList.remove('hidden');

                    // Dismiss any lingering curtain or pause overlays
                    const curtain = document.getElementById('hls-embed-curtain');
                    if (curtain) { curtain.classList.add('hidden'); curtain.style.display = 'none'; }
                    const stopOverlay = document.getElementById('screen-stop-overlay');
                    if (stopOverlay) { stopOverlay.classList.remove('active'); stopOverlay.style.display = 'none'; }

                    const titleText = window.currentStreamTitle || (document.getElementById('channel-name') ? document.getElementById('channel-name').textContent : 'Live Stream');
                    // Format requested: /r.html?url=https://ellamoonu.ai.studio/live.php?url=${encodeURIComponent(streamToPlay)} where streamToPlay is pure m3u
                    const secondaryUrl = (streamToPlay.includes('/live.php?token=STALKER_PRO'))
                        ? `/r.html?url=${encodeURIComponent(streamToPlay)}`
                        : `/r.html?url=https://ellamoonu.ai.studio/live.php?url=${encodeURIComponent(streamToPlay)}`;
                    if (secFrame.getAttribute('src') !== secondaryUrl) {
                        secFrame.src = secondaryUrl;
                    }

                    // Forward controls to secondary embed
                    const playBtns = document.querySelectorAll('.plyr__controls button[data-plyr="play"], button.plyr__control--overlaid');
                    playBtns.forEach(btn => {
                        if (!btn._secEmbedBound) {
                            btn._secEmbedBound = true;
                            btn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                if (secFrame.contentWindow) {
                                    secFrame.contentWindow.postMessage({ action: 'togglePlay' }, '*');
                                }
                            });
                        }
                    });

                    const muteBtn = document.querySelector('.plyr__controls button[data-plyr="mute"]');
                    if (muteBtn && !muteBtn._secEmbedBound) {
                        muteBtn._secEmbedBound = true;
                        muteBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (secFrame.contentWindow) {
                                secFrame.contentWindow.postMessage({ action: 'toggleMute' }, '*');
                            }
                        });
                    }

                    const volInput = document.querySelector('.plyr__controls input[data-plyr="volume"]');
                    if (volInput && !volInput._secEmbedBound) {
                        volInput._secEmbedBound = true;
                        volInput.addEventListener('input', (e) => {
                            const val = parseFloat(volInput.value);
                            if (secFrame.contentWindow && !isNaN(val)) {
                                secFrame.contentWindow.postMessage({ action: 'setVolume', volume: val }, '*');
                            }
                        });
                    }

                    showIndicator('<i data-lucide="sparkles" class="w-4 h-4 text-indigo-400"></i> Secondary HLS Embed (r.html) Connected');
                    if (typeof lucide !== 'undefined') lucide.createIcons();

                    initTopControls(player);
                }
            };

            // PostMessage bridge for secondary embed communication
            window.addEventListener('message', (e) => {
                if (e.data && e.data.source === 'r_embed') {
                    // Sync parent play/pause icon with secondary embed state
                    if (e.data.type === 'play' || e.data.type === 'playing') {
                        const playBtns = document.querySelectorAll('.plyr__controls button[data-plyr="play"]');
                        playBtns.forEach(b => b.classList.add('plyr__control--pressed'));
                    } else if (e.data.type === 'pause') {
                        const playBtns = document.querySelectorAll('.plyr__controls button[data-plyr="play"]');
                        playBtns.forEach(b => b.classList.remove('plyr__control--pressed'));
                    }
                }
            });

            window._embedZoomMultiplier = 1.10;
            window._embedFitMode = 'fit'; // 'fit' (contain so no match part vanishes on mobile), 'fill', 'original'
            window._embedPanY = 0;
            window._embedBaseTop = -736; // shifted up from -712 by 24px to perfectly match video container

            window.adjustEmbedZoom = function(delta) {
                window._embedZoomMultiplier = Math.max(0.5, Math.min(2.5, Math.round(((window._embedZoomMultiplier || 1.0) + delta) * 10) / 10));
                if (window.resizeHlsViewport) window.resizeHlsViewport();
                if (typeof showIndicator === 'function') {
                    showIndicator(`🔍 Zoom: ${Math.round(window._embedZoomMultiplier * 100)}%`);
                }
            };

            window.toggleEmbedFitMode = function() {
                if (window._embedFitMode === 'fit') {
                    window._embedFitMode = 'fill';
                } else if (window._embedFitMode === 'fill') {
                    window._embedFitMode = 'original';
                    window._embedZoomMultiplier = 1.0;
                } else {
                    window._embedFitMode = 'fit';
                    window._embedZoomMultiplier = 1.0;
                }
                if (window.resizeHlsViewport) window.resizeHlsViewport();
                const modeName = window._embedFitMode === 'fit' ? 'FIT (Whole Match)' : (window._embedFitMode === 'fill' ? 'FILL (Full Screen)' : '100% ORIGINAL');
                if (typeof showIndicator === 'function') {
                    showIndicator(`📺 Embed Mode: ${modeName}`);
                }
            };

            window.adjustEmbedNudge = function(pixels) {
                window._embedPanY = (window._embedPanY || 0) + pixels;
                if (window.resizeHlsViewport) window.resizeHlsViewport();
                if (typeof showIndicator === 'function') {
                    showIndicator(`↕️ Position Offset: ${window._embedPanY > 0 ? '+' : ''}${window._embedPanY}px`);
                }
            };

            window.resetEmbedZoom = function() {
                window._embedZoomMultiplier = 1.10;
                window._embedFitMode = 'fit';
                window._embedPanY = 0;
                if (window.resizeHlsViewport) window.resizeHlsViewport();
                if (typeof showIndicator === 'function') {
                    showIndicator('↺ Reset Zoom & Position to Default (110%)');
                }
            };

            window.resizeHlsViewport = function() {
                const container = document.getElementById('hls-cropped-container');
                const scaler = document.getElementById('hls-viewport-scaler');
                const frame = document.getElementById('hls-demo-embed-frame');
                if (!container || !scaler) return;
                const cw = container.clientWidth || window.innerWidth;
                const ch = container.clientHeight || window.innerHeight;
                if (!cw || !ch) return;

                const scaleX = cw / 784;
                const scaleY = ch / 441;

                let baseScale = 1.0;
                if (window._embedFitMode === 'fill') {
                    baseScale = Math.max(scaleX, scaleY);
                } else if (window._embedFitMode === 'original') {
                    baseScale = Math.min(1.0, Math.min(scaleX, scaleY));
                } else {
                    // Default 'fit' (contain): whole match is visible without vanishing on mobile!
                    baseScale = Math.min(scaleX, scaleY);
                }

                const zoom = window._embedZoomMultiplier || 1.0;
                const finalScale = baseScale * zoom;
                const panY = window._embedPanY || 0;

                scaler.style.transform = `scale(${finalScale}) translateY(${panY}px)`;
                if (frame) {
                    frame.style.top = `${(window._embedBaseTop || -736)}px`;
                }

                const lbl = document.getElementById('embed-zoom-label');
                if (lbl) {
                    if (window._embedFitMode === 'fit') {
                        lbl.textContent = zoom === 1 ? 'FIT' : `${Math.round(zoom * 100)}%`;
                    } else if (window._embedFitMode === 'fill') {
                        lbl.textContent = 'FILL';
                    } else {
                        lbl.textContent = `${Math.round(zoom * 100)}%`;
                    }
                }
            };
            window.addEventListener('resize', () => {
                if (window.resizeHlsViewport) window.resizeHlsViewport();
            });

            // Touch Pinch-to-Zoom for mobile screens
            (function initPinchToZoom() {
                const container = document.getElementById('hls-cropped-container');
                if (!container) return;
                let initialDist = 0;
                let initialZoom = 1.0;

                container.addEventListener('touchstart', (e) => {
                    if (e.touches && e.touches.length === 2) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        initialDist = Math.hypot(dx, dy);
                        initialZoom = window._embedZoomMultiplier || 1.0;
                    }
                }, { passive: true });

                container.addEventListener('touchmove', (e) => {
                    if (e.touches && e.touches.length === 2 && initialDist > 0) {
                        const dx = e.touches[0].clientX - e.touches[1].clientX;
                        const dy = e.touches[0].clientY - e.touches[1].clientY;
                        const dist = Math.hypot(dx, dy);
                        const factor = dist / initialDist;
                        window._embedZoomMultiplier = Math.max(0.5, Math.min(2.5, Math.round(initialZoom * factor * 10) / 10));
                        if (window.resizeHlsViewport) window.resizeHlsViewport();
                    }
                }, { passive: true });

                container.addEventListener('touchend', (e) => {
                    if (!e.touches || e.touches.length < 2) {
                        initialDist = 0;
                    }
                }, { passive: true });
            })();

            // Listen for state sync from clean embed iframe
            window.addEventListener('message', (e) => {
                if (e.data && e.data.source === 'hls_clean_embed') {
                    const { paused, muted, volume } = e.data;
                    const playBtn = document.querySelector('.plyr__controls button[data-plyr="play"]');
                    const muteBtn = document.querySelector('.plyr__controls button[data-plyr="mute"]');
                    const volInput = document.querySelector('.plyr__controls input[data-plyr="volume"]');
                    if (playBtn) {
                        if (paused) playBtn.classList.remove('plyr__control--pressed');
                        else playBtn.classList.add('plyr__control--pressed');
                    }
                    if (muteBtn) {
                        if (muted) muteBtn.classList.add('plyr__control--pressed');
                        else muteBtn.classList.remove('plyr__control--pressed');
                    }
                    if (volInput && typeof volume === 'number') {
                        volInput.value = volume;
                    }
                }
            });

            // Clean Top & Bottom Control Synchronizer
            function initTopControls(plyrInstance) {
                let topControls = document.getElementById('top-controls');
                if (!topControls) {
                    topControls = document.createElement('div');
                    topControls.id = 'top-controls';
                    topControls.className = 'flex items-center justify-between transition-all duration-300 gap-2';
                    
                    // Left controls group
                    const leftGroup = document.createElement('div');
                    leftGroup.className = 'flex items-center gap-2 sm:gap-3 pointer-events-auto shrink-0';
                    
                    // Back button
                    const backBtn = document.createElement('button');
                    backBtn.type = 'button';
                    backBtn.title = "Go Back";
                    backBtn.onclick = () => window.history.back();
                    backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>';
                    leftGroup.appendChild(backBtn);

                    // Rotate View Button (Screen Left End)
                    const rotateBtn = document.createElement('button');
                    rotateBtn.type = 'button';
                    rotateBtn.title = "Rotate Screen (Portrait / Landscape)";
                    rotateBtn.onclick = (e) => { e.stopPropagation(); window.toggleRotation(); };
                    rotateBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>';
                    leftGroup.appendChild(rotateBtn);
                    
                    // Title pill
                    const titlePill = document.createElement('div');
                    titlePill.className = 'title-pill';
                    titlePill.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0"></span><span class="truncate">${name}</span>`;
                    leftGroup.appendChild(titlePill);
                    
                    topControls.appendChild(leftGroup);
                    
                    // Right controls group (Clean & functional only)
                    const rightGroup = document.createElement('div');
                    rightGroup.className = 'flex items-center gap-2.5 pointer-events-auto shrink-0';
                    
                    // Reconnect Button
                    const reconnectBtn = document.createElement('button');
                    reconnectBtn.type = 'button';
                    reconnectBtn.title = "Reconnect Stream";
                    reconnectBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';
                    reconnectBtn.onclick = (e) => { e.stopPropagation(); triggerAutoReconnect(); };
                    rightGroup.appendChild(reconnectBtn);
                    
                    // Quality Selector Button
                    const qualityBtn = document.createElement('button');
                    qualityBtn.type = 'button';
                    qualityBtn.id = 'btn-quality-top';
                    qualityBtn.title = "Stream Quality (4K/8K/HD)";
                    qualityBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>';
                    qualityBtn.onclick = (e) => { e.stopPropagation(); window.toggleQualityModal(); };
                    rightGroup.appendChild(qualityBtn);

                    // Official Embed Button (Bypass lag/geo-block)
                    const embedBtn = document.createElement('button');
                    embedBtn.type = 'button';
                    embedBtn.id = 'btn-embed-top';
                    embedBtn.title = "Direct Official HLS Embed (Lag-Free & Smooth)";
                    embedBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                    embedBtn.onclick = (e) => { e.stopPropagation(); window.loadHlsDemoEmbed(); };
                    rightGroup.appendChild(embedBtn);

                    // Secondary Local Embed Button (r.html Pure Engine)
                    const secEmbedBtn = document.createElement('button');
                    secEmbedBtn.type = 'button';
                    secEmbedBtn.id = 'btn-secondary-embed-top';
                    secEmbedBtn.title = "Secondary Embed (Pure Local r.html Engine)";
                    secEmbedBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-2 2.5h3L11 8h4l-5 8 2-4H9l3-10z"/><rect x="2" y="4" width="20" height="16" rx="2"/></svg>';
                    secEmbedBtn.onclick = (e) => { e.stopPropagation(); window.loadSecondaryHlsEmbed(); };
                    rightGroup.appendChild(secEmbedBtn);

                    // Aspect Ratio Button
                    const aspectBtn = document.createElement('button');
                    aspectBtn.type = 'button';
                    aspectBtn.title = "Toggle Aspect Ratio";
                    aspectBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>';
                    aspectBtn.onclick = (e) => { e.stopPropagation(); toggleAspectRatio(); };
                    rightGroup.appendChild(aspectBtn);

                    // VLC Player Button (Positioned at the end of controls)
                    const vlcBtn = document.createElement('button');
                    vlcBtn.type = 'button';
                    vlcBtn.id = 'btn-vlc-top';
                    vlcBtn.title = "Open in VLC Player / External Player";
                    vlcBtn.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 2L3.5 20.5h17L12 2z" fill="#f97316" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 16.5h10" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><path d="M9 11.5h6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';
                    vlcBtn.onclick = (e) => { e.stopPropagation(); window.openVlcStream(e); };
                    rightGroup.appendChild(vlcBtn);

                    topControls.appendChild(rightGroup);

                    // Also inject VLC button into Plyr bottom controls bar at the end
                    try {
                        const plyrControls = plyrInstance?.elements?.controls || document.querySelector('.plyr__controls');
                        if (plyrControls && !plyrControls.querySelector('[data-plyr="vlc"]')) {
                            const vlcBottomBtn = document.createElement('button');
                            vlcBottomBtn.type = 'button';
                            vlcBottomBtn.className = 'plyr__control';
                            vlcBottomBtn.setAttribute('data-plyr', 'vlc');
                            vlcBottomBtn.title = "Open in VLC Player";
                            vlcBottomBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 2L3.5 20.5h17L12 2z" fill="#f97316" stroke="#f97316" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 16.5h10" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/><path d="M9 11.5h6" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg><span class="plyr__tooltip">Open in VLC</span>';
                            vlcBottomBtn.onclick = (e) => { e.stopPropagation(); window.openVlcStream(e); };
                            
                            const fsBtn = plyrControls.querySelector('[data-plyr="fullscreen"]');
                            if (fsBtn) {
                                plyrControls.insertBefore(vlcBottomBtn, fsBtn);
                            } else {
                                plyrControls.appendChild(vlcBottomBtn);
                            }
                        }

                        // Live stream indicator & Live Edge synchronization for all live streams (HLS, DASH, TimStreams, Live TV)
                        const isLiveStreamPlayback = !isMovieOrSeries || (video.duration === Infinity) || (typeof isExplicitDash !== 'undefined' && isExplicitDash) || (resolvedSrc && (resolvedSrc.includes('.m3u8') || resolvedSrc.includes('.mpd') || resolvedSrc.includes('live.php') || resolvedSrc.includes('stream_proxy.php')));
                        
                        const containerEl = plyrInstance?.elements?.container || document.querySelector('.plyr') || document.getElementById('player-container');
                        if (containerEl && isLiveStreamPlayback) {
                            containerEl.classList.add('is-live-stream');
                        }

                        if (isLiveStreamPlayback && plyrControls && !plyrControls.querySelector('[data-plyr="live-edge"]')) {
                            const liveBottomBtn = document.createElement('button');
                            liveBottomBtn.type = 'button';
                            liveBottomBtn.className = 'plyr__control shrink-0';
                            liveBottomBtn.setAttribute('data-plyr', 'live-edge');
                            liveBottomBtn.title = "Jump to Live Edge";
                            liveBottomBtn.innerHTML = `
                                <div class="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/30 hover:bg-red-600 border border-red-500/50 text-red-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer">
                                    <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    <span class="text-[9px] font-black uppercase tracking-widest font-mono">LIVE</span>
                                </div>
                                <span class="plyr__tooltip">Go to Live Edge</span>
                            `;
                            liveBottomBtn.onclick = (e) => {
                                e.stopPropagation();
                                try {
                                    if (window.hls && typeof window.hls.liveSyncPosition === 'number' && window.hls.liveSyncPosition > 0) {
                                        video.currentTime = window.hls.liveSyncPosition;
                                    } else if (window.shakaPlayer && typeof window.shakaPlayer.seekToLive === 'function') {
                                        window.shakaPlayer.seekToLive();
                                    } else if (window.dashPlayer && typeof window.dashPlayer.seekToLive === 'function') {
                                        window.dashPlayer.seekToLive();
                                    } else {
                                        const targetT = (video.seekable && video.seekable.length > 0) 
                                            ? video.seekable.end(video.seekable.length - 1) - 0.5 
                                            : (video.duration || 0);
                                        if (targetT > 0) {
                                            video.currentTime = targetT;
                                        }
                                    }
                                    if (video.paused) {
                                        video.play().catch(() => {});
                                    }
                                    showIndicator('⚡ Synced to Live Edge');
                                } catch(err) {
                                    console.warn("Live sync error:", err);
                                }
                            };

                            const timeEl = plyrControls.querySelector('.plyr__time--current');
                            if (timeEl) {
                                timeEl.parentNode.insertBefore(liveBottomBtn, timeEl);
                            } else {
                                plyrControls.insertBefore(liveBottomBtn, plyrControls.firstChild);
                            }
                        }
                    } catch(e) {}
                    
                    const container = plyrInstance?.elements?.container || document.querySelector('.plyr') || document.getElementById('player-container');
                    if (container) {
                        container.appendChild(topControls);
                    } else {
                        document.body.appendChild(topControls);
                    }
                }

                // Global Activity Watcher: Fade in UI on touch/move, fade out after 3.5 seconds of inactivity
                if (!window._uiFadeSetup) {
                    window._uiFadeSetup = true;
                    let fadeTimer = null;
                    
                    const showAllUI = () => {
                        const plyrContainer = document.querySelector('.plyr') || plyrInstance?.elements?.container;
                        const topControls = document.getElementById('top-controls');
                        const zoomControls = document.getElementById('embed-zoom-controls');
                        if (plyrContainer) {
                            plyrContainer.classList.remove('plyr--hide-controls');
                        }
                        if (topControls) {
                            topControls.style.opacity = '1';
                        }
                        if (zoomControls) {
                            zoomControls.style.opacity = '1';
                            zoomControls.style.pointerEvents = 'auto';
                        }
                        
                        if (fadeTimer) clearTimeout(fadeTimer);
                        fadeTimer = setTimeout(() => {
                            const activeModal = document.querySelector('#sleepModal:not(.hidden), #player-error:not(.hidden)');
                            if (activeModal) return;
                            
                            const isEmbedActive = document.getElementById('player-container')?.classList.contains('hls-embed-active');
                            const isPaused = isEmbedActive ? false : (plyrInstance ? plyrInstance.paused : false);
                            if (plyrContainer && !isPaused) {
                                plyrContainer.classList.add('plyr--hide-controls');
                                if (topControls) {
                                    topControls.style.opacity = '0';
                                    topControls.style.pointerEvents = 'none';
                                }
                                if (zoomControls) {
                                    zoomControls.style.opacity = '0';
                                    zoomControls.style.pointerEvents = 'none';
                                }
                            }
                        }, 3000);
                    };
                    window.showAllUI = showAllUI;

                    const events = ['mousemove', 'touchstart', 'touchmove', 'pointerdown', 'click', 'keydown'];
                    events.forEach(evt => {
                        window.addEventListener(evt, showAllUI, { passive: true });
                    });

                    if (plyrInstance) {
                        plyrInstance.on('controlsshown', showAllUI);
                        plyrInstance.on('controlshidden', () => {
                            const isEmbedActive = document.getElementById('player-container')?.classList.contains('hls-embed-active');
                            const isPaused = isEmbedActive ? false : (plyrInstance ? plyrInstance.paused : false);
                            const plyrContainer = document.querySelector('.plyr') || plyrInstance?.elements?.container;
                            const topControls = document.getElementById('top-controls');
                            const zoomControls = document.getElementById('embed-zoom-controls');
                            if (plyrContainer && !isPaused) {
                                plyrContainer.classList.add('plyr--hide-controls');
                                if (topControls) {
                                    topControls.style.opacity = '0';
                                    topControls.style.pointerEvents = 'none';
                                }
                                if (zoomControls) {
                                    zoomControls.style.opacity = '0';
                                    zoomControls.style.pointerEvents = 'none';
                                }
                            }
                        });
                    }

                    showAllUI();
                }
            }
            // High-Precision Smooth Touch Timeline & Seeking Engine
            function initSmoothTouchTimeline(player, video) {
                const container = player.elements?.container || video.closest('.plyr') || document.getElementById('player-container');
                if (!container) return;
                const progressEl = container.querySelector('.plyr__progress');
                if (!progressEl) return;

                const rangeInput = progressEl.querySelector('input[type="range"]');
                let isScrubbing = false;
                let scrubTargetTime = 0;
                let wasPausedBeforeScrub = false;
                let rafId = null;

                function formatTime(secs) {
                    if (isNaN(secs) || secs < 0) secs = 0;
                    const h = Math.floor(secs / 3600);
                    const m = Math.floor((secs % 3600) / 60);
                    const s = Math.floor(secs % 60);
                    if (h > 0) {
                        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                    }
                    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                }

                function updateScrubPosition(clientX) {
                    const rect = progressEl.getBoundingClientRect();
                    if (!rect.width) return;
                    let percent = (clientX - rect.left) / rect.width;
                    percent = Math.max(0, Math.min(1, percent));
                    
                    const duration = (player && player.duration > 0) ? player.duration : (video.duration > 0 ? video.duration : 0);
                    if (duration > 0) {
                        scrubTargetTime = percent * duration;
                        if (rangeInput) {
                            rangeInput.value = (percent * 100).toFixed(2);
                            rangeInput.style.setProperty('--value', `${(percent * 100).toFixed(1)}%`);
                        }
                        const curTimeEl = container.querySelector('.plyr__time--current');
                        if (curTimeEl) {
                            curTimeEl.textContent = formatTime(scrubTargetTime);
                        }
                    }
                }

                progressEl.addEventListener('touchstart', (e) => {
                    if (e.touches.length !== 1) return;
                    isScrubbing = true;
                    progressEl.classList.add('is-scrubbing');
                    wasPausedBeforeScrub = video.paused;
                    updateScrubPosition(e.touches[0].clientX);
                    e.stopPropagation();
                }, { passive: true });

                window.addEventListener('touchmove', (e) => {
                    if (!isScrubbing || e.touches.length !== 1) return;
                    if (rafId) cancelAnimationFrame(rafId);
                    rafId = requestAnimationFrame(() => {
                        updateScrubPosition(e.touches[0].clientX);
                    });
                    e.preventDefault();
                }, { passive: false });

                const endScrub = (e) => {
                    if (!isScrubbing) return;
                    isScrubbing = false;
                    progressEl.classList.remove('is-scrubbing');
                    if (rafId) cancelAnimationFrame(rafId);

                    const duration = (player && player.duration > 0) ? player.duration : (video.duration > 0 ? video.duration : 0);
                    if (duration > 0 && scrubTargetTime >= 0) {
                        try {
                            if (player) {
                                player.currentTime = scrubTargetTime;
                            } else {
                                video.currentTime = scrubTargetTime;
                            }
                        } catch(err) {
                            console.warn("Touch seek error:", err);
                        }
                    }
                    if (!wasPausedBeforeScrub && video.paused) {
                        video.play().catch(() => {});
                    }
                };

                window.addEventListener('touchend', endScrub, { passive: true });
                window.addEventListener('touchcancel', endScrub, { passive: true });
            }

            // Advanced Touch Gestures (Swipe Seek, Volume, Brightness, Double Tap -10s/+10s)
            function initAdvancedGestures(player, video) {
                const container = player.elements?.container || video.closest('.plyr') || document.getElementById('player-container');
                if (!container) return;

                // Create Touch Seek HUD element if not present
                let seekHud = document.getElementById('touchSeekHud');
                if (!seekHud) {
                    seekHud = document.createElement('div');
                    seekHud.id = 'touchSeekHud';
                    seekHud.className = 'touch-seek-hud';
                    seekHud.innerHTML = `
                        <div class="flex items-center gap-2">
                            <i data-lucide="fast-forward" class="w-5 h-5 text-red-500 hud-icon"></i>
                            <span class="hud-time">00:00</span>
                        </div>
                        <span class="hud-diff">+0s</span>
                        <div class="hud-bar"><div class="hud-bar-fill" style="width: 0%;"></div></div>
                    `;
                    container.appendChild(seekHud);
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }

                const indicator = document.getElementById('zoom-indicator');
                let indicatorTimeout = null;
                function showIndicator(text, iconHtml = '') {
                    if (!indicator) return;
                    indicator.innerHTML = (iconHtml ? `<span class="inline-flex items-center gap-1.5 mr-1">${iconHtml}</span>` : '') + `<span>${text}</span>`;
                    indicator.style.opacity = '1';
                    if (indicatorTimeout) clearTimeout(indicatorTimeout);
                    indicatorTimeout = setTimeout(() => {
                        indicator.style.opacity = '0';
                    }, 1200);
                }

                function formatTime(secs) {
                    if (isNaN(secs) || secs < 0) secs = 0;
                    const h = Math.floor(secs / 3600);
                    const m = Math.floor((secs % 3600) / 60);
                    const s = Math.floor(secs % 60);
                    if (h > 0) {
                        return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                    }
                    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
                }

                // --- MOBILE GESTURES & TOUCH-TO-PAUSE ENGINE ---
                let startX = 0, startY = 0;
                let isDragging = false;
                let dragType = null; // 'volume', 'brightness', 'seek'
                let initialValue = 0;
                let initialTime = 0;
                let targetSeekTime = 0;
                let brightness = 100;
                let lastTap = 0;
                let singleTapTimeout = null;

                container.addEventListener('touchstart', (e) => {
                    if (e.target.closest('.plyr__controls') || e.target.closest('button') || e.target.closest('.modal')) return;
                    if (e.touches.length === 1) {
                        startX = e.touches[0].clientX;
                        startY = e.touches[0].clientY;
                        isDragging = false;
                        dragType = null;
                        initialTime = (player && player.currentTime !== undefined) ? player.currentTime : (video.currentTime || 0);
                    }
                }, { passive: true });

                container.addEventListener('touchmove', (e) => {
                    if (e.target.closest('.plyr__controls') || e.target.closest('button') || e.target.closest('.modal')) return;
                    if (e.touches.length === 1) {
                        let moveX = e.touches[0].clientX;
                        let moveY = e.touches[0].clientY;
                        let diffX = moveX - startX;
                        let diffY = moveY - startY;
                        let absX = Math.abs(diffX);
                        let absY = Math.abs(diffY);
                        const rect = container.getBoundingClientRect();

                        if (!isDragging && (absX > 15 || absY > 15)) {
                            isDragging = true;
                            if (singleTapTimeout) {
                                clearTimeout(singleTapTimeout);
                                singleTapTimeout = null;
                            }
                            // Horizontal Swipe -> Smooth Seek
                            if (absX > absY * 1.15) {
                                dragType = 'seek';
                                initialTime = (player && player.currentTime !== undefined) ? player.currentTime : (video.currentTime || 0);
                                if (seekHud) seekHud.classList.add('active');
                            } else {
                                // Vertical Swipe -> Left Half = Brightness, Right Half = Volume
                                const touchX = startX - rect.left;
                                if (touchX < rect.width / 2) {
                                    dragType = 'brightness';
                                    initialValue = brightness;
                                } else {
                                    dragType = 'volume';
                                    initialValue = (player ? player.volume : video.volume) * 100;
                                }
                            }
                        }

                        if (isDragging) {
                            if (dragType === 'seek') {
                                const duration = (player && player.duration > 0) ? player.duration : (video.duration > 0 ? video.duration : 0);
                                const seekWindow = duration > 0 ? Math.min(300, Math.max(60, duration * 0.2)) : 90;
                                const seekDelta = (diffX / (rect.width * 0.7)) * seekWindow;
                                targetSeekTime = Math.max(0, Math.min(duration || Infinity, initialTime + seekDelta));
                                
                                if (seekHud) {
                                    const timeEl = seekHud.querySelector('.hud-time');
                                    const diffEl = seekHud.querySelector('.hud-diff');
                                    const fillEl = seekHud.querySelector('.hud-bar-fill');
                                    
                                    const formattedTarget = formatTime(targetSeekTime);
                                    const formattedDuration = duration > 0 ? formatTime(duration) : '';
                                    if (timeEl) timeEl.textContent = duration > 0 ? `${formattedTarget} / ${formattedDuration}` : formattedTarget;
                                    
                                    const diffSecs = Math.round(targetSeekTime - initialTime);
                                    if (diffEl) {
                                        diffEl.textContent = (diffSecs >= 0 ? `+${diffSecs}s` : `${diffSecs}s`);
                                        diffEl.className = `hud-diff font-extrabold ${diffSecs >= 0 ? 'text-emerald-400' : 'text-red-400'}`;
                                    }
                                    if (fillEl && duration > 0) {
                                        fillEl.style.width = `${Math.max(0, Math.min(100, (targetSeekTime / duration) * 100))}%`;
                                    }
                                }
                                e.preventDefault();
                            } else if (dragType === 'brightness') {
                                const change = (diffY / rect.height) * -200;
                                brightness = Math.max(20, Math.min(200, initialValue + change));
                                const pCont = document.getElementById('player-container') || document.body;
                                pCont.style.filter = `brightness(${brightness}%)`;
                                const sunIcon = '<svg class="w-4 h-4 text-amber-400 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
                                showIndicator(`Brightness: ${Math.round(brightness)}%`, sunIcon);
                                e.preventDefault();
                            } else if (dragType === 'volume') {
                                const change = (diffY / rect.height) * -1;
                                const newVolume = Math.max(0, Math.min(1, (initialValue / 100) + change));
                                if (player) player.volume = newVolume; else video.volume = newVolume;
                                const volPct = Math.round(newVolume * 100);
                                const volIcon = volPct === 0 
                                    ? '<svg class="w-4 h-4 text-red-400 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>'
                                    : '<svg class="w-4 h-4 text-emerald-400 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>';
                                showIndicator(`Volume: ${volPct}%`, volIcon);
                                e.preventDefault();
                            }
                        }
                    }
                }, { passive: false });

                container.addEventListener('touchend', (e) => {
                    if (seekHud) seekHud.classList.remove('active');
                    
                    if (isDragging && dragType === 'seek') {
                        if (targetSeekTime >= 0) {
                            if (player) player.currentTime = targetSeekTime; else video.currentTime = targetSeekTime;
                            showIndicator(`Seeked to ${formatTime(targetSeekTime)}`);
                        }
                        isDragging = false;
                        dragType = null;
                        return;
                    }

                    if (isDragging) {
                        isDragging = false;
                        dragType = null;
                        return;
                    }

                    if (e.target.closest('.plyr__controls') || e.target.closest('button') || e.target.closest('.modal')) {
                        return;
                    }

                    if (e.touches.length === 0) {
                        const currentTime = new Date().getTime();
                        const tapLength = currentTime - lastTap;
                        const rect = container.getBoundingClientRect();
                        const clientX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : (rect.left + rect.width / 2);
                        const x = clientX - rect.left;

                        // Check if this was a double tap
                        if (tapLength < 320 && tapLength > 0) {
                            if (singleTapTimeout) {
                                clearTimeout(singleTapTimeout);
                                singleTapTimeout = null;
                            }

                            // Left 28%: Rewind 10s
                            if (x < rect.width * 0.28) {
                                if (player && player.rewind) player.rewind(10); else video.currentTime = Math.max(0, video.currentTime - 10);
                                showIndicator('Rewind 10s «');
                            } 
                            // Right 28%: Forward 10s
                            else if (x > rect.width * 0.72) {
                                if (player && player.forward) player.forward(10); else video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
                                showIndicator('Forward 10s »');
                            } 
                            // Center: Double tap Play / Pause Toggle
                            else {
                                if (video.paused) {
                                    if (player && typeof player.play === 'function') {
                                        player.play().catch(() => video.play().catch(() => {}));
                                    } else {
                                        video.play().catch(() => {});
                                    }
                                    const playIconSvg = '<svg class="w-4 h-4 text-emerald-400 inline" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                                    showIndicator('Resumed Playback', playIconSvg);
                                } else {
                                    if (player && typeof player.pause === 'function') {
                                        player.pause();
                                    } else {
                                        video.pause();
                                    }
                                    const pauseIconSvg = '<svg class="w-4 h-4 text-amber-400 inline" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
                                    showIndicator('Paused', pauseIconSvg);
                                }
                            }
                            lastTap = 0;
                            e.preventDefault();
                        } else {
                            // Single tap
                            lastTap = currentTime;
                            if (singleTapTimeout) clearTimeout(singleTapTimeout);
                            singleTapTimeout = setTimeout(() => {
                                if (!isDragging) {
                                    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia('(pointer: coarse)').matches || (window.innerWidth < 768);
                                    if (isTouch) {
                                        // On mobile/touch devices: single tap toggles UI controls visibility instead of pausing video
                                        const plyrContainer = document.querySelector('.plyr') || (player && player.elements?.container);
                                        const topControls = document.getElementById('top-controls');
                                        if (plyrContainer) {
                                            const isHidden = plyrContainer.classList.contains('plyr--hide-controls');
                                            if (isHidden) {
                                                if (typeof window.showAllUI === 'function') {
                                                    window.showAllUI();
                                                } else {
                                                    plyrContainer.classList.remove('plyr--hide-controls');
                                                    if (topControls) topControls.style.opacity = '1';
                                                }
                                            } else {
                                                plyrContainer.classList.add('plyr--hide-controls');
                                                if (topControls) topControls.style.opacity = '0';
                                            }
                                        }
                                    } else {
                                        // Desktop single click: toggle play/pause
                                        if (video.paused) {
                                            if (player && typeof player.play === 'function') {
                                                player.play().catch(() => video.play().catch(() => {}));
                                            } else {
                                                video.play().catch(() => {});
                                            }
                                            showIndicator('▶ Playing');
                                        } else {
                                            if (player && typeof player.pause === 'function') {
                                                player.pause();
                                            } else {
                                                video.pause();
                                            }
                                            showIndicator('⏸ Paused');
                                        }
                                    }
                                }
                                singleTapTimeout = null;
                            }, 240);
                        }
                    }
                    isDragging = false;
                    dragType = null;
                }, { passive: false });

                // Desktop double click listener for pause & resume
                container.addEventListener('dblclick', (e) => {
                    if (e.target.closest('.plyr__controls') || e.target.closest('button') || e.target.closest('.modal')) return;
                    e.preventDefault();
                    if (video.paused) {
                        if (player && typeof player.play === 'function') {
                            player.play().catch(() => video.play().catch(() => {}));
                        } else {
                            video.play().catch(() => {});
                        }
                        const playIconSvg = '<svg class="w-4 h-4 text-emerald-400 inline" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
                        showIndicator('Resumed Playback', playIconSvg);
                    } else {
                        if (player && typeof player.pause === 'function') {
                            player.pause();
                        } else {
                            video.pause();
                        }
                        const pauseIconSvg = '<svg class="w-4 h-4 text-amber-400 inline" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>';
                        showIndicator('Paused', pauseIconSvg);
                    }
                });

                // Initialize Timeline Touch Scrubbing
                initSmoothTouchTimeline(player, video);

                // Initialize Cinematic Screen Stop (Pause State) Animation
                initScreenStopAnimation(player, video);
            }

            // Cinematic Screen Stop (Pause State) Animation Controller
            function initScreenStopAnimation(player, video) {
                const overlay = document.getElementById('screen-stop-overlay');
                if (!overlay || window._screenStopSetup) return;
                window._screenStopSetup = true;

                const titleEl = document.getElementById('stop-overlay-title');
                if (titleEl && (name || document.title)) {
                    titleEl.textContent = name || document.title.replace(/\s*\|\s*Live.*$/i, '');
                }

                let resumeTimer = null;

                const showStopOverlay = () => {
                    if (!video.paused) return;
                    const loading = document.getElementById('loading');
                    if (loading && loading.style.display !== 'none' && !loading.classList.contains('hidden') && loading.style.opacity !== '0') return;
                    const errModal = document.getElementById('player-error');
                    if (errModal && !errModal.classList.contains('hidden')) return;

                    if (titleEl && (name || document.title)) {
                        titleEl.textContent = name || document.title.replace(/\s*\|\s*Live.*$/i, '');
                    }

                    overlay.classList.remove('resuming');
                    overlay.classList.add('active');
                };

                const hideStopOverlay = () => {
                    if (overlay.classList.contains('active')) {
                        overlay.classList.remove('active');
                        overlay.classList.add('resuming');
                        if (resumeTimer) clearTimeout(resumeTimer);
                        resumeTimer = setTimeout(() => {
                            overlay.classList.remove('resuming');
                        }, 320);
                    }
                };

                video.addEventListener('pause', showStopOverlay);
                video.addEventListener('play', hideStopOverlay);
                video.addEventListener('playing', hideStopOverlay);
                video.addEventListener('ended', showStopOverlay);

                if (player) {
                    player.on('pause', showStopOverlay);
                    player.on('play', hideStopOverlay);
                    player.on('playing', hideStopOverlay);
                }

                overlay.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hideStopOverlay();
                    if (video.paused) {
                        if (player && typeof player.play === 'function') {
                            player.play().catch(() => video.play().catch(() => {}));
                        } else {
                            video.play().catch(() => {});
                        }
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
            // Akamai __hdnea__ Token Interceptor for JioTV DASH Chunks (.m4s)
            if (!window._xhrAkamaiIntercepted) {
                window._xhrAkamaiIntercepted = true;
                const origXhrOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, urlStr, ...rest) {
                    if (urlStr && typeof urlStr === 'string' && window._activeAkamaiToken) {
                        if ((urlStr.includes('.mpd') || urlStr.includes('.m4s') || urlStr.includes('jio')) && !urlStr.includes('__hdnea__')) {
                            urlStr = urlStr + (urlStr.includes('?') ? '&' : '?') + window._activeAkamaiToken;
                        }
                    }
                    return origXhrOpen.call(this, method, urlStr, ...rest);
                };
            }

            window.reconnectAttempts = 0;
            const MAX_RECONNECT_ATTEMPTS = 3;
            // Smart Auto-Reconnect Watchdog
            window.triggerAutoReconnect = async function() {
                if (isReconnecting) return;
                window.reconnectAttempts++;
                if (window.reconnectAttempts > MAX_RECONNECT_ATTEMPTS) {
                    console.warn(`[Player] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached.`);
                    isReconnecting = false;
                    loading.style.display = 'none';
                    showPlayerError("⚠️ Stream Buffering or Offline: The live feed token expired or is unreachable. Use the VLC button above to watch directly or choose another match.");
                    return;
                }
                isReconnecting = true;
                console.warn(`[Player] Triggering Auto-Reconnect (Attempt ${window.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
                loading.style.display = 'flex';
                if (typeof destroyMpegPlayer === 'function') {
                    destroyMpegPlayer();
                } else if (mpegPlayer) {
                    try {
                        mpegPlayer.destroy();
                    } catch(e){}
                    mpegPlayer = null;
                }
                if (hls) {
                    try { hls.destroy(); const v = document.getElementById('player'); if(v){ v.src = ''; v.load(); } } catch(e){}
                    hls = null;
                }
                const urlParams = new URLSearchParams(window.location.search);
                const rawIdParam = urlParams.get('channel_id') || urlParams.get('channelId') || urlParams.get('id') || urlParams.get('url') || '';
                const isBingrReq = urlParams.has('media_type') || urlParams.has('type') || urlParams.has('tmdbId') || urlParams.has('srv') || (rawIdParam && !isNaN(Number(rawIdParam)) && rawIdParam.length > 3);
                
                if (!isBingrReq && rawIdParam && !rawIdParam.startsWith('http') && !rawIdParam.includes('.mp4') && !rawIdParam.includes('.mkv')) {
                    try {
                        const resolveRes = await fetch(`/api/resolve_stream/${encodeURIComponent(rawIdParam)}?nocache=1`);
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
                    if (isReconnecting || video.paused || video.ended || video.seeking || video.readyState < 2) {
                        lastCurrentTime = video.currentTime;
                        lastProgressTime = Date.now();
                        return;
                    }
                    if (video.currentTime !== lastCurrentTime) {
                        lastCurrentTime = video.currentTime;
                        lastProgressTime = Date.now();
                    } else {
                        const stalledTime = Date.now() - lastProgressTime;
                        if (stalledTime >= 15000 && stalledTime < 18000) {
                            console.warn('[Watchdog] Prolonged stall (15s). Requesting load start...');
                            if (hls) {
                                try { hls.startLoad(); } catch(e){}
                            }
                            if (video.paused && !video.ended) {
                                video.play().catch(() => {});
                            }
                        } else if (stalledTime > 35000) {
                            console.warn(`[Watchdog] Stream playback frozen for ${Math.round(stalledTime/1000)}s. Auto-reconnecting...`);
                            lastProgressTime = Date.now();
                            triggerAutoReconnect();
                        }
                    }
                }, 1000);
            }
            // Live player subtitles / sources cache
            window.bingrSources = [];
            window.bingrSubtitles = [];

            window.injectBingrSubtitles = function() {
                const video = document.getElementById('player');
                if (!video) return;
                
                // Ensure CORS is set for subtitles
                if (video.crossOrigin !== 'anonymous') {
                    video.crossOrigin = 'anonymous';
                }
                
                const addTracks = () => {
                    if (window.bingrSubtitles && window.bingrSubtitles.length > 0) {
                        window.bingrSubtitles.forEach((sub, idx) => {
                            let vttUrl = sub.url;
                            if (sub.url && sub.url.includes('.srt')) {
                                vttUrl = '/api/bingr/srt2vtt?url=' + encodeURIComponent(sub.url);
                            }
                            
                            const label = sub.label || sub.lang || 'Subtitle ' + (idx+1);
                            
                            // Check if track with same label exists, update src instead of duplicating
                            let existingTrack = null;
                            video.querySelectorAll('track').forEach(t => {
                                if (t.label === label) existingTrack = t;
                            });
                            
                            if (existingTrack) {
                                if (existingTrack.getAttribute('src') !== vttUrl) {
                                    existingTrack.setAttribute('src', vttUrl);
                                }
                                return;
                            }
                            
                            const track = document.createElement('track');
                            track.kind = 'subtitles';
                            track.label = label;
                            track.srclang = sub.lang || 'en';
                            track.src = vttUrl;
                            track.default = false; 
                            video.appendChild(track);
                        });
                    }
                };
                
                addTracks();
                video.addEventListener('loadedmetadata', addTracks, { once: true });
            }

            // Main Player Initialization
            // Main Player Initialization
            async function initPlayer() {
                if (!src) {
                    showPlayerError("No stream URL specified.");
                    return;
                }
                // 15 seconds fallback warning
                setTimeout(() => {
                    const fallbackBtn = document.getElementById('loading-fallback');
                    if (fallbackBtn) fallbackBtn.classList.remove('hidden');
                }, 15000);

                const urlParams = new URLSearchParams(window.location.search);
                const rawUrl = (urlParams.get('url') || '').toLowerCase();
                const checkSrc = (src || '').toLowerCase();
                let resolvedSrc = ensureProxiedSportsUrl(src);
                src = resolvedSrc;
                let drmKeyId = (urlParams.get('key_id') || urlParams.get('keyid') || '').trim();
                let drmKey = (urlParams.get('key') || '').trim();
                const clearkeyParam = urlParams.get('clearkey');
                if (clearkeyParam && clearkeyParam.includes(':') && (!drmKeyId || !drmKey)) {
                    const ckParts = clearkeyParam.split(':');
                    const pId = (ckParts[0] || '').trim().replace(/[^0-9a-fA-F]/g, '');
                    const pKey = (ckParts[1] || '').trim().replace(/[^0-9a-fA-F]/g, '');
                    if (pId.length === 32 && pKey.length === 32) {
                        drmKeyId = pId;
                        drmKey = pKey;
                    }
                }
                const channelIdParam = (urlParams.get('channel_id') || '').toLowerCase();
                const eventIdParam = (urlParams.get('event_id') || '').toLowerCase();
                const channelParam = (channelIdParam || urlParams.get('id') || urlParams.get('channel') || '').toLowerCase();
                let isExplicitDash = (urlParams.get('type') === 'dash' || urlParams.get('type') === 'mpd' || !!drmKeyId);

                // If src is a /player/mdtv embed URL, extract stream URL and key
                if (src && (src.includes('/player/mdtv') || src.includes('player_mdtv.html') || src.includes('/player/'))) {
                    try {
                        const parsedP = new URL(src, window.location.origin);
                        const pStream = parsedP.searchParams.get('stream');
                        const pKey = parsedP.searchParams.get('key');
                        const pId = parsedP.searchParams.get('id');
                        if (pStream) {
                            src = decodeURIComponent(pStream);
                            resolvedSrc = src;
                        } else if (pId) {
                            const cleanMdtvId = pId.replace(/^mdtv[-_]?/i, '');
                            src = `/live.php?token=STALKER_PRO&id=mdtv-${encodeURIComponent(cleanMdtvId)}&m3u=1`;
                            resolvedSrc = src;
                        }
                        if (pKey && (!drmKeyId || !drmKey)) {
                            const ckParts = decodeURIComponent(pKey).split(':');
                            if (ckParts.length === 2) {
                                const c1 = ckParts[0].trim().replace(/[^0-9a-fA-F]/g, '');
                                const c2 = ckParts[1].trim().replace(/[^0-9a-fA-F]/g, '');
                                if (c1.length === 32 && c2.length === 32) {
                                    drmKeyId = c1;
                                    drmKey = c2;
                                    isExplicitDash = true;
                                }
                            }
                        }
                    } catch(e) {}
                }

                const isDirectRequested = urlParams.get('direct') === '1' || urlParams.get('raw') === '1' || urlParams.get('noproxy') === '1';
                // Check for live sporting event
                const isEvent = !isDirectRequested && (eventIdParam || channelIdParam.startsWith('live-event-') || channelIdParam.startsWith('cric-event-') || channelIdParam.startsWith('fancode-') || channelIdParam.startsWith('prime-') || channelIdParam.startsWith('sonyliv-') || channelIdParam.startsWith('sports_'));
                if (isEvent) {
                    const eventId = eventIdParam || channelIdParam;
                    try {
                        const statusEl = document.getElementById('apple-loading-status');
                        if (statusEl) statusEl.textContent = `Resolving Live Sports Event...`;
                        const res = await fetch(`/api/live/event/${encodeURIComponent(eventId)}`);
                        if (res.ok) {
                            const ev = await res.json();
                            if (ev && ev.stream_url) {
                                src = ev.stream_url;
                                resolvedSrc = src;
                                const sLower = src.toLowerCase();
                                const isFanCode = ev.source === 'fancode' || ev.badge === 'FANCODE' || sLower.includes('fancode') || sLower.includes('in-mc-flive') || sLower.includes('in-ak-flive') || sLower.includes('dai-fancode');
                                const isSony = ev.source === 'sonyliv' || sLower.includes('sonyliv') || sLower.includes('akamaized.net') || sLower.includes('sonymtmnew') || sLower.includes('sonydaimenew') || sLower.includes('slivcdn') || sLower.includes('dishmt') || sLower.includes('sony');
                                if (isFanCode) {
                                    if (!src.startsWith('https://proxy-web-sage.vercel.app/api/live-proxy?url=')) {
                                        src = `https://proxy-web-sage.vercel.app/api/live-proxy?url=${src}`;
                                    }
                                    resolvedSrc = src;
                                } else if (isSony) {
                                    window._currentDirectStreamUrl = ev.stream_url;
                                    if (!src.startsWith('/live.php?url=')) {
                                        if (src.includes('sonydaimenew.akamaized.net')) {
                                            src = src.replace(/sonydaimenew\.akamaized\.net/g, 'sonymtmnew.akamaized.net');
                                        }
                                        src = `/live.php?url=${encodeURIComponent(src)}`;
                                    }
                                    resolvedSrc = src;
                                }
                                if (ev.key_id && ev.key) {
                                    const cId = (ev.key_id + '').trim().replace(/[^0-9a-fA-F]/g, '');
                                    const cKey = (ev.key + '').trim().replace(/[^0-9a-fA-F]/g, '');
                                    if (cId.length === 32 && cKey.length === 32) {
                                        drmKeyId = cId;
                                        drmKey = cKey;
                                        window._activeClearKeyId = drmKeyId;
                                        window._activeClearKey = drmKey;
                                        isExplicitDash = true;
                                    }
                                }
                                if (ev.name) {
                                    name = ev.name;
                                    document.title = `${ev.name} | Live Sports`;
                                    const titleEl = document.getElementById('media-title');
                                    if (titleEl) titleEl.textContent = ev.name;
                                }
                            }
                        }
                    } catch (e) {}
                }

                // Detect TimStreams / DLHD / Embed Live Streams
                const isTimOrEmbed = channelIdParam.startsWith('tim_') || 
                                     channelIdParam.startsWith('dlhd') || 
                                     channelIdParam.startsWith('embed') || 
                                     rawUrl.includes('/api/play_stream/tim_') ||
                                     rawUrl.includes('/api/play_stream/dlhd') ||
                                     rawUrl.includes('/api/play_stream/embed');

                if (isTimOrEmbed) {
                    try {
                        const lookupId = channelIdParam || (rawUrl.match(/\/api\/play_stream\/([a-zA-Z0-9_-]+)/i)?.[1]) || '';
                        if (lookupId) {
                            const statusEl = document.getElementById('apple-loading-status');
                            if (statusEl) statusEl.textContent = `Resolving Live Sports Stream...`;
                            const resolveRes = await fetch(`/api/resolve_stream/${encodeURIComponent(lookupId)}`);
                            if (resolveRes.ok) {
                                const resolveData = await resolveRes.json();
                                if (resolveData && resolveData.url) {
                                    src = ensureProxiedSportsUrl(resolveData.url);
                                    resolvedSrc = src;
                                    console.log("[Player] Resolved TimStream URL:", src);
                                }
                            }
                        }
                    } catch(e) {}
                }

                // Detect Live TV channels (JioTV, MDTV, SonyLIV, Hotstar)
                let cleanId = '';
                if (channelIdParam && !isTimOrEmbed) {
                    cleanId = channelIdParam.replace(/^(?:jtv|mdtv|zee|sports)[-_]/i, '').replace(/\.mpd$/i, '');
                }
                if (!cleanId && !isTimOrEmbed) {
                    const m = (checkSrc + ' ' + rawUrl).match(/(?:jtv|mdtv|zee|manifest|stream)[-_/]([a-zA-Z0-9_-]+)/i) ||
                              (checkSrc + ' ' + rawUrl).match(/[?&]id=(?:jtv-|mdtv-|zee-)?([a-zA-Z0-9_-]+)/i);
                    if (m) {
                        cleanId = m[1].replace(/^(?:jtv|mdtv|zee)[-_]/i, '').replace(/\.mpd$/i, '');
                    }
                }
                if (!cleanId && /^\d{3,5}$/.test(channelParam)) {
                    cleanId = channelParam;
                }
                if (!cleanId && (name || '').toLowerCase().includes('bigboss')) {
                    cleanId = 'hotstar-4';
                }

                const isChannel = !isDirectRequested && !isTimOrEmbed && (channelIdParam.startsWith('jtv-') || channelIdParam.startsWith('mdtv-') || channelIdParam.startsWith('zee-') || /^\d{3,5}$/.test(cleanId) || channelIdParam.includes('hotstar') || channelIdParam.includes('sonyliv'));

                if (isChannel && cleanId) {
                    try {
                        const statusEl = document.getElementById('apple-loading-status');
                        if (statusEl) statusEl.textContent = `Resolving channel ${cleanId}...`;
                        console.log("[Player] Resolving channel stream metadata for:", cleanId);
                        
                        let ch = null;
                        const res = await fetch(`/api/mdtv/stream/${encodeURIComponent(cleanId)}`);
                        if (res.ok) {
                            ch = await res.json();
                        } else {
                            const jtvRes = await fetch(`/api/jtv/stream/${encodeURIComponent(cleanId)}`);
                            if (jtvRes.ok) ch = await jtvRes.json();
                        }

                        if (ch) {
                            const cId = (ch.key_id + '').trim().replace(/[^0-9a-fA-F]/g, '');
                            const cKey = (ch.key + '').trim().replace(/[^0-9a-fA-F]/g, '');
                            const hasValidClearKey = cId.length === 32 && cKey.length === 32;

                            const isDashStream = ch.manifest_type === 'mpd' || 
                                                 (ch.manifest_url && ch.manifest_url.includes('.mpd')) || 
                                                 (ch.stream_url && ch.stream_url.includes('.mpd')) || 
                                                 (ch.full_stream_url && ch.full_stream_url.includes('.mpd')) || 
                                                 hasValidClearKey || !!ch.clearkey;

                            if (!isDashStream && (ch.source === 'sonyliv' || ch.stream_url?.includes('.m3u8') || ch.full_stream_url?.includes('.m3u8'))) {
                                // Direct HLS stream (SonyLIV, FanCode HLS)
                                src = ch.full_stream_url || ch.stream_url;
                                const sLower = (src || '').toLowerCase();
                                const isFanCode = ch.source === 'fancode' || sLower.includes('fancode') || sLower.includes('in-mc-flive') || sLower.includes('in-ak-flive');
                                const isSony = ch.source === 'sonyliv' || sLower.includes('sonyliv') || sLower.includes('akamaized.net') || sLower.includes('sonymtmnew') || sLower.includes('sonydaimenew') || sLower.includes('slivcdn') || sLower.includes('dishmt') || sLower.includes('sony');
                                if (isFanCode) {
                                    if (!src.startsWith('https://proxy-web-sage.vercel.app/api/live-proxy?url=')) {
                                        src = `https://proxy-web-sage.vercel.app/api/live-proxy?url=${src}`;
                                    }
                                } else if (isSony) {
                                    window._currentDirectStreamUrl = src;
                                    if (!src.startsWith('/live.php?url=')) {
                                        if (src.includes('sonydaimenew.akamaized.net')) {
                                            src = src.replace(/sonydaimenew\.akamaized\.net/g, 'sonymtmnew.akamaized.net');
                                        }
                                        src = `/live.php?url=${encodeURIComponent(src)}`;
                                    }
                                }
                                resolvedSrc = src;
                            } else {
                                // DASH ClearKey stream (JioTV, Hotstar DASH, etc.)
                                isExplicitDash = true;
                                if (hasValidClearKey) {
                                    src = ch.full_stream_url || ch.manifest_url || `/api/mdtv/manifest/${ch.id}.mpd` || ch.stream_url;
                                    resolvedSrc = src;
                                    if (ch.token) window._activeAkamaiToken = ch.token;
                                    drmKeyId = cId;
                                    drmKey = cKey;
                                    window._activeClearKeyId = drmKeyId;
                                    window._activeClearKey = drmKey;
                                } else {
                                    if (src && src.includes('.m3u8')) {
                                        resolvedSrc = src;
                                    } else {
                                        src = ch.full_stream_url || ch.manifest_url || `/api/mdtv/manifest/${ch.id}.mpd` || ch.stream_url;
                                        resolvedSrc = src;
                                    }
                                    if (ch.token) window._activeAkamaiToken = ch.token;
                                    drmKeyId = '';
                                    drmKey = '';
                                    window._activeClearKeyId = '';
                                    window._activeClearKey = '';
                                }
                            }
                            if (ch.name && (!name || name === 'Live Stream' || name === 'Live Channel')) {
                                name = ch.name;
                                document.title = `${ch.name} | Live TV`;
                                const titleEl = document.getElementById('media-title');
                                if (titleEl) titleEl.textContent = ch.name;
                            }
                        }
                    } catch (err) {
                        console.warn("[Player] Channel resolution error, attempting direct stream:", err);
                    }
                }

                // Extract Akamai token if present in stream URL or token/cookie parameters
                const tokenMatch = (src + ' ' + (urlParams.get('url') || '') + ' ' + (urlParams.get('token') || '') + ' ' + (urlParams.get('cookie') || '')).match(/(__hdnea__=[^&\s;]+)/);
                if (tokenMatch && !window._activeAkamaiToken) {
                    window._activeAkamaiToken = tokenMatch[1];
                }

                // Auto-route FanCode and SonyLIV protected HLS through proxy-web-sage (direct HLS, never wrap DASH .mpd)
                if (!isDirectRequested && src) {
                    const sLower = src.toLowerCase();
                    const isMpdManifest = sLower.includes('.mpd') || sLower.includes('manifest');
                    if (!isMpdManifest) {
                        const isFanCode = sLower.includes('fancode') || sLower.includes('in-mc-flive') || sLower.includes('in-ak-flive') || sLower.includes('dai-fancode');
                        const isSony = sLower.includes('sonydaimenew') || sLower.includes('sonymtmnew') || sLower.includes('akamaized.net') || sLower.includes('sonyliv') || sLower.includes('slivcdn') || sLower.includes('dishmt') || sLower.includes('sony');
                        if (isFanCode) {
                            if (!src.startsWith('https://proxy-web-sage.vercel.app/api/live-proxy?url=')) {
                                src = `https://proxy-web-sage.vercel.app/api/live-proxy?url=${src}`;
                            }
                            resolvedSrc = src;
                        } else if (isSony) {
                            window._currentDirectStreamUrl = src;
                            if (!src.startsWith('/live.php?url=')) {
                                if (src.includes('sonydaimenew.akamaized.net')) {
                                    src = src.replace(/sonydaimenew\.akamaized\.net/g, 'sonymtmnew.akamaized.net');
                                }
                                src = `/live.php?url=${encodeURIComponent(src)}`;
                            }
                            resolvedSrc = src;
                        }
                    }
                }

                // Global XHR & Fetch interceptor for direct DASH JioTV chunks only (never touch proxied URLs or HLS)
                if (!window._xhrIntercepted) {
                    window._xhrIntercepted = true;
                    const origOpen = XMLHttpRequest.prototype.open;
                    XMLHttpRequest.prototype.open = function(method, u, ...args) {
                        if (u && typeof u === 'string' && window._activeAkamaiToken) {
                            if (!u.includes('stream_proxy.php') && !u.includes('/api/proxy/') && !u.includes('live.php') && !u.includes('proxy-web-sage')) {
                                if ((u.includes('.mpd') || u.includes('.m4s') || u.includes('.dash') || u.includes('jio')) && !u.includes('__hdnea__')) {
                                    const token = window._activeAkamaiToken.startsWith('__hdnea__=') 
                                        ? window._activeAkamaiToken 
                                        : ('__hdnea__=' + window._activeAkamaiToken);
                                    u = u + (u.includes('?') ? '&' : '?') + token;
                                }
                            }
                        }
                        return origOpen.call(this, method, u, ...args);
                    };

                    const origFetch = window.fetch;
                    window.fetch = function(input, init) {
                        if (typeof input === 'string' && window._activeAkamaiToken) {
                            if (!input.includes('stream_proxy.php') && !input.includes('/api/proxy/') && !input.includes('live.php') && !input.includes('proxy-web-sage')) {
                                if ((input.includes('.mpd') || input.includes('.m4s') || input.includes('.dash') || input.includes('jio')) && !input.includes('__hdnea__')) {
                                    const token = window._activeAkamaiToken.startsWith('__hdnea__=') 
                                        ? window._activeAkamaiToken 
                                        : ('__hdnea__=' + window._activeAkamaiToken);
                                    input = input + (input.includes('?') ? '&' : '?') + token;
                                }
                            }
                        }
                        return origFetch.call(this, input, init);
                    };
                }

                const lowerSrc = (src || '').toLowerCase();
                let decodedLowerSrc = lowerSrc;
                try { decodedLowerSrc = decodeURIComponent(lowerSrc); } catch(e){}
                const urlParamsForMedia = new URLSearchParams(window.location.search);
                const mediaTypeParam = (urlParamsForMedia.get('type') || '').toLowerCase();
                isExplicitDash = isExplicitDash || (!lowerSrc.includes('.m3u8') && !decodedLowerSrc.includes('.m3u8') && (
                    lowerSrc.includes('.mpd') ||
                    decodedLowerSrc.includes('.mpd') ||
                    mediaTypeParam === 'dash' ||
                    mediaTypeParam === 'mpd' ||
                    (!!drmKeyId && !lowerSrc.includes('.m3u8'))
                ));
                const isMovieOrSeries = urlParamsForMedia.get('media_type') === 'movie' || urlParamsForMedia.get('media_type') === 'series';
                const isMkv = lowerSrc.includes('.mkv') || decodedLowerSrc.includes('.mkv');
                const isForceHls = !isExplicitDash && (urlParamsForMedia.get('type') === 'hls' || urlParamsForMedia.get('hls') === '1' || lowerSrc.includes('type=hls') || lowerSrc.includes('hls=1') || lowerSrc.includes('.m3u8') || lowerSrc.includes('m3u=1'));
                
                // "make hls m3u if it is mkv not hls use mpeg buttery smooth"
                const isExplicitTs = !isExplicitDash && !isForceHls && (
                    isMkv ||
                    lowerSrc.endsWith('.ts') ||
                    lowerSrc.includes('custom_ts=1') ||
                    lowerSrc.includes('type=mpegts') ||
                    lowerSrc.includes('type=ts') ||
                    mediaTypeParam === 'mpegts'
                );

                const isDirectVideoFile = lowerSrc.endsWith('.mp4') || lowerSrc.endsWith('.webm') || lowerSrc.endsWith('.m4v') || lowerSrc.endsWith('.mov') || lowerSrc.endsWith('.mp3');
                const isDirectMedia = !isMkv && !isExplicitDash && !isForceHls && isDirectVideoFile;
                const isFromBingrSources = (window.bingrSources || []).some(s => s && s.url && (s.url === src || src.startsWith(s.url) || s.url.startsWith(src)));
                
                // Identify CORS-restricted domains that absolutely must be proxied by Node backend
                const needsProxy = lowerSrc.includes('peakstorm') || 
                                   lowerSrc.includes('nxocw') || 
                                   lowerSrc.includes('flocw') || 
                                   lowerSrc.includes('knocw') || 
                                   lowerSrc.includes('streamrip') || 
                                   lowerSrc.includes('filmu') ||
                                   lowerSrc.includes('acek-cdn') ||
                                   lowerSrc.includes('dramiyos') ||
                                   lowerSrc.includes('morencius') ||
                                   lowerSrc.includes('movies4u') ||
                                   lowerSrc.includes('m4uplay');

                const isDirectCorsAllowed = !needsProxy && (
                    lowerSrc.includes('workers.dev') ||
                    lowerSrc.includes('hakunaymatata') ||
                    lowerSrc.includes('jiotv') ||
                    lowerSrc.includes('jio.com') ||
                    lowerSrc.includes('/api/proxy') ||
                    lowerSrc.includes('proxy/fancode') ||
                    lowerSrc.includes('proxy/hls') ||
                    lowerSrc.includes('hotstar-cdn.net') ||
                    lowerSrc.includes('hotstar.com') ||
                    lowerSrc.includes('fancode.com') ||
                    lowerSrc.includes('sonyliv.com') ||
                    lowerSrc.includes('akamaized.net') ||
                    lowerSrc.includes('.m3u8') ||
                    isForceHls
                );

                const curChannelId = urlParamsForMedia.get('channel_id') || '';
                const curName = urlParamsForMedia.get('name') || '';
                const isAirtelChannel = (curChannelId && (curChannelId.startsWith('airtel-') || curChannelId.startsWith('airtel_'))) || (urlParamsForMedia.get('source') === 'airtel') || lowerSrc.includes('yolomax.pro');

                if (isAirtelChannel) {
                    // Pure direct HLS stream for Airtel channels (works seamlessly in Hls.js without Stalker VR proxying)
                    if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/api/proxy'))) {
                        resolvedSrc = src;
                    } else if (src && src.includes('live.php')) {
                        resolvedSrc = src;
                    } else {
                        resolvedSrc = `/api/airtel/stream/${encodeURIComponent(curChannelId || src)}`;
                    }
                } else if ((src.startsWith('http://') || src.startsWith('https://')) && !src.includes('live.php') && !src.includes('xtream.php')) {
                    if (isExplicitDash || lowerSrc.includes('.mpd') || lowerSrc.includes('jio')) {
                        resolvedSrc = src; // Native DASH ClearKey streams must be fetched directly by Dash.js
                    } else if (isExplicitTs) {
                        resolvedSrc = `/api/stream-proxy?url=${encodeURIComponent(src)}&type=mpegts`;
                    } else if (isDirectCorsAllowed || lowerSrc.includes('/api/proxy') || lowerSrc.includes('.m3u8')) {
                        resolvedSrc = src; // Keep direct URL or local proxy for HLS streams
                    } else {
                        resolvedSrc = `/live.php?id=${encodeURIComponent(src)}&m3u=1${curChannelId ? `&channel_id=${encodeURIComponent(curChannelId)}` : ''}${curName ? `&name=${encodeURIComponent(curName)}` : ''}`;
                    }
                }
                try {
                    resolvedSrc = new URL(resolvedSrc, window.location.origin).href;
                } catch(e) {
                    console.warn("URL resolution error:", e);
                }

                let isAutoplayMuted = false;

                function showUnmuteBadge() {
                    let badge = document.getElementById('unmuteFloatingBadge');
                    if (!badge) {
                        badge = document.createElement('div');
                        badge.id = 'unmuteFloatingBadge';
                        badge.className = 'fixed top-6 right-6 z-[99999] flex items-center gap-2.5 px-4 py-2.5 bg-red-600/95 hover:bg-red-500 text-white text-xs sm:text-sm font-black tracking-wide rounded-full shadow-2xl border border-white/30 cursor-pointer select-none backdrop-blur-md transition-all active:scale-95 animate-bounce';
                        badge.innerHTML = `
                            <svg class="w-4 h-4 shrink-0 animate-pulse text-white" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>
                            <span>TAP OR PRESS OK TO UNMUTE</span>
                        `;
                        badge.onclick = (e) => {
                            e.stopPropagation();
                            unmuteAndPlay();
                        };
                        document.body.appendChild(badge);
                    }
                    badge.style.display = 'flex';
                }

                function hideUnmuteBadge() {
                    const badge = document.getElementById('unmuteFloatingBadge');
                    if (badge) badge.style.display = 'none';
                }

                function unmuteAndPlay() {
                    try {
                        video.muted = false;
                        if (window.plyrPlayer) window.plyrPlayer.muted = false;
                        if (window.player) window.player.muted = false;
                        isAutoplayMuted = false;
                        hideUnmuteBadge();
                        if (video.paused) {
                            video.play().catch(() => {});
                        }
                        console.log("[Audio Recovery] Audio unmuted successfully!");
                    } catch(e) {}
                }

                function triggerSafePlayback(source = 'general') {
                    const p = video.play();
                    if (p !== undefined && p && p.catch) {
                        p.then(() => {
                            console.log(`[Playback Engine] ${source} play() succeeded with audio!`);
                            if (!video.muted) {
                                hideUnmuteBadge();
                            }
                        }).catch(err => {
                            console.warn(`[Playback Engine] ${source} direct unmuted play blocked (${err.name}). Engaging muted autoplay fallback...`);
                            video.muted = true;
                            if (window.plyrPlayer) {
                                try { window.plyrPlayer.muted = true; } catch(e){}
                            }
                            if (window.player) {
                                try { window.player.muted = true; } catch(e){}
                            }
                            isAutoplayMuted = true;
                            video.play().then(() => {
                                console.log(`[Playback Engine] ${source} muted autoplay succeeded! Showing unmute badge.`);
                                showUnmuteBadge();
                            }).catch(e2 => {
                                console.warn(`[Playback Engine] ${source} muted autoplay also blocked (${e2.name}). Awaiting user click.`);
                            });
                        });
                    }
                }

                // Initial user gesture listener for TV remote, keyboard, touch to unmute blocked autoplay
                let hasHandledInitialUnmute = false;
                function handleInitialUserUnmute() {
                    if (hasHandledInitialUnmute) return;
                    if (isAutoplayMuted || video.muted) {
                        hasHandledInitialUnmute = true;
                        unmuteAndPlay();
                    }
                }
                ['click', 'touchstart', 'keydown'].forEach(evt => {
                    document.addEventListener(evt, handleInitialUserUnmute, { once: true, passive: true });
                });

                function destroyMpegPlayer() {
                    if (mpegPlayer) {
                        try {
                            mpegPlayer.destroy();
                        } catch(e){}
                        mpegPlayer = null;
                    }
                }
                function loadMpegTs(streamUrl) {
                    if (!streamUrl || streamUrl.includes('.m3u8') || streamUrl.includes('.mpd')) {
                        console.warn("[MPEG-TS Engine] Skipping MPEG-TS loader for playlist manifest:", streamUrl);
                        if (streamUrl && streamUrl.includes('.mpd')) {
                            loadShaka(streamUrl);
                        } else if (Hls.isSupported()) {
                            loadHls(streamUrl);
                        }
                        return;
                    }
                    try {
                        streamUrl = new URL(streamUrl, window.location.origin).href;
                    } catch(e){}
                    console.log("[MPEG-TS Engine] Initializing buttery-smooth mpegts.js for stream:", streamUrl);
                    destroyMpegPlayer();
                    try {
                        const isLive = !isMkv && (lowerSrc.includes('/live/') || lowerSrc.endsWith('.ts'));
                        mpegPlayer = mpegts.createPlayer({
                            type: 'mpegts',
                            isLive: isLive,
                            url: streamUrl
                        }, {
                            enableWorker: true,
                            enableStashBuffer: false,
                            stashInitialSize: 256,
                            liveBufferLatencyChasing: isLive,
                            liveBufferLatencyMaxLatency: 3,
                            liveBufferLatencyMinLatency: 1,
                            liveBufferLatencyChasingOnStall: isLive,
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
                            reconnectAttempts = 0;
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
                            controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                            autoplay: true,
                            muted: false,
                            hideControls: { enabled: true, delay: 4000 },
                            clickToPlay: false, fullscreen: { enabled: true, fallback: true, iosNative: true }
                        });
                        window.plyrPlayer = player;
                        window.player = player;
                    }
                    video.style.opacity = '1';
                    hideLoadingScreen();
                    triggerSafePlayback('MPEG-TS');
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
                        try { hls.destroy(); const v = document.getElementById('player'); if(v){ v.src = ''; v.load(); } } catch(e){}
                        hls = null;
                    }
                    hls = new Hls({
                        enableWorker: true,
                        startFragPrefetch: true,
                        maxBufferLength: 45,
                        maxMaxBufferLength: 90,
                        maxBufferSize: 256 * 1024 * 1024,
                        backBufferLength: 90,
                        maxBufferHole: 0.5,
                        highBufferWatchdogPeriod: 2,
                        nudgeOffset: 0.1,
                        nudgeMaxRetry: 10,
                        liveSyncDurationCount: 5,
                        liveMaxLatencyDurationCount: 12,
                        liveDurationInfinity: true,
                        lowLatencyMode: false,
                        manifestLoadingTimeOut: 20000,
                        manifestLoadingMaxRetry: 8,
                        manifestLoadingRetryDelay: 500,
                        levelLoadingTimeOut: 20000,
                        levelLoadingMaxRetry: 8,
                        levelLoadingRetryDelay: 500,
                        fragLoadingTimeOut: 20000,
                        fragLoadingMaxRetry: 8,
                        fragLoadingRetryDelay: 500,
                        xhrSetup: (xhr, url) => {
                            xhr.withCredentials = false;
                        }
                    });
                    let levelRecoveryAttempts = 0;
                    hls.loadSource(streamUrl);
                    hls.attachMedia(video);
                    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                        console.log(`[HLS] Manifest parsed. Quality levels: ${data.levels.length}`);
                        reconnectAttempts = 0;
                        levelRecoveryAttempts = 0;
                        video.style.opacity = '1';
                        hideLoadingScreen();
                        if (!player) {
                            player = new Plyr(video, {
                                controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                                autoplay: true,
                                muted: false,
                                hideControls: { enabled: true, delay: 4000 },
                                clickToPlay: false, fullscreen: { enabled: true, fallback: true, iosNative: true }
                            });
                            window.plyrPlayer = player;
                            window.player = player;
                        }
                        triggerSafePlayback('HLS-Manifest-Parsed');
                        initTopControls(player);
                        initAdvancedGestures(player, video);
                        startWatchdog();
                    });
                    hls.on(Hls.Events.ERROR, (event, data) => {
                        // Non-fatal stream events: recover without player disruption
                        if (!data.fatal) {
                            if (data.details === 'bufferSeekOverHole' || data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
                                if (data.buffer) {
                                    video.currentTime = data.buffer.nextStart;
                                }
                                return;
                            }
                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                                if (video.buffered && video.buffered.length > 0) {
                                    const curTime = video.currentTime;
                                    let nudged = false;
                                    for (let i = 0; i < video.buffered.length; i++) {
                                        const start = video.buffered.start(i);
                                        const end = video.buffered.end(i);
                                        if (curTime < start) {
                                            video.currentTime = start + 0.1;
                                            nudged = true;
                                            break;
                                        } else if (curTime >= start && curTime < end) {
                                            if (end - curTime < 0.3 && i + 1 < video.buffered.length) {
                                                video.currentTime = video.buffered.start(i + 1) + 0.1;
                                                nudged = true;
                                            }
                                            break;
                                        }
                                    }
                                    if (!nudged) {
                                        const end = video.buffered.end(video.buffered.length - 1);
                                        if (video.currentTime < end - 0.2) {
                                            video.currentTime += 0.15;
                                        }
                                    }
                                }
                                if (video.paused && !video.ended) {
                                    triggerSafePlayback('HLS-Buffer-Stall');
                                }
                                return;
                            }
                            if (data.details === 'audioTrackLoadError' || data.details === 'audioTrackLoadTimeOut' || data.details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_ERROR || data.details === Hls.ErrorDetails.AUDIO_TRACK_LOAD_TIMEOUT) {
                                try {
                                    if (hls.audioTracks && hls.audioTracks.length > 1) {
                                        hls.audioTrack = (hls.audioTrack === 0 ? 1 : 0);
                                    }
                                    hls.startLoad();
                                } catch(e) {}
                                return;
                            }
                            if (data.details === 'fragLoadError' || data.details === 'fragLoadTimeOut' || data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR || data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT || data.details === 'fragParsingError' || data.details === 'bufferAppendNoProgress' || data.details === Hls.ErrorDetails.BUFFER_APPENDING_ERROR) {
                                try { hls.startLoad(); } catch(e) {}
                                return;
                            }
                            if (data.details === 'levelLoadError' || data.details === 'levelLoadTimeOut' || data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR || data.details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT) {
                                levelRecoveryAttempts++;
                                if (levelRecoveryAttempts <= 3) {
                                    setTimeout(() => { try { hls.startLoad(); } catch(e) {} }, 1000);
                                    return;
                                }
                                return;
                            }
                            return;
                        }

                        // Fatal Errors Recovery
                        console.warn('[HLS Fatal Error]', data.type, data.details);
                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                            console.warn('[HLS Media Error] Recovering media error...');
                            try { hls.recoverMediaError(); } catch(e){}
                            return;
                        }
                        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                            if (data.details === 'manifestLoadError' || data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || (data.response && (data.response.code === 404 || data.response.code === 403 || data.response.code === 451))) {
                                const urlParamsObj = new URLSearchParams(window.location.search);
                                const qChannelId = (urlParamsObj.get('channel_id') || urlParamsObj.get('event_id') || '').trim();
                                const qUrl = (urlParamsObj.get('url') || '').trim();
                                const lookupId = qChannelId || (qUrl.match(/\/api\/play_stream\/([a-zA-Z0-9_-]+)/i)?.[1]) || window.currentStreamId || '';
                                
                                if (!window._tokenRefreshAttempts) window._tokenRefreshAttempts = 0;
                                if (lookupId && window._tokenRefreshAttempts < 3) {
                                    window._tokenRefreshAttempts++;
                                    console.warn(`[HLS Network Token Expired] Re-resolving fresh stream token (${window._tokenRefreshAttempts}/3) for:`, lookupId);
                                    setTimeout(() => {
                                        fetch(`/api/resolve_stream/${encodeURIComponent(lookupId)}?refresh=1`)
                                            .then(r => r.json())
                                            .then(res => {
                                                if (res && res.url) {
                                                    const freshProxied = ensureProxiedSportsUrl(res.url);
                                                    try { hls.destroy(); } catch(e){}
                                                    hls = null;
                                                    loadHls(freshProxied);
                                                } else {
                                                    try { hls.startLoad(); } catch(e){}
                                                }
                                            })
                                            .catch(() => {
                                                try { hls.startLoad(); } catch(e){}
                                            });
                                    }, 1500);
                                    return;
                                }
                                if (streamUrl && !streamUrl.includes('stream_proxy.php') && !streamUrl.includes('/api/proxy/')) {
                                    console.warn('[HLS Network 403/404] Retrying via proxy...');
                                    const proxied = `/stream_proxy.php?url=${encodeURIComponent(streamUrl)}`;
                                    loadHls(proxied);
                                    return;
                                }
                            }
                            console.warn('[HLS Network Error] Retrying stream load...');
                            try { hls.startLoad(); } catch(e){}
                            return;
                        }
                        if (data.details === 'manifestParsingError' || data.details === Hls.ErrorDetails.MANIFEST_PARSING_ERROR) {
                            if (isMdtv || (streamUrl && (streamUrl.includes('mdtv') || streamUrl.includes('.mpd')))) {
                                console.log('[HLS Fallback] Detected MPD manifest on DASH/MDTV stream. Switching to DASH/Shaka engine...');
                                if (typeof shaka !== 'undefined') {
                                    loadShaka(streamUrl, drmKeyId, drmKey);
                                } else {
                                    loadDash(streamUrl, drmKeyId, drmKey);
                                }
                                return;
                            }
                            if (streamUrl && !streamUrl.includes('stream_proxy.php') && !streamUrl.includes('/api/proxy/')) {
                                console.warn('[HLS Fallback] Manifest error on direct stream. Retrying through master stream proxy...');
                                const proxied = `/stream_proxy.php?url=${encodeURIComponent(streamUrl)}`;
                                loadHls(proxied);
                                return;
                            }
                            loading.style.display = 'none';
                            showPlayerError("⚠️ Stream Feed Unreachable: The upstream provider for this channel is currently offline or returning an invalid stream. Please try another live channel (e.g. Sony, TimStreams, Sports).");
                            return;
                        }

                        // Fallback: graceful reload
                        console.warn('[HLS Fatal Fallback] Re-initializing stream...');
                        try { hls.destroy(); } catch(e){}
                        hls = null;
                        setTimeout(() => {
                            if (video) loadHls(streamUrl);
                        }, 1500);
                    });
                    window.hls = hls;
                }
                
                function hexToBase64Url(hex) {
                    if (!hex) return '';
                    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, '');
                    if (cleanHex.length % 2 !== 0) return '';
                    const bytes = new Uint8Array(cleanHex.length / 2);
                    for (let i = 0; i < cleanHex.length; i += 2) {
                        bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
                    }
                    let binary = '';
                    for (let i = 0; i < bytes.length; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return btoa(binary)
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '');
                }

                let shakaPlayer = null;
                function destroyShakaPlayer() {
                    if (shakaPlayer) {
                        try { shakaPlayer.destroy(); } catch(e){}
                        shakaPlayer = null;
                    }
                }

                async function loadShaka(streamUrl, keyId, key) {
                    try {
                        streamUrl = new URL(streamUrl, window.location.origin).href;
                    } catch(e){}
                    console.log("[Shaka Engine] Initializing Shaka Player for stream:", streamUrl);
                    destroyMpegPlayer();
                    destroyDashPlayer();
                    destroyShakaPlayer();
                    if (hls) { try { hls.destroy(); const v = document.getElementById('player'); if(v){ v.src = ''; v.load(); } } catch(e){} hls = null; }

                    if (typeof shaka === 'undefined' || !shaka.Player.isBrowserSupported()) {
                        console.warn("[Shaka Engine] Shaka not supported or not loaded, falling back to Dash.js");
                        loadDash(streamUrl, keyId, key);
                        return;
                    }

                    try {
                        shaka.polyfill.installAll();
                        shakaPlayer = new shaka.Player();
                        await shakaPlayer.attach(video);
                        window.shakaPlayer = shakaPlayer;

                        // Configure ClearKey DRM ONLY IF valid 32-character hex keys are available
                        const rawKeyId = (keyId || drmKeyId || window._activeClearKeyId || (typeof urlParamsForMedia !== 'undefined' ? urlParamsForMedia.get('key_id') : '') || '').trim();
                        const rawKey = (key || drmKey || window._activeClearKey || (typeof urlParamsForMedia !== 'undefined' ? urlParamsForMedia.get('key') : '') || '').trim();
                        const cleanKeyId = rawKeyId.toLowerCase().replace(/[^0-9a-f]/g, '');
                        const cleanKey = rawKey.toLowerCase().replace(/[^0-9a-f]/g, '');

                        if (cleanKeyId.length === 32 && cleanKey.length === 32) {
                            shakaPlayer.configure({
                                drm: {
                                    clearKeys: {
                                        [cleanKeyId]: cleanKey
                                    }
                                }
                            });
                            console.log("[Shaka Engine] Configured ClearKey DRM:", cleanKeyId);
                        } else {
                            // Explicitly clear DRM so unencrypted / clear streams play without 6006 EME session errors
                            shakaPlayer.configure({
                                drm: {
                                    clearKeys: {}
                                }
                            });
                            if (cleanKeyId || cleanKey) {
                                console.warn("[Shaka Engine] Ignored invalid ClearKey DRM keys (both must be 32 hex chars):", cleanKeyId, cleanKey);
                            }
                        }

                        // Configure initial bandwidth estimate to 15 Mbps for immediate FHD 1080p and zero buffer
                        shakaPlayer.configure({
                            abr: {
                                enabled: true,
                                defaultBandwidthEstimate: 15000000,
                                switchInterval: 4
                            },
                            streaming: {
                                rebufferingGoal: 1.5,
                                bufferingGoal: 20,
                                bufferBehind: 30,
                                segmentPrefetchLimit: 3,
                                jumpLargeGaps: true,
                                stallEnabled: true,
                                stallThreshold: 1,
                                stallSkip: 0.1,
                                retryParameters: {
                                    maxAttempts: 6,
                                    baseDelay: 500,
                                    backoffFactor: 1.5,
                                    fuzzFactor: 0.5,
                                    timeout: 20000
                                }
                            },
                            manifest: {
                                dash: {
                                    autoCorrectDrift: true,
                                    clockSyncUri: ''
                                },
                                retryParameters: {
                                    maxAttempts: 6,
                                    baseDelay: 500,
                                    backoffFactor: 1.5,
                                    fuzzFactor: 0.5,
                                    timeout: 20000
                                }
                            }
                        });

                        // Configure Request Filter for Akamai token injection on chunks
                        shakaPlayer.getNetworkingEngine().registerRequestFilter((type, request) => {
                            if (window._activeAkamaiToken) {
                                const tokenVal = window._activeAkamaiToken.startsWith('__hdnea__=') 
                                    ? window._activeAkamaiToken 
                                    : ('__hdnea__=' + window._activeAkamaiToken);
                                request.uris = request.uris.map(uri => {
                                    if ((uri.includes('.mpd') || uri.includes('.m4s') || uri.includes('.dash') || uri.includes('jio')) && !uri.includes('__hdnea__')) {
                                        return uri + (uri.includes('?') ? '&' : '?') + tokenVal;
                                    }
                                    return uri;
                                });
                            }
                        });

                        shakaPlayer.addEventListener('error', (event) => {
                            console.warn("[Shaka Engine Error]", event.detail);
                        });

                        await shakaPlayer.load(streamUrl);
                        console.log("[Shaka Engine] Stream loaded successfully.");
                        video.style.opacity = '1';
                        hideLoadingScreen();
                        if (!player) {
                            player = new Plyr(video, {
                                controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                                autoplay: true,
                                muted: false,
                                hideControls: { enabled: true, delay: 4000 },
                                clickToPlay: false, fullscreen: { enabled: true, fallback: true, iosNative: true }
                            });
                            window.plyrPlayer = player;
                            window.player = player;
                        }
                        triggerSafePlayback('Shaka-DASH');
                        initTopControls(player);
                        initAdvancedGestures(player, video);
                        startWatchdog();
                    } catch (err) {
                        console.warn("[Shaka Engine Init Failed] Error:", err, "Falling back to Dash.js...");
                        destroyShakaPlayer();
                        loadDash(streamUrl, keyId, key);
                    }
                }

                let dashPlayer = null;
                function destroyDashPlayer() {
                    if (dashPlayer) {
                        try { dashPlayer.reset(); } catch(e){}
                        dashPlayer = null;
                    }
                    destroyShakaPlayer();
                }
                function loadDash(streamUrl, keyId, key) {
                    try {
                        streamUrl = new URL(streamUrl, window.location.origin).href;
                    } catch(e){}
                    console.log("[DASH Engine] Initializing Dash.js for stream:", streamUrl);
                    destroyMpegPlayer();
                    if (hls) { try { hls.destroy(); const v = document.getElementById('player'); if(v){ v.src = ''; v.load(); } } catch(e){} hls = null; }
                    destroyDashPlayer();
                    
                    try {
                        dashPlayer = dashjs.MediaPlayer().create();

                        // Akamai Token injection for JioTV / MDTV DASH chunks (.m4s, .dash)
                        if (window._activeAkamaiToken) {
                            const tokenVal = window._activeAkamaiToken.startsWith('__hdnea__=') 
                                ? window._activeAkamaiToken 
                                : ('__hdnea__=' + window._activeAkamaiToken);
                            dashPlayer.extend("RequestModifier", () => {
                                return {
                                    modifyRequestURL: (url) => {
                                        if (url && typeof url === 'string') {
                                            if ((url.includes('.mpd') || url.includes('.m4s') || url.includes('.dash') || url.includes('jio')) && !url.includes('__hdnea__')) {
                                                return url + (url.includes('?') ? '&' : '?') + tokenVal;
                                            }
                                        }
                                        return url;
                                    }
                                };
                            });
                        }

                        // Configure ClearKey DRM ONLY IF valid 32-character hex keys are available
                        const rawDashKeyId = (keyId || drmKeyId || window._activeClearKeyId || (typeof urlParamsForMedia !== 'undefined' ? urlParamsForMedia.get('key_id') : '') || '').trim();
                        const rawDashKey = (key || drmKey || window._activeClearKey || (typeof urlParamsForMedia !== 'undefined' ? urlParamsForMedia.get('key') : '') || '').trim();
                        const cleanDashKeyId = rawDashKeyId.toLowerCase().replace(/[^0-9a-f]/g, '');
                        const cleanDashKey = rawDashKey.toLowerCase().replace(/[^0-9a-f]/g, '');

                        if (cleanDashKeyId.length === 32 && cleanDashKey.length === 32) {
                            console.log("[DASH Engine] Configuring ClearKey DRM protection:", cleanDashKeyId);
                            const b64KeyId = hexToBase64Url(cleanDashKeyId);
                            const b64Key = hexToBase64Url(cleanDashKey);
                            const clearkeys = {};
                            if (b64KeyId && b64Key) {
                                clearkeys[b64KeyId] = b64Key;
                            }
                            clearkeys[cleanDashKeyId] = cleanDashKey;
                            dashPlayer.setProtectionData({
                                "org.w3.clearkey": {
                                    "clearkeys": clearkeys
                                }
                            });
                        }

                        dashPlayer.updateSettings({
                            streaming: {
                                buffer: {
                                    fastSwitchEnabled: true,
                                    bufferTimeAtTopQuality: 30,
                                    bufferTimeAtTopQualityLongForm: 30,
                                    initialBufferTime: 2,
                                    bufferToKeep: 30,
                                    bufferPruningInterval: 10
                                },
                                retryIntervals: {
                                    MPD: 500,
                                    InitializationSegment: 500,
                                    MediaSegment: 500
                                },
                                retryAttempts: {
                                    MPD: 6,
                                    InitializationSegment: 6,
                                    MediaSegment: 6
                                },
                                delay: {
                                    liveDelay: 3
                                }
                            }
                        });

                        dashPlayer.initialize(video, streamUrl, true);
                        dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                            console.log("[DASH Engine] Stream initialized successfully.");
                            video.style.opacity = '1';
                            hideLoadingScreen();
                            if (!player) {
                                player = new Plyr(video, {
                                    controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
                                    autoplay: true,
                                    muted: false,
                                    hideControls: { enabled: true, delay: 4000 },
                                    clickToPlay: false, fullscreen: { enabled: true, fallback: true, iosNative: true }
                                });
                                window.plyrPlayer = player;
                                window.player = player;
                            }
                            triggerSafePlayback('DASH');
                            initTopControls(player);
                            initAdvancedGestures(player, video);
                            startWatchdog();
                        });
                        dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e) => {
                            console.warn("[DASH Engine Error]", e);
                            hideLoadingScreen();
                            const errDetail = e.error?.message || e.message || (typeof e.error === 'string' ? e.error : '') || '';
                            if (errDetail.toLowerCase().includes('drm') || errDetail.toLowerCase().includes('license') || streamUrl.includes('WDVLive')) {
                                showPlayerError("🔒 Widevine Encrypted Channel: This stream requires Widevine DRM credentials (no ClearKey key available). Please choose another channel or sports network.");
                            } else if (Hls.isSupported() && !streamUrl.includes('.mpd') && !isExplicitDash) {
                                loadHls(streamUrl);
                            } else {
                                showPlayerError("⚠️ Stream Notice: " + (errDetail || "Failed to decode live stream. Please try reconnecting or select another stream."));
                            }
                        });
                        window.dashPlayer = dashPlayer;
                    } catch(err) {
                        console.error("[DASH Engine Init Failed]", err);
                        if (Hls.isSupported() && !streamUrl.includes('.mpd') && !isExplicitDash) {
                            loadHls(streamUrl);
                        } else {
                            showPlayerError("⚠️ Player initialization failed: " + err.message);
                        }
                    }
                }
                if (resolvedSrc.includes('.mpd') || resolvedSrc.includes('type=dash')) {
                    isExplicitDash = true;
                }
                if (isDirectMedia) {
                    video.src = resolvedSrc;
                    video.load();
                    triggerSafePlayback('Direct-Media');
                    if (!player) {
                        player = new Plyr(video, {
                            controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'download', 'fullscreen'],
                            autoplay: true,
                            muted: false,
                            hideControls: { enabled: true, delay: 4000 },
                            clickToPlay: false,
                            fullscreen: { enabled: true, fallback: true, iosNative: true }
                        });
                        window.plyrPlayer = player;
                        window.player = player;
                    }
                    video.style.opacity = '1';
                    hideLoadingScreen();
                    initTopControls(player);
                    initAdvancedGestures(player, video);
                    startWatchdog();
                } else if (isExplicitDash) {
                    if (typeof shaka !== 'undefined') {
                        loadShaka(resolvedSrc, drmKeyId, drmKey);
                    } else if (typeof dashjs !== 'undefined') {
                        loadDash(resolvedSrc, drmKeyId, drmKey);
                    }
                } else if (isExplicitTs && typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                    loadMpegTs(resolvedSrc);
                } else if (Hls.isSupported() && !resolvedSrc.includes('.mpd')) {
                    loadHls(resolvedSrc);
                } else if (typeof shaka !== 'undefined') {
                    loadShaka(resolvedSrc, drmKeyId, drmKey);
                } else if (typeof dashjs !== 'undefined') {
                    loadDash(resolvedSrc, drmKeyId, drmKey);
                } else if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
                    loadMpegTs(resolvedSrc);
                } else {
                    video.src = resolvedSrc;
                    video.load();
                    triggerSafePlayback('Native-Fallback');
                }
            }

            async function resolveStreamAndInit() {
                const statusEl = document.getElementById('apple-loading-status');

                // If stream is already a direct playable HTTP or proxy URL, directly launch
                if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('/'))) {
                    if (statusEl) statusEl.textContent = 'Launching live stream...';
                    await initPlayer();
                    return;
                }

                // If not direct URL, resolve by channel name or ID query
                const lookupName = (name && name !== 'Live Channel' && name !== 'Live Stream') ? name : (urlParams.get('name') || urlParams.get('q') || urlParams.get('id') || urlParams.get('channel') || '');
                if (lookupName) {
                    try {
                        const res = await fetch(`/api/channels/resolve?name=${encodeURIComponent(lookupName)}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data && (data.streamUrl || data.url)) {
                                src = data.streamUrl || data.url;
                                if (data.name) name = data.name;
                                console.log('[Live Stream] Auto-resolved stream:', src);
                                await initPlayer();
                                return;
                            }
                        }
                    } catch (err) {
                        console.warn('[Live Stream] Failed to resolve channel:', err);
                    }
                }

                await initPlayer();
            }

            resolveStreamAndInit();
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
    <script src="/party-mode.js?v=7.0"></script>
    <script src="assets/local-ai.js?v=2.0"></script>

    <link rel="stylesheet" href="/assets/local-ai.css?v=2.0">
    <link rel="stylesheet" href="/local-ai.css?v=2.0">
    <script src="/assets/local-ai.js?v=2.0"></script>
    <script src="/local-ai.js?v=2.0"></script>
    <script src="/security_guard.js?v=1.0"></script>
    <script src="/watchdog.js" id="maintenance-watchdog"></script>
    
</body>
</html>

