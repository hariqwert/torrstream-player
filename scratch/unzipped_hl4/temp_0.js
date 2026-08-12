
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
                        rotateBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md';
                        rotateBtn.innerHTML = '<i data-lucide="rotate-cw" class="w-5 h-5"></i>';
                        let currentRotation = 0;
                        rotateBtn.onclick = async (e) => {
                            e.stopPropagation();
                            
                            try {
                                if (screen.orientation && screen.orientation.lock) {
                                    if (!document.fullscreenElement && player && player.fullscreen) {
                                        await player.fullscreen.enter();
                                    }
                                    if (screen.orientation.type.startsWith('portrait')) {
                                        await screen.orientation.lock('landscape');
                                    } else {
                                        await screen.orientation.lock('portrait');
                                    }
                                    return;
                                }
                            } catch(err) {
                                console.warn("Orientation lock failed, using CSS fallback", err);
                            }

                            currentRotation = (currentRotation + 90) % 360;
                            const container = player.elements?.container || document.getElementById('player-container');
                            const isPortrait = currentRotation === 90 || currentRotation === 270;
                            
                            const updateSize = () => {
                                if (currentRotation === 0) {
                                    container.style.removeProperty('width');
                                    container.style.removeProperty('height');
                                    container.style.removeProperty('position');
                                    container.style.removeProperty('top');
                                    container.style.removeProperty('left');
                                    container.style.removeProperty('right');
                                    container.style.removeProperty('bottom');
                                    container.style.removeProperty('z-index');
                                    container.style.removeProperty('transform');
                                    container.style.removeProperty('transform-origin');
                                    document.body.style.overflow = '';
                                    return;
                                }
                                
                                document.body.style.overflow = 'hidden';
                                const w = window.innerWidth;
                                const h = window.innerHeight;
                                
                                if (isPortrait) {
                                    container.style.setProperty('width', `${h}px`, 'important');
                                    container.style.setProperty('height', `${w}px`, 'important');
                                } else {
                                    container.style.setProperty('width', `${w}px`, 'important');
                                    container.style.setProperty('height', `${h}px`, 'important');
                                }
                            };
                            
                            if (currentRotation !== 0) {
                                container.style.setProperty('position', 'fixed', 'important');
                                container.style.setProperty('top', '50%', 'important');
                                container.style.setProperty('left', '50%', 'important');
                                container.style.setProperty('z-index', '999999', 'important');
                                container.style.setProperty('transform-origin', 'center center', 'important');
                                container.style.setProperty('transform', `translate(-50%, -50%) rotate(${currentRotation}deg)`, 'important');
                            }
                            
                            updateSize();
                            
                            if (!window._rotationResizeAttached) {
                                window.addEventListener('resize', () => {
                                    if (currentRotation !== 0) updateSize();
                                });
                                window._rotationResizeAttached = true;
                            }
                            
                            // Try to trigger a window resize to force Plyr controls to update
                            setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                        };
                        topControls.appendChild(rotateBtn);

                        // Create Local Subtitle Button
                        const subLabel = document.createElement('label');
                        subLabel.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md cursor-pointer';
                        subLabel.innerHTML = '<i data-lucide="subtitles" class="w-5 h-5"></i><input type="file" id="local-sub-upload" accept=".srt,.vtt" class="hidden">';
                        topControls.appendChild(subLabel);

                        setTimeout(() => {
                            const subInput = document.getElementById('local-sub-upload');
                            if (subInput) {
                                subInput.addEventListener('change', (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;
                                    
                                    const reader = new FileReader();
                                    reader.onload = function(evt) {
                                        let text = evt.target.result;
                                        if (file.name.toLowerCase().endsWith('.srt')) {
                                            text = 'WEBVTT\n\n' + text
                                                .replace(/\{\\([ibu])\}/g, '<$1>')
                                                .replace(/\{\\\/([ibu])\}/g, '</$1>')
                                                .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2')
                                                .replace(/\r\n|\r|\n/g, '\n');
                                        }
                                        const blob = new Blob([text], { type: 'text/vtt' });
                                        const url = URL.createObjectURL(blob);
                                        
                                        let trackEl = Array.from(video.querySelectorAll('track')).find(t => t.label === 'Local Subtitle');
                                        if (trackEl) {
                                            trackEl.src = url;
                                        } else {
                                            trackEl = document.createElement('track');
                                            trackEl.kind = 'captions';
                                            trackEl.label = 'Local Subtitle';
                                            trackEl.srclang = 'en';
                                            trackEl.src = url;
                                            trackEl.default = true;
                                            video.appendChild(trackEl);
                                        }
                                        
                                        setTimeout(() => {
                                            if (trackEl.track) {
                                                trackEl.track.mode = 'showing';
                                            }
                                        }, 100);

                                        
                                        const indicator = document.getElementById('zoom-indicator');
                                        if (indicator) {
                                            indicator.textContent = 'Subtitle Added';
                                            indicator.style.opacity = '1';
                                            setTimeout(() => indicator.style.opacity = '0', 2000);
                                        }
                                        
                                        // Reset input so the same file can be uploaded again if needed
                                        subInput.value = '';
                                    };
                                    reader.readAsText(file);
                                });
                            }
                        }, 500);

                        // Create Aspect Ratio Button
                        const aspectBtn = document.createElement('button');
                        aspectBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md cursor-pointer';
                        aspectBtn.innerHTML = '<i data-lucide="maximize" class="w-5 h-5"></i>';
                        aspectBtn.onclick = (e) => { e.stopPropagation(); toggleAspectRatio(); };
                        topControls.appendChild(aspectBtn);

                        // Create Sleep Timer Button
                        const sleepBtn = document.createElement('button');
                        sleepBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 backdrop-blur-md cursor-pointer';
                        sleepBtn.innerHTML = '<i data-lucide="clock" class="w-5 h-5"></i>';
                        sleepBtn.onclick = (e) => { e.stopPropagation(); toggleSleepTimer(); };
                        topControls.appendChild(sleepBtn);

                        // Create Power/Off Button
                        const powerBtn = document.createElement('button');
                        powerBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600/20 text-red-500 rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-red-500/10 backdrop-blur-md cursor-pointer hover:text-white hover:border-red-500';
                        powerBtn.innerHTML = '<i data-lucide="power" class="w-5 h-5"></i>';
                        powerBtn.onclick = (e) => { e.stopPropagation(); window.sleepPlayer(); };
                        topControls.appendChild(powerBtn);

                        const isPipSupported = (document.pictureInPictureEnabled || 
                                                (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function"));
                        
                        if (isPipSupported) {
                             const pipBtn = document.createElement('button');
                             pipBtn.id = 'pip-trigger-button';
                             pipBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg shadow-black/40 border border-white/10 group backdrop-blur-md cursor-pointer';
                             pipBtn.innerHTML = '<i data-lucide="picture-in-picture-2" class="w-5 h-5 group-hover:scale-105 transition-transform"></i>';
                             
                             pipBtn.addEventListener('click', async (e) => {
                                 e.preventDefault();
                                 e.stopPropagation();
                                 try {
                                     if (document.pictureInPictureElement) {
                                         await document.exitPictureInPicture();
                                     } else if (video.readyState >= 1) { // HAVE_METADATA or higher
                                         if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
                                             await video.requestPictureInPicture();
                                         } else if (video.webkitSupportsPresentationMode && typeof video.webkitSetPresentationMode === "function") {
                                             const isPip = video.webkitPresentationMode === "picture-in-picture";
                                             await video.webkitSetPresentationMode(isPip ? "inline" : "picture-in-picture");
                                         }
                                     } else {
                                         console.warn("Video metadata not loaded yet. Cannot enter Picture-in-Picture.");
                                     }
                                 } catch (error) {
                                     console.error("Picture-in-Picture failed:", error);
                                 }
                             });
                             
                             topControls.appendChild(pipBtn);
                        }

                        const container = player.elements?.container || video.closest('.plyr') || document.getElementById('player-container');
                        if (container) {
                            container.appendChild(topControls);
                        } else {
                            document.body.appendChild(topControls);
                        }
                        
                        if (typeof lucide !== 'undefined') {
                            lucide.createIcons();
                        }
                    }

                    if (typeof player.on === 'function') {
                        if (player.elements) {
                            player.on('controlsshown', () => {
                                if (topControls && topControls.classList) topControls.classList.remove('opacity-0', 'pointer-events-none');
                            });
                            player.on('controlshidden', () => {
                                if (topControls && topControls.classList) topControls.classList.add('opacity-0', 'pointer-events-none');
                            });
                        } else {
                            // Artplayer events
                            player.on('control', (state) => {
                                if (topControls && topControls.classList) {
                                    if (state) topControls.classList.remove('opacity-0', 'pointer-events-none');
                                    else topControls.classList.add('opacity-0', 'pointer-events-none');
                                }
                            });
                            player.on('hover', (state) => {
                                if (topControls && topControls.classList) {
                                    if (state) topControls.classList.remove('opacity-0', 'pointer-events-none');
                                    else topControls.classList.add('opacity-0', 'pointer-events-none');
                                }
                            });
                        }
                    }

                    // Force show initially
                    if (topControls && topControls.classList) topControls.classList.remove('opacity-0', 'pointer-events-none');
                };

                const isArtplayer = !player.elements;
                if (isArtplayer || player.ready) {
                    setupControls();
                } else {
                    player.on('ready', setupControls);
                    setTimeout(setupControls, 50);
                }
            }

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
                    if (e.touches.length === 1) {
                        startX = e.touches[0].pageX;
                        startY = e.touches[0].pageY;
                        isDragging = false;
                        dragType = null;
                    }
                }, { passive: true });

                container.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 1) {
                        const moveX = e.touches[0].pageX;
                        const moveY = e.touches[0].pageY;
                        const diffX = moveX - startX;
                        const diffY = moveY - startY;

                        if (!isDragging && (Math.abs(diffX) > 20 || Math.abs(diffY) > 20)) {
                            isDragging = true;
                            const rect = container.getBoundingClientRect();
                            if (startX < rect.width / 2) {
                                dragType = 'brightness';
                                initialValue = brightness;
                            } else {
                                dragType = 'volume';
                                initialValue = player.volume * 100;
                            }
                        }

                        if (isDragging) {
                            if (window.plyrPlayer) {
                                window.plyrPlayer.toggleControls(true);
                            }
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

                // --- PC KEYBOARD SHORTCUTS ---
                let sleepTimer = null;
                let sleepMinutes = 0;
                let playerSleepInterval = null;

                window.sleepPlayer = function() {
                    const screen = document.getElementById('player-sleep-screen');
                    if (!screen) return;
                    
                    // Pause video playback
                    if (window.player) {
                        window.player.pause();
                    } else {
                        const vid = document.getElementById('player');
                        if (vid) vid.pause();
                    }
                    
                    screen.classList.remove('hidden');
                    
                    // Start clock
                    updatePlayerSleepClock();
                    if (playerSleepInterval) clearInterval(playerSleepInterval);
                    playerSleepInterval = setInterval(updatePlayerSleepClock, 1000);
                };
                
                window.wakePlayerUp = function() {
                    const screen = document.getElementById('player-sleep-screen');
                    if (!screen) return;
                    
                    screen.classList.add('hidden');
                    if (playerSleepInterval) {
                        clearInterval(playerSleepInterval);
                        playerSleepInterval = null;
                    }
                    
                    // Resume video playback
                    if (window.player) {
                        window.player.play().catch(e => console.log('Resume failed', e));
                    } else {
                        const vid = document.getElementById('player');
                        if (vid) vid.play().catch(e => console.log('Resume failed', e));
                    }
                };
                
                function updatePlayerSleepClock() {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
                    const clockEl = document.getElementById('playerSleepClock');
                    if (clockEl) clockEl.textContent = timeStr;
                }

                window.toggleAspectRatio = function() {
                    const modes = ['', 'video-aspect-fill', 'video-aspect-stretch', 'video-aspect-4-3', 'video-aspect-16-9'];
                    const labels = ['Original Fit', 'Zoom to Fill', 'Stretch to Fill', '4:3 Ratio', '16:9 Ratio'];
                    
                    let currentModeIndex = modes.findIndex(m => m && document.body.classList.contains(m));
                    if (currentModeIndex === -1) currentModeIndex = 0;
                    
                    document.body.classList.remove(...modes.filter(m => m));
                    
                    const nextIndex = (currentModeIndex + 1) % modes.length;
                    if (modes[nextIndex]) document.body.classList.add(modes[nextIndex]);
                    showIndicator(labels[nextIndex]);
                };

                window.toggleSleepTimer = function() {
                    const intervals = [0, 15, 30, 45, 60, 90, 120];
                    let currentIndex = intervals.indexOf(sleepMinutes);
                    sleepMinutes = intervals[(currentIndex + 1) % intervals.length];
                    
                    if (sleepTimer) {
                        clearInterval(sleepTimer);
                        sleepTimer = null;
                    }
                    
                    if (sleepMinutes === 0) {
                        document.body.classList.remove('sleep-timer-active');
                        showIndicator('Sleep Timer: OFF');
                    } else {
                        document.body.classList.add('sleep-timer-active');
                        showIndicator(`Sleep Timer: ${sleepMinutes}m`);
                        let remainingSeconds = sleepMinutes * 60;
                        
                        // Initial update
                        const mins = Math.floor(remainingSeconds / 60);
                        const secs = remainingSeconds % 60;
                        const indicatorText = document.getElementById('sleep-time');
                        if (indicatorText) indicatorText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

                        sleepTimer = setInterval(() => {
                            remainingSeconds--;
                            if (remainingSeconds <= 0) {
                                clearInterval(sleepTimer);
                                sleepTimer = null;
                                window.sleepPlayer();
                                showIndicator('Time Up: Player Stopped');
                                document.body.classList.remove('sleep-timer-active');
                                sleepMinutes = 0;
                            }
                            const mins = Math.floor(remainingSeconds / 60);
                            const secs = remainingSeconds % 60;
                            const indicatorText = document.getElementById('sleep-time');
                            if (indicatorText) indicatorText.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                        }, 1000);
                    }
                };

                window.addEventListener('keydown', (e) => {
                    if (document.activeElement.tagName === 'INPUT') return;
                    
                    switch(e.key.toLowerCase()) {
                        case ' ':
                            player.togglePlay();
                            e.preventDefault();
                            break;
                        case 'arrowleft':
                            player.rewind(10);
                            showIndicator('Rewind 10s');
                            break;
                        case 'arrowright':
                            player.forward(10);
                            showIndicator('Forward 10s');
                            break;
                        case 'arrowup':
                            player.volume = Math.min(1, player.volume + 0.1);
                            showIndicator(`Volume: ${Math.round(player.volume * 100)}%`);
                            e.preventDefault();
                            break;
                        case 'arrowdown':
                            player.volume = Math.max(0, player.volume - 0.1);
                            showIndicator(`Volume: ${Math.round(player.volume * 100)}%`);
                            e.preventDefault();
                            break;
                        case 'm':
                            player.muted = !player.muted;
                            showIndicator(player.muted ? 'Muted' : 'Unmuted');
                            break;
                        case 'f':
                            player.fullscreen.toggle();
                            break;
                        case 'z':
                            window.toggleAspectRatio();
                            break;
                        case 's':
                            window.toggleSleepTimer();
                            break;
                    }
                });
            }

            function initZoomGesture(player, video) {
                const container = player.elements?.container || video.closest('.plyr');
                if (!container) return;

                let initialDistance = 0;
                let isZoomed = false;
                const indicator = document.getElementById('zoom-indicator');

                function showIndicator(text) {
                    if (!indicator) return;
                    indicator.textContent = text;
                    indicator.style.opacity = '1';
                    setTimeout(() => {
                        indicator.style.opacity = '0';
                    }, 1500);
                }

                container.addEventListener('touchstart', (e) => {
                    if (e.touches.length === 2) {
                        initialDistance = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                    }
                }, { passive: true });

                container.addEventListener('touchmove', (e) => {
                    if (e.touches.length === 2 && initialDistance > 0) {
                        const currentDistance = Math.hypot(
                            e.touches[0].pageX - e.touches[1].pageX,
                            e.touches[0].pageY - e.touches[1].pageY
                        );
                        
                        const delta = currentDistance - initialDistance;
                        const threshold = 40;

                        if (Math.abs(delta) > threshold) {
                            if (delta > 0 && !isZoomed) {
                                document.body.classList.add('video-zoom-fill');
                                showIndicator('Zoomed to Fill');
                                isZoomed = true;
                                initialDistance = currentDistance;
                            } else if (delta < 0 && isZoomed) {
                                document.body.classList.remove('video-zoom-fill');
                                showIndicator('Original Fit');
                                isZoomed = false;
                                initialDistance = currentDistance;
                            }
                        }
                    }
                }, { passive: true });

                container.addEventListener('touchend', (e) => {
                    if (e.touches.length < 2) {
                        initialDistance = 0;
                    }
                }, { passive: true });
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

            const src = "true";
            const name = "true";
            const isXtream = true;
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
                countdownInterval = setInterval(() => {
                    remaining--;
                    if (remaining <= 0) {
                        clearInterval(countdownInterval);
                        if (engine && engine.destroy) engine.destroy();
                        isReconnecting = false;
                        let newSrc = srcUrl;
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
                        if (timeStalled > 30000) {
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
                    'fullscreen'
                ],
                settings: ['quality', 'speed'],
                hideControls: { enabled: true, delay: 4000 }
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
                            stashInitialSize: 384 * 1024,
                            liveBufferLatencyChasing: false,
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
                        enableStashBuffer: false,
                        stashInitialSize: 128,
                        liveBufferLatencyChasing: true,
                        liveBufferLatencyMaxLatency: 2.5,
                        liveBufferLatencyMinLatency: 0.5,
                        liveBufferLatencyChasingOnStall: true,
                        fixAudioTimestampGap: true,
                        reuse33bitClip: true,
                        autoCleanupSourceBuffer: true,
                        autoCleanupMaxBackwardDuration: 30,
                        autoCleanupMinBackwardDuration: 10,
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
                    initAdvancedGestures(player, video);
                    initZoomGesture(player, video);
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
                        maxBufferLength: 60,
                        maxMaxBufferLength: 180,
                        backBufferLength: 60,
                        maxBufferHole: 0.5,
                        highBufferWatchdogPeriod: 3,
                        nudgeOffset: 0.2,
                        nudgeMaxRetry: 5,
                        liveSyncDurationCount: 3,
                        liveMaxLatencyDurationCount: 10,
                        enableWorker: true,
                        capLevelToPlayerSize: true,
                        lowLatencyMode: false,
                        
                        // Let hls.js naturally calculate the live edge
                        // We only increase timeouts to handle slow proxies
                        manifestLoadingTimeOut: 30000, 
                        manifestLoadingMaxRetry: 10,
                        manifestLoadingRetryDelay: 1000,
                        levelLoadingTimeOut: 30000,
                        levelLoadingMaxRetry: 10,
                        levelLoadingRetryDelay: 1000,
                        fragLoadingTimeOut: 60000, 
                        fragLoadingMaxRetry: 10,
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
                        console.warn('[HLS] Buffer stalled, nudging player...');
                        if (hls && hls.recoverMediaError) hls.recoverMediaError();
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
                    initAdvancedGestures(player, video);
                    initZoomGesture(player, video);
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
                initAdvancedGestures(player, video);
                initZoomGesture(player, video);
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
    