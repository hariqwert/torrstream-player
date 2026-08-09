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

                