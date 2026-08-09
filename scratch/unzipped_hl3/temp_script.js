1-312:    <script>
2-313-        document.addEventListener("DOMContentLoaded", () => {
3-314-            if (typeof lucide !== 'undefined') lucide.createIcons();
4-315-
5-316-            const src = "<?php echo htmlspecialchars($stream_url); ?>";
6-317-            const name = "<?php echo htmlspecialchars($name); ?>";
7-318-            const source = "<?php echo htmlspecialchars($source); ?>";
8-319-            
9-320-            const video = document.getElementById('player');
10-321-            const loading = document.getElementById('loading');
11-322-            const zoomIndicator = document.getElementById('zoom-indicator');
12-323-            const sleepModal = document.getElementById('sleepModal');
13-324-            const sleepIndicator = document.getElementById('sleep-indicator');
14-325-            const sleepTimeLabel = document.getElementById('sleep-time');
15-326-
16-327-            let hls = null;
17-328-            let mpegPlayer = null;
18-329-            let player = null;
19-330-            let isReconnecting = false;
20-331-            let watchdogTimer = null;
21-332-            let lastCurrentTime = -1;
22-333-            let lastProgressTime = Date.now();
23-334-            let sleepTimerInterval = null;
24-335-            let sleepTargetTime = null;
25-336-
26-337-            // Aspect ratio state: 0=fit(contain), 1=fill(cover), 2=stretch(fill), 3=zoom-120
27-338-            let aspectState = 0;
28-339-            const aspectModes = ['Default (Fit)', 'Fill Screen', 'Stretch 16:9', 'Zoom 120%'];
29-340-
30-341-            function showIndicator(text) {
31-342-                if (!zoomIndicator) return;
32-343-                zoomIndicator.textContent = text;
33-344-                zoomIndicator.style.opacity = '1';
34-345-                setTimeout(() => { zoomIndicator.style.opacity = '0'; }, 2000);
35-346-            }
36-347-
37-348-            function toggleAspectRatio() {
38-349-                aspectState = (aspectState + 1) % aspectModes.length;
39-350-                video.classList.remove('fit-cover', 'fit-fill', 'zoom-120');
40-351-                
41-352-                if (aspectState === 1) video.classList.add('fit-cover');
42-353-                else if (aspectState === 2) video.classList.add('fit-fill');
43-354-                else if (aspectState === 3) video.classList.add('zoom-120');
44-355-
45-356-                showIndicator(`Aspect Mode: ${aspectModes[aspectState]}`);
46-357-            }
47-358-
48-359-            // Audio & Subtitle Modals
49-360-            window.toggleAudioModal = function() {
50-361-                const modal = document.getElementById('audioModal');
51-362-                const list = document.getElementById('audio-tracks-list');
52-363-                list.innerHTML = '';
53-364-                if (window.hls && window.hls.audioTracks && window.hls.audioTracks.length > 0) {
54-365-                    window.hls.audioTracks.forEach((track, idx) => {
55-366-                        const btn = document.createElement('button');
56-367-                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.audioTrack === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
57-368-                        btn.innerHTML = `<span>${track.name || track.lang || 'Audio Track ' + (idx + 1)}</span> ${window.hls.audioTrack === idx ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
58-369-                        btn.onclick = () => {
59-370-                            window.hls.audioTrack = idx;
60-371-                            showIndicator('Audio Track: ' + (track.name || track.lang || 'Track ' + (idx + 1)));
61-372-                            closeAudioModal();
62-373-                        };
63-374-                        list.appendChild(btn);
64-375-                    });
65-376-                } else {
66-377-                    list.innerHTML = '<p class="text-xs text-zinc-500 text-center py-4">Standard Default Audio Active</p>';
67-378-                }
68-379-                if (typeof lucide !== 'undefined') lucide.createIcons();
69-380-                modal.classList.remove('hidden');
70-381-            };
71-382-
72-383-            window.closeAudioModal = function() {
73-384-                document.getElementById('audioModal').classList.add('hidden');
74-385-            };
75-386-
76-387-            window.toggleSubtitleModal = function() {
77-388-                const modal = document.getElementById('subtitleModal');
78-389-                const list = document.getElementById('subtitle-tracks-list');
79-390-                list.innerHTML = '';
80-391-
81-392-                if (window.hls && window.hls.subtitleTracks && window.hls.subtitleTracks.length > 0) {
82-393-                    const offBtn = document.createElement('button');
83-394-                    offBtn.className = `w-full text-left px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.subtitleTrack === -1 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
84-395-                    offBtn.innerHTML = '<span>Off</span>';
85-396-                    offBtn.onclick = () => { window.hls.subtitleTrack = -1; closeSubtitleModal(); };
86-397-                    list.appendChild(offBtn);
87-398-
88-399-                    window.hls.subtitleTracks.forEach((track, idx) => {
89-400-                        const btn = document.createElement('button');
90-401-                        btn.className = `w-full text-left px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.subtitleTrack === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
91-402-                        btn.innerHTML = `<span>${track.name || track.lang || 'Subtitle ' + (idx + 1)}</span>`;
92-403-                        btn.onclick = () => { window.hls.subtitleTrack = idx; closeSubtitleModal(); };
93-404-                        list.appendChild(btn);
94-405-                    });
95-406-                } else {
96-407-                    list.innerHTML = '<p class="text-xs text-zinc-500 text-center py-2">No embedded captions found</p>';
97-408-                }
98-409-                modal.classList.remove('hidden');
99-410-            };
100-411-
101-412-            window.closeSubtitleModal = function() {
102-413-                document.getElementById('subtitleModal').classList.add('hidden');
103-414-            };
104-415-
105-416-            // Quality Modal (4K / 8K / 1080p / Auto)
106-417-            window.toggleQualityModal = function() {
107-418-                const modal = document.getElementById('qualityModal');
108-419-                const list = document.getElementById('quality-tracks-list');
109-420-                list.innerHTML = '';
110-421-
111-422-                if (window.hls && window.hls.levels && window.hls.levels.length > 0) {
112-423-                    // Auto Option
113-424-                    const autoBtn = document.createElement('button');
114-425-                    autoBtn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.currentLevel === -1 ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
115-426-                    autoBtn.innerHTML = `<span>Auto (Adaptive 4K/HD)</span> ${window.hls.currentLevel === -1 ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
116-427-                    autoBtn.onclick = () => {
117-428-                        window.hls.currentLevel = -1;
118-429-                        showIndicator('Quality: Auto Adaptive');
119-430-                        closeQualityModal();
120-431-                    };
121-432-                    list.appendChild(autoBtn);
122-433-
123-434-                    window.hls.levels.forEach((level, idx) => {
124-435-                        let label = `${level.height || 'SD'}p`;
125-436-                        let badge = '';
126-437-                        if (level.height >= 4320) {
127-438-                            label = '8K Ultra HD (7680x4320)';
128-439-                            badge = '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-black text-[10px] uppercase border border-amber-500/30">8K UHD</span>';
129-440-                        } else if (level.height >= 2160) {
130-441-                            label = '4K Ultra HD (3840x2160)';
131-442-                            badge = '<span class="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-black text-[10px] uppercase border border-red-500/30">4K UHD</span>';
132-443-                        } else if (level.height >= 1440) {
133-444-                            label = '2K QHD (2560x1440)';
134-445-                            badge = '<span class="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-bold text-[10px]">2K</span>';
135-446-                        } else if (level.height >= 1080) {
136-447-                            label = '1080p Full HD';
137-448-                            badge = '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">FHD</span>';
138-449-                        } else if (level.height >= 720) {
139-450-                            label = '720p HD';
140-451-                            badge = '<span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">HD</span>';
141-452-                        }
142-453-
143-454-                        const btn = document.createElement('button');
144-455-                        btn.className = `w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between cursor-pointer transition-all ${window.hls.currentLevel === idx ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`;
145-456-                        btn.innerHTML = `<div class="flex items-center gap-2"><span>${label}</span> ${badge}</div> ${window.hls.currentLevel === idx ? '<i data-lucide="check" class="w-4 h-4"></i>' : ''}`;
146-457-                        btn.onclick = () => {
147-458-                            window.hls.currentLevel = idx;
148-459-                            if (level.height >= 2160) {
149-460-                                window.hls.config.maxBufferLength = 60;
150-461-                                window.hls.config.maxMaxBufferLength = 300;
151-462-                            }
152-463-                            showIndicator('Quality: ' + label);
153-464-                            closeQualityModal();
154-465-                        };
155-466-                        list.appendChild(btn);
156-467-                    });
157-468-                } else {
158-469-                    list.innerHTML = `
159-470-                        <div class="space-y-2 py-2">
160-471-                            <p class="text-xs text-zinc-400 text-center font-bold">Standard Single Stream Active</p>
161-472-                            <div class="p-3 bg-zinc-800/80 rounded-xl border border-zinc-700/50 text-center">
162-473-                                <span class="px-2.5 py-1 rounded bg-red-600/30 text-red-400 font-black text-xs uppercase tracking-wider inline-block">4K / 8K Passthrough Ready</span>
163-474-                                <p class="text-[11px] text-zinc-400 mt-1">Hardware acceleration and native 4K/8K decoding enabled.</p>
164-475-                            </div>
165-476-                        </div>
166-477-                    `;
167-478-                }
168-479-                if (typeof lucide !== 'undefined') lucide.createIcons();
169-480-                modal.classList.remove('hidden');
170-481-            };
171-482-
172-483-            window.closeQualityModal = function() {
173-484-                document.getElementById('qualityModal').classList.add('hidden');
174-485-            };
175-486-
176-487-            // Custom Subtitle File Handling (.srt / .vtt)
177-488-            document.addEventListener('change', (e) => {
178-489-                if (e.target && e.target.id === 'sub-file-input') {
179-490-                    const file = e.target.files[0];
180-491-                    if (!file) return;
181-492-
182-493-                    const reader = new FileReader();
183-494-                    reader.onload = (evt) => {
184-495-                        let text = evt.target.result;
185-496-                        if (file.name.endsWith('.srt')) {
186-497-                            text = 'WEBVTT\n\n' + text.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
187-498-                        }
188-499-                        const blob = new Blob([text], { type: 'text/vtt' });
189-500-                        const subUrl = URL.createObjectURL(blob);
190-501-
191-502-                        const existingTracks = video.querySelectorAll('track');
192-503-                        existingTracks.forEach(t => t.remove());
193-504-
194-505-                        const track = document.createElement('track');
195-506-                        track.kind = 'subtitles';
196-507-                        track.label = file.name;
197-508-                        track.srclang = 'custom';
198-509-                        track.src = subUrl;
199-510-                        track.default = true;
200-511-                        video.appendChild(track);
201-512-
202-513-                        showIndicator('Subtitles Loaded: ' + file.name);
203-514-                        closeSubtitleModal();
204-515-                    };
205-516-                    reader.readAsText(file);
206-517-                }
207-518-            });
208-519-
209-520-            // Sleep Timer
210-521-            window.toggleSleepTimer = function() {
211-522-                sleepModal.classList.remove('hidden');
212-523-            };
213-524-
214-525-            window.closeSleepModal = function() {
215-526-                sleepModal.classList.add('hidden');
216-527-            };
217-528-
218-529-            window.setSleepTimer = function(minutes) {
219-530-                closeSleepModal();
220-531-                if (sleepTimerInterval) clearInterval(sleepTimerInterval);
221-532-
222-533-                if (minutes <= 0) {
223-534-                    sleepIndicator.style.display = 'none';
224-535-                    showIndicator('Sleep Timer Cancelled');
225-536-                    return;
226-537-                }
227-538-
228-539-                sleepTargetTime = Date.now() + (minutes * 60 * 1000);
229-540-                sleepIndicator.style.display = 'flex';
230-541-                showIndicator(`Sleep Timer: ${minutes} Minutes`);
231-542-
232-543-                sleepTimerInterval = setInterval(() => {
233-544-                    const remaining = Math.max(0, Math.floor((sleepTargetTime - Date.now()) / 1000));
234-545-                    if (remaining <= 0) {
235-546-                        clearInterval(sleepTimerInterval);
236-547-                        if (player) player.pause();
237-548-                        video.pause();
238-549-                        sleepIndicator.style.display = 'none';
239-550-                        showIndicator('Sleep Timer Expired: Stream Paused');
240-551-                    } else {
241-552-                        const m = Math.floor(remaining / 60);
242-553-                        const s = remaining % 60;
243-554-                        sleepTimeLabel.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
244-555-                    }
245-556-                }, 1000);
246-557-            };
247-558-
248-559-            function showPlayerError(msg) {
249-560-                document.getElementById('error-message-text').innerText = msg;
250-561-                document.getElementById('player-error').classList.remove('hidden');
251-562-                loading.style.display = 'none';
252-563-            }
253-564-
254-565-            // Top Control Bar Overlay (Back, Title, Aspect, PiP, Sleep, Reconnect)
255-566-            function initTopControls(plyrInstance) {
256-567-                let topControls = document.getElementById('top-controls');
257-568-                if (!topControls) {
258-569-                    topControls = document.createElement('div');
259-570-                    topControls.id = 'top-controls';
260-571-                    topControls.className = 'absolute top-4 left-4 right-4 md:top-6 md:left-6 md:right-6 z-[9998] flex items-center justify-between transition-opacity duration-300 opacity-0 pointer-events-none';
261-572-
262-573-                    // Left controls group
263-574-                    const leftGroup = document.createElement('div');
264-575-                    leftGroup.className = 'flex items-center gap-3 pointer-events-auto';
265-576-
266-577-                    // Back button
267-578-                    const backBtn = document.createElement('button');
268-579-                    backBtn.onclick = () => window.history.back();
269-580-                    backBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
270-581-                    backBtn.innerHTML = '<i data-lucide="arrow-left" class="w-5 h-5"></i>';
271-582-                    leftGroup.appendChild(backBtn);
272-583-
273-584-                    // Title pill
274-585-                    const titlePill = document.createElement('div');
275-586-                    titlePill.className = 'flex items-center gap-2 bg-black/60 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md max-w-[200px] sm:max-w-xs md:max-w-md truncate';
276-587-                    titlePill.innerHTML = `<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span class="text-xs md:text-sm font-bold text-white truncate">${name}</span>`;
277-588-                    leftGroup.appendChild(titlePill);
278-589-
279-590-                    topControls.appendChild(leftGroup);
280-591-
281-592-                    // Right controls group
282-593-                    const rightGroup = document.createElement('div');
283-594-                    rightGroup.className = 'flex items-center gap-2 sm:gap-3 pointer-events-auto';
284-595-
285-596-                    // Reconnect Button
286-597-                    const reconnectBtn = document.createElement('button');
287-598-                    reconnectBtn.title = "Force Reconnect Stream";
288-599-                    reconnectBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
289-600-                    reconnectBtn.innerHTML = '<i data-lucide="rotate-ccw" class="w-5 h-5"></i>';
290-601-                    reconnectBtn.onclick = (e) => { e.stopPropagation(); triggerAutoReconnect(); };
291-602-                    rightGroup.appendChild(reconnectBtn);
292-603-
293-604-                    // Aspect Ratio Button
294-605-                    const aspectBtn = document.createElement('button');
295-606-                    aspectBtn.title = "Toggle Aspect Ratio";
296-607-                    aspectBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
297-608-                    aspectBtn.innerHTML = '<i data-lucide="maximize" class="w-5 h-5"></i>';
298-609-                    aspectBtn.onclick = (e) => { e.stopPropagation(); toggleAspectRatio(); };
299-610-                    rightGroup.appendChild(aspectBtn);
300-611-
301-612-                    // Quality Selector Button (4K / 8K)
302-613-                    const qualityBtn = document.createElement('button');
303-614-                    qualityBtn.title = "Stream Quality (4K / 8K / HD)";
304-615-                    qualityBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
305-616-                    qualityBtn.innerHTML = '<i data-lucide="sparkles" class="w-5 h-5 text-amber-400"></i>';
306-617-                    qualityBtn.onclick = (e) => { e.stopPropagation(); window.toggleQualityModal(); };
307-618-                    rightGroup.appendChild(qualityBtn);
308-619-
309-620-                    // Audio Track Button
310-621-                    const audioBtn = document.createElement('button');
311-622-                    audioBtn.title = "Audio Tracks";
312-623-                    audioBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
313-624-                    audioBtn.innerHTML = '<i data-lucide="volume-2" class="w-5 h-5"></i>';
314-625-                    audioBtn.onclick = (e) => { e.stopPropagation(); window.toggleAudioModal(); };
315-626-                    rightGroup.appendChild(audioBtn);
316-627-
317-628-                    // Subtitle Button
318-629-                    const subBtn = document.createElement('button');
319-630-                    subBtn.title = "Subtitles & Captions";
320-631-                    subBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
321-632-                    subBtn.innerHTML = '<i data-lucide="subtitles" class="w-5 h-5"></i>';
322-633-                    subBtn.onclick = (e) => { e.stopPropagation(); window.toggleSubtitleModal(); };
323-634-                    rightGroup.appendChild(subBtn);
324-635-
325-636-                    // Sleep Timer Button
326-637-                    const sleepBtn = document.createElement('button');
327-638-                    sleepBtn.title = "Set Sleep Timer";
328-639-                    sleepBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-zinc-800 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
329-640-                    sleepBtn.innerHTML = '<i data-lucide="clock" class="w-5 h-5"></i>';
330-641-                    sleepBtn.onclick = (e) => { e.stopPropagation(); window.toggleSleepTimer(); };
331-642-                    rightGroup.appendChild(sleepBtn);
332-643-
333-644-                    // PiP Button
334-645-                    if (document.pictureInPictureEnabled || video.webkitSupportsPresentationMode) {
335-646-                        const pipBtn = document.createElement('button');
336-647-                        pipBtn.title = "Picture in Picture";
337-648-                        pipBtn.className = 'flex items-center justify-center w-10 h-10 md:w-12 md:h-12 bg-black/60 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg border border-white/10 backdrop-blur-md cursor-pointer';
338-649-                        pipBtn.innerHTML = '<i data-lucide="picture-in-picture-2" class="w-5 h-5"></i>';
339-650-                        pipBtn.onclick = async (e) => {
340-651-                            e.stopPropagation();
341-652-                            try {
342-653-                                if (document.pictureInPictureElement) {
343-654-                                    await document.exitPictureInPicture();
344-655-                                } else {
345-656-                                    await video.requestPictureInPicture();
346-657-                                }
347-658-                            } catch(err) { console.warn("PiP failed:", err); }
348-659-                        };
349-660-                        rightGroup.appendChild(pipBtn);
350-661-                    }
351-662-
352-663-                    topControls.appendChild(rightGroup);
353-664-
354-665-                    const container = document.getElementById('player-container');
355-666-                    container.appendChild(topControls);
356-667-                    if (typeof lucide !== 'undefined') lucide.createIcons();
357-668-                }
358-669-
359-670-                if (plyrInstance) {
360-671-                    plyrInstance.on('controlsshown', () => {
361-672-                        topControls.classList.remove('opacity-0', 'pointer-events-none');
362-673-                    });
363-674-                    plyrInstance.on('controlshidden', () => {
364-675-                        topControls.classList.add('opacity-0', 'pointer-events-none');
365-676-                    });
366-677-                }
367-678-                topControls.classList.remove('opacity-0', 'pointer-events-none');
368-679-            }
369-680-
370-681-            // Advanced Touch Gestures (Double Tap -10s/+10s)
371-682-            function initAdvancedGestures(player, video) {
372-683-                const container = player.elements?.container || video.closest('.plyr');
373-684-                if (!container) return;
374-685-
375-686-                const indicator = document.getElementById('zoom-indicator');
376-687-                function showIndicator(text) {
377-688-                    if (!indicator) return;
378-689-                    indicator.textContent = text;
379-690-                    indicator.style.opacity = '1';
380-691-                    setTimeout(() => indicator.style.opacity = '0', 1500);
381-692-                }
382-693-
383-694-                // --- MOBILE GESTURES ---
384-695-                let startX, startY;
385-696-                let isDragging = false;
386-697-                let dragType = null; // 'volume', 'brightness', 'seek'
387-698-                let initialValue = 0;
388-699-                let brightness = 100;
389-700-
390-701-                container.addEventListener('touchstart', (e) => {
391-702-                    if (e.touches.length === 1) {
392-703-                        startX = e.touches[0].pageX;
393-704-                        startY = e.touches[0].pageY;
394-705-                        isDragging = false;
395-706-                        dragType = null;
396-707-                    }
397-708-                }, { passive: true });
398-709-
399-710-                container.addEventListener('touchmove', (e) => {
400-711-                    if (e.touches.length === 1) {
401-712-                        const moveX = e.touches[0].pageX;
402-713-                        const moveY = e.touches[0].pageY;
403-714-                        const diffX = moveX - startX;
404-715-                        const diffY = moveY - startY;
405-716-
406-717-                        if (!isDragging && (Math.abs(diffX) > 20 || Math.abs(diffY) > 20)) {
407-718-                            isDragging = true;
408-719-                            const rect = container.getBoundingClientRect();
409-720-                            if (startX < rect.width / 2) {
410-721-                                dragType = 'brightness';
411-722-                                initialValue = brightness;
412-723-                            } else {
413-724-                                dragType = 'volume';
414-725-                                initialValue = player.volume * 100;
415-726-                            }
416-727-                        }
417-728-
418-729-                        if (isDragging) {
419-730-                            if (window.plyrPlayer) {
420-731-                                window.plyrPlayer.toggleControls(true);
421-732-                            }
422-733-                            const rect = container.getBoundingClientRect();
423-734-                            if (dragType === 'brightness') {
424-735-                                const change = (diffY / rect.height) * -200;
425-736-                                brightness = Math.max(10, Math.min(200, initialValue + change));
426-737-                                document.body.style.filter = `brightness(${brightness}%)`;
427-738-                                showIndicator(`Brightness: ${Math.round(brightness)}%`);
428-739-                            } else if (dragType === 'volume') {
429-740-                                const change = (diffY / rect.height) * -1;
430-741-                                const newVolume = Math.max(0, Math.min(1, (initialValue / 100) + change));
431-742-                                player.volume = newVolume;
432-743-                                showIndicator(`Volume: ${Math.round(newVolume * 100)}%`);
433-744-                            }
434-745-                        }
435-746-                    }
436-747-                }, { passive: false });
437-748-
438-749-                // Double tap side to skip
439-750-                let lastTap = 0;
440-751-                container.addEventListener('touchend', (e) => {
441-752-                    if (e.touches.length === 0) {
442-753-                        const currentTime = new Date().getTime();
443-754-                        const tapLength = currentTime - lastTap;
444-755-                        if (tapLength < 300 && tapLength > 0 && !isDragging) {
445-756-                            const rect = container.getBoundingClientRect();
446-757-                            const x = e.changedTouches[0].clientX - rect.left;
447-758-                            if (x < rect.width * 0.25) {
448-759-                                player.rewind(10);
449-760-                                showIndicator('Rewind 10s');
450-761-                                e.preventDefault();
451-762-                            } else if (x > rect.width * 0.75) {
452-763-                                player.forward(10);
453-764-                                showIndicator('Forward 10s');
454-765-                                e.preventDefault();
455-766-                            } else if (x > rect.width * 0.3 && x < rect.width * 0.7) {
456-767-                                // Center double tap for zoom
457-768-                                document.body.classList.toggle('video-zoom-fill');
458-769-                                showIndicator(document.body.classList.contains('video-zoom-fill') ? 'Zoomed to Fill' : 'Original Fit');
459-770-                                e.preventDefault();
460-771-                            }
461-772-                        }
462-773-                        lastTap = currentTime;
463-774-                    }
464-775-                });
465-776-
466-777-                // Keyboard Shortcuts
467-778-            document.addEventListener('keydown', (e) => {
468-779-                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
469-780-                
470-781-                switch(e.key.toLowerCase()) {
471-782-                    case ' ':
472-783-                    case 'k':
473-784-                        e.preventDefault();
474-785-                        if (video.paused) video.play(); else video.pause();
475-786-                        break;
476-787-                    case 'arrowright':
477-788-                    case 'l':
478-789-                        e.preventDefault();
479-790-                        video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
480-791-                        showIndicator('+10s Forward');
481-792-                        break;
482-793-                    case 'arrowleft':
483-794-                    case 'j':
484-795-                        e.preventDefault();
485-796-                        video.currentTime = Math.max(0, video.currentTime - 10);
486-797-                        showIndicator('-10s Rewind');
487-798-                        break;
488-799-                    case 'arrowup':
489-800-                        e.preventDefault();
490-801-                        video.volume = Math.min(1, video.volume + 0.1);
491-802-                        showIndicator(`Volume: ${Math.round(video.volume * 100)}%`);
492-803-                        break;
493-804-                    case 'arrowdown':
494-805-                        e.preventDefault();
495-806-                        video.volume = Math.max(0, video.volume - 0.1);
496-807-                        showIndicator(`Volume: ${Math.round(video.volume * 100)}%`);
497-808-                        break;
498-809-                    case 'f':
499-810-                        e.preventDefault();
500-811-                        if (!document.fullscreenElement) {
501-812-                            document.getElementById('player-container').requestFullscreen().catch(() => {});
502-813-                        } else {
503-814-                            document.exitFullscreen();
504-815-                        }
505-816-                        break;
506-817-                    case 'm':
507-818-                        e.preventDefault();
508-819-                        video.muted = !video.muted;
509-820-                        showIndicator(video.muted ? 'Muted' : 'Unmuted');
510-821-                        break;
511-822-                    case 'a':
512-823-                        e.preventDefault();
513-824-                        toggleAspectRatio();
514-825-                        break;
515-826-                }
516-827-            });
517-828-
518-829-            // Smart Auto-Reconnect Watchdog
519-830-            function triggerAutoReconnect() {
520-831-                if (isReconnecting) return;
521-832-                isReconnecting = true;
522-833-                console.warn("[Player] Triggering Auto-Reconnect...");
523-834-                loading.style.display = 'flex';
524-835-                
525-836-                if (typeof destroyMpegPlayer === 'function') {
526-837-                    destroyMpegPlayer();
527-838-                } else if (mpegPlayer) {
528-839-                    try {
529-840-                        mpegPlayer.pause();
530-841-                        mpegPlayer.unload();
531-842-                        mpegPlayer.detachMediaElement();
532-843-                        mpegPlayer.destroy();
533-844-                    } catch(e){}
534-845-                    mpegPlayer = null;
535-846-                }
536-847-                if (hls) {
537-848-                    try { hls.destroy(); } catch(e){}
538-849-                    hls = null;
539-850-                }
540-851-
541-852-                setTimeout(() => {
542-853-                    isReconnecting = false;
543-854-                    initPlayer();
544-855-                }, 1500);
545-856-            }
546-857-
547-858-            function jumpToSafeLiveBuffer(vid) {
548-859-                if (!vid || vid.paused || vid.seeking || !vid.buffered || vid.buffered.length === 0) return;
549-860-                const start = vid.buffered.start(0);
550-861-                const end = vid.buffered.end(vid.buffered.length - 1);
551-862-
552-863-                // If currentTime is behind buffer start when playing, move safely forward
553-864-                if (vid.currentTime < start - 0.5) {
554-865-                    console.warn(`[Live Guard] currentTime (${vid.currentTime}) behind buffer start (${start}). Fast-forwarding...`);
555-866-                    vid.currentTime = Math.max(start + 0.1, end - 0.5);
556-867-                    vid.play().catch(() => {});
557-868-                }
558-869-            }
559-870-
560-871-            function startWatchdog() {
561-872-                if (watchdogTimer) clearInterval(watchdogTimer);
562-873-                lastCurrentTime = video.currentTime;
563-874-                lastProgressTime = Date.now();
564-875-
565-876-                watchdogTimer = setInterval(() => {
566-877-                    if (isReconnecting || video.paused || video.ended) {
567-878-                        lastCurrentTime = video.currentTime;
568-879-                        lastProgressTime = Date.now();
569-880-                        return;
570-881-                    }
571-882-
572-883-                    if (video.currentTime !== lastCurrentTime) {
573-884-                        lastCurrentTime = video.currentTime;
574-885-                        lastProgressTime = Date.now();
575-886-                    } else {
576-887-                        const stalledTime = Date.now() - lastProgressTime;
577-888-                        if (stalledTime > 2500) {
578-889-                            jumpToSafeLiveBuffer(video);
579-890-                        }
580-891-                        if (stalledTime > 12000) {
581-892-                            console.warn(`[Watchdog] Stream playback completely frozen for ${Math.round(stalledTime/1000)}s. Auto-reconnecting...`);
582-893-                            triggerAutoReconnect();
583-894-                        }
584-895-                    }
585-896-                }, 1000);
586-897-            }
587-898-
588-899-            // Main Player Initialization
589-900-            function initPlayer() {
590-901-                if (!src) {
591-902-                    showPlayerError("No stream URL specified.");
592-903-                    return;
593-904-                }
594-905-
595-906-                // 15 seconds fallback warning
596-907-                setTimeout(() => {
597-908-                    const fallbackBtn = document.getElementById('loading-fallback');
598-909-                    if (fallbackBtn) fallbackBtn.classList.remove('hidden');
599-910-                }, 15000);
600-911-
601-912-                const lowerSrc = src.toLowerCase();
602-913-                const isDirectMedia = lowerSrc.endsWith('.mp4') || lowerSrc.endsWith('.mkv') || lowerSrc.endsWith('.webm') || lowerSrc.endsWith('.avi') || lowerSrc.endsWith('.mp3');
603-914-
604-915-                // Treat stream links with /play/, .ts, custom_ts, transcode=1, or custom M3U IPTV links as MPEG-TS by default
605-916-                                const isM3U8 = lowerSrc.includes('.m3u8') || lowerSrc.includes('m3u=1') || lowerSrc.includes('m3u8=1') || lowerSrc.includes('type=m3u8');
606-917-                const isTs = !isDirectMedia && !isM3U8 && (
607-918-                    lowerSrc.includes('/play/') ||
608-919-                    lowerSrc.includes('.ts') ||
609-920-                    lowerSrc.includes('transcode=1') ||
610-921-                    lowerSrc.includes('ffmpeg=1') ||
611-922-                    lowerSrc.includes('custom_ts=1') ||
612-923-                    lowerSrc.includes('/api/stream-proxy') ||
613-924-                    true // If it's not direct media and not HLS, assume TS
614-925-                );
615-926-
616-927-                let resolvedSrc = src;
617-928-                if ((src.startsWith('http://') || src.startsWith('https://')) && !src.includes('live.php') && !src.includes('xtream.php') && !src.includes('/api/stream-proxy')) {
618-929-                    if (isTs || lowerSrc.includes('/play/') || src.includes('transcode=1') || src.includes('ffmpeg=1') || src.includes('custom_ts=1') || src.includes('source=consumet') || src.includes('custom_m3u')) {
619-930-                        resolvedSrc = `/api/stream-proxy?url=${encodeURIComponent(src)}`;
620-931-                    } else {
621-932-                        resolvedSrc = `live.php?id=${encodeURIComponent(src)}`;
622-933-                    }
623-934-                }
624-935-                try {
625-936-                    resolvedSrc = new URL(resolvedSrc, window.location.origin).href;
626-937-                } catch(e) {
627-938-                    console.warn("URL resolution error:", e);
628-939-                }
629-940-
630-941-                function destroyMpegPlayer() {
631-942-                    if (mpegPlayer) {
632-943-                        try {
633-944-                            mpegPlayer.pause();
634-945-                            mpegPlayer.unload();
635-946-                            mpegPlayer.detachMediaElement();
636-947-                            mpegPlayer.destroy();
637-948-                        } catch(e){}
638-949-                        mpegPlayer = null;
639-950-                    }
640-951-                }
641-952-
642-953-                function loadMpegTs(streamUrl) {
643-954-                    try {
644-955-                        streamUrl = new URL(streamUrl, window.location.origin).href;
645-956-                    } catch(e){}
646-957-                    console.log("[MPEG-TS Engine] Initializing mpegts.js for stream:", streamUrl);
647-958-                    destroyMpegPlayer();
648-959-
649-960-                    try {
650-961-                        mpegPlayer = mpegts.createPlayer({
651-962-                            type: 'mpegts',
652-963-                            isLive: true,
653-964-                            url: streamUrl
654-965-                        }, {
655-966-                            enableWorker: true,
656-967-                            enableStashBuffer: false,
657-968-                            stashInitialSize: 128,
658-969-                            liveBufferLatencyChasing: true,
659-970-                            liveBufferLatencyMaxLatency: 2.5,
660-971-                            liveBufferLatencyMinLatency: 0.5,
661-972-                            liveBufferLatencyChasingOnStall: true,
662-973-                            fixAudioTimestampGap: true,
663-974-                            reuse33bitClip: true,
664-975-                            autoCleanupSourceBuffer: true,
665-976-                            autoCleanupMaxBackwardDuration: 30,
666-977-                            autoCleanupMinBackwardDuration: 10,
667-978-                            lazyLoad: false
668-979-                        });
669-980-
670-981-                        mpegPlayer.attachMediaElement(video);
671-982-                        mpegPlayer.load();
672-983-
673-984-                        mpegPlayer.on(mpegts.Events.MEDIA_INFO, (mediaInfo) => {
674-985-                            console.log("[MPEG-TS Engine] Media Info parsed:", mediaInfo);
675-986-                            if (video.paused) {
676-987-                                const p = video.play();
677-988-                                if (p && p.catch) {
678-989-                                    p.catch(() => {
679-990-                                        console.warn("[MPEG-TS] Autoplay unmuted blocked, muting video to auto-start...");
680-991-                                        video.muted = true;
681-992-                                        video.play().catch(() => {});
682-993-                                    });
683-994-                                }
684-995-                            }
685-996-                        });
686-997-
687-998-                        mpegPlayer.on(mpegts.Events.ERROR, (type, details, data) => {
688-999-                            console.error('[MPEG-TS Engine Error]', type, details, data);
689-1000-                            if (type === mpegts.ErrorTypes.MEDIA_ERROR || details === mpegts.ErrorDetails.FORMAT_UNSUPPORTED) {
690-1001-                                console.warn("[MPEG-TS] Fallback to native or HLS video playback...");
691-1002-                                destroyMpegPlayer();
692-1003-                                if (Hls.isSupported()) {
693-1004-                                    loadHls(streamUrl);
694-1005-                                } else {
695-1006-                                    video.src = streamUrl;
696-1007-                                    video.load();
697-1008-                                    video.play().catch(e => {
698-1009-                                        showPlayerError("Playback failed: Incompatible MPEG-TS video/audio codecs or unreachable stream.");
699-1010-                                    });
700-1011-                                }
701-1012-                                return;
702-1013-                            } else if (type === mpegts.ErrorTypes.NETWORK_ERROR) {
703-1014-                                console.warn("[MPEG-TS Network Error] Attempting auto-reconnect...");
704-1015-                                triggerAutoReconnect();
705-1016-                                return;
706-1017-                            }
707-1018-                            triggerAutoReconnect();
708-1019-                        });
709-1020-
710-1021-                        // Anti-Freeze & Rate Guard
711-1022-                        video.addEventListener('ratechange', () => {
712-1023-                            if (video.playbackRate !== 1.0) {
713-1024-                                video.playbackRate = 1.0;
714-1025-                            }
715-1026-                        });
716-1027-                    } catch (err) {
717-1028-                        console.error("[MPEG-TS Engine Init Failed]", err);
718-1029-                        if (Hls.isSupported()) {
719-1030-                            loadHls(streamUrl);
720-1031-                        } else {
721-1032-                            video.src = streamUrl;
722-1033-                            video.load();
723-1034-                            video.play().catch(() => {
724-1035-                                showPlayerError("Failed to initialize MPEG-TS player: " + (err.message || "Unknown error"));
725-1036-                            });
726-1037-                        }
727-1038-                        return;
728-1039-                    }
729-1040-
730-1041-                    if (!player) {
731-1042-                        player = new Plyr(video, {
732-1043-                            controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
733-1044-                            autoplay: true,
734-1045-                            muted: false,
735-1046-                                hideControls: { enabled: true, delay: 4000 }
736-1047-                            });
737-1048-                        window.plyrPlayer = player;
738-1049-                    }
739-1050-
740-1051-                    video.style.opacity = '1';
741-1052-                    loading.style.display = 'none';
742-1053-
743-1054-                    video.play().catch(e => {
744-1055-                        console.warn("[MPEG-TS] Autoplay blocked, click play to start:", e);
745-1056-                    });
746-1057-
747-1058-                    initTopControls(player);
748-1059-                    initAdvancedGestures(player, video);
749-1060-                    startWatchdog();
750-1061-                    window.mpegPlayer = mpegPlayer;
751-1062-                }
752-1063-
753-1064-                function loadHls(streamUrl) {
754-1065-                    try {
755-1066-                        streamUrl = new URL(streamUrl, window.location.origin).href;
756-1067-                    } catch(e){}
757-1068-                    console.log("[HLS Engine] Initializing Hls.js for stream:", streamUrl);
758-1069-                    if (hls) {
759-1070-                        try { hls.destroy(); } catch(e){}
760-1071-                        hls = null;
761-1072-                    }
762-1073-
763-1074-                    hls = new Hls({
764-1075-                        enableWorker: true,
765-1076-                        maxBufferLength: 60,
766-1077-                        maxMaxBufferLength: 300,
767-1078-                        maxBufferSize: 128 * 1024 * 1024,
768-1079-                        backBufferLength: 60,
769-1080-                        maxBufferHole: 1.5,
770-1081-                        highBufferWatchdogPeriod: 0,
771-1082-                        nudgeOffset: 0.2,
772-1083-                        nudgeMaxRetry: 10,
773-1084-                        liveSyncDurationCount: 8,
774-1085-                        liveMaxLatencyDurationCount: 30,
775-1086-                        lowLatencyMode: false,
776-1087-                        manifestLoadingTimeOut: 30000,
777-1088-                        manifestLoadingMaxRetry: 10,
778-1089-                        manifestLoadingRetryDelay: 1000,
779-1090-                        levelLoadingTimeOut: 30000,
780-1091-                        levelLoadingMaxRetry: 10,
781-1092-                        fragLoadingTimeOut: 45000,
782-1093-                        fragLoadingMaxRetry: 10,
783-1094-                        fragLoadingRetryDelay: 1000,
784-1095-                        xhrSetup: (xhr) => {
785-1096-                            xhr.withCredentials = false;
786-1097-                        }
787-1098-                    });
788-1099-
789-1100-                    hls.loadSource(streamUrl);
790-1101-                    hls.attachMedia(video);
791-1102-
792-1103-                    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
793-1104-                        console.log(`[HLS] Manifest parsed. Quality levels: ${data.levels.length}`);
794-1105-                        video.style.opacity = '1';
795-1106-                        loading.style.display = 'none';
796-1107-                        
797-1108-                        if (!player) {
798-1109-                            player = new Plyr(video, {
799-1110-                                controls: ['play-large', 'play', 'progress', 'current-time', 'duration', 'mute', 'volume', 'settings', 'pip', 'fullscreen'],
800-1111-                                autoplay: true,
801-1112-                                muted: false,
802-1113-                                hideControls: { enabled: true, delay: 4000 }
803-1114-                            });
804-1115-                            window.plyrPlayer = player;
805-1116-                        }
806-1117-
807-1118-                        video.play().catch(e => {
808-1119-                            console.warn("[HLS] Autoplay blocked, click play to start:", e);
809-1120-                        });
810-1121-
811-1122-                        initTopControls(player);
812-1123-                        initAdvancedGestures(player, video);
813-1124-                        startWatchdog();
814-1125-                    });
815-1126-
816-1127-                    hls.on(Hls.Events.ERROR, (event, data) => {
817-1128-                        console.warn('[HLS Error Event]', data.type, data.details, data.fatal ? 'FATAL' : 'NON-FATAL');
818-1129-
819-1130-                        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
820-1131-                            if (data.details === 'bufferSeekOverHole' || data.details === Hls.ErrorDetails.BUFFER_SEEK_OVER_HOLE) {
821-1132-                                if (data.buffer) {
822-1133-                                    video.currentTime = data.buffer.nextStart;
823-1134-                                }
824-1135-                                return;
825-1136-                            }
826-1137-                            if (data.details === 'bufferStalledError' || data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
827-1138-                                console.warn('[HLS] Buffer stalled, nudging player...');
828-1139-                                if (hls && hls.recoverMediaError) hls.recoverMediaError();
829-1140-                                if (video.paused && !video.ended) {
830-1141-                                    video.play().catch(() => {});
831-1142-                                }
832-1143-                                return;
833-1144-                            }
834-1145-                        }
835-1146-
836-1147-                        if (data.fatal) {
837-1148-                            switch (data.type) {
838-1149-                                case Hls.ErrorTypes.NETWORK_ERROR:
839-1150-                                    console.warn('[HLS Network Error] Retrying stream load...');
840-1151-                                    triggerAutoReconnect();
841-1152-                                    break;
842-1153-                                case Hls.ErrorTypes.MEDIA_ERROR:
843-1154-                                    console.warn('[HLS Media Error] Recovering media error...');
844-1155-                                    hls.recoverMediaError();
845-1156-                                    break;
846-1157-                                default:
847-1158-                                    console.error('[HLS Fatal Error] Unrecoverable error. Trying MPEG-TS fallback...');
848-1159-                                    if (typeof mpegts !== 'undefined' && mpegts.isSupported()) {
849-1160-                                        loadMpegTs(streamUrl);
850-1161-                                    } else {
851-1162-                                        triggerAutoReconnect();
852-1163-                                    }
853-1164-                                    break;
854-1165-                            }
855-1166-                        }
856-1167-                    });
857-1168-
858-1169-                    window.hls = hls;
859-1170-                }
860-1171-
861-1172-                const finalIsTs = isTs || resolvedSrc.includes('/api/stream-proxy') || lowerSrc.includes('/play/');
862-1173-
863-1174-                if (finalIsTs && typeof mpegts !== 'undefined' && mpegts.isSupported()) {
864-1175-                    loadMpegTs(resolvedSrc);
865-1176-                } else if (Hls.isSupported() && !resolvedSrc.includes('/api/stream-proxy')) {
866-1177-                    loadHls(resolvedSrc);
867-1178-                } else {
868-1179-                    video.src = resolvedSrc;
869-1180-                    video.load();
870-1181-                    video.play().catch(() => {});
871-1182-                }
872-1183-            }
873-1184-
874-1185-            initPlayer();
875-1186-        });
876:1187-    </script>
877-1188-
878-1189-    <!-- Touch Gestures Overlay -->
879-1190-    <div id="touchGestureOverlay" class="absolute inset-0 z-40 hidden md:block" style="touch-action: none; pointer-events: none;"></div>
880-1191-    
881-1192:    <script>
882-1193-        document.addEventListener("DOMContentLoaded", () => {
883-1194-            const plyrContainer = document.querySelector('.plyr') || document.getElementById('player-container');
884-1195-            if(!plyrContainer) return;
885-1196-
886-1197-
887:1198-    </script>
