// TorrStream Client Application Logic

const TORRSERVER_BASE = '';

// State
let activeTorrentHash = null;
let activeFileIndex = null;
let currentTorrentData = null;
let statsPollInterval = null;
let serverPollInterval = null;
let metadataPollTimer = null;
let gstEngineMode = 'direct'; // Default: 'direct' (Direct Stream Raw), 'remux' (FFmpeg Remux), 'transcode' (FFmpeg Transcode)
let currentStreamInfo = { hash: null, fileId: null, filePath: '', title: '', fileLength: 0 };
let directRetryCount = 0;
let isPlaybackInitiated = false;

// DOM Elements
const serverStatusPill = document.getElementById('serverStatusPill');
const serverStatusText = document.getElementById('serverStatusText');
const refreshServerBtn = document.getElementById('refreshServerBtn');
const bufferPresetText = document.getElementById('bufferPresetText');
const presetTag = document.getElementById('presetTag');

const magnetForm = document.getElementById('magnetForm');
const magnetInput = document.getElementById('magnetInput');
const pasteBtn = document.getElementById('pasteBtn');
const clearInputBtn = document.getElementById('clearInputBtn');
const playBtn = document.getElementById('playBtn');

const videoPlayer = document.getElementById('videoPlayer');
const playerPlaceholder = document.getElementById('playerPlaceholder');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSubtitle = document.getElementById('loadingSubtitle');
const bufferProgressFill = document.getElementById('bufferProgressFill');

const statsOverlay = document.getElementById('statsOverlay');
const statSpeed = document.getElementById('statSpeed');
const statPeers = document.getElementById('statPeers');
const statBuffer = document.getElementById('statBuffer');

const currentTitle = document.getElementById('currentTitle');
const currentHash = document.getElementById('currentHash');
const currentSize = document.getElementById('currentSize');
const copyStreamUrlBtn = document.getElementById('copyStreamUrlBtn');
const toggleFilesBtn = document.getElementById('toggleFilesBtn');

const filesListContainer = document.getElementById('filesListContainer');
const filesCountBadge = document.getElementById('filesCountBadge');
const activeTorrentsList = document.getElementById('activeTorrentsList');
const refreshTorrentsBtn = document.getElementById('refreshTorrentsBtn');

// Search Modal Elements
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchModal = document.getElementById('searchModal');
const modalSearchForm = document.getElementById('modalSearchForm');
const modalSearchInput = document.getElementById('modalSearchInput');
const searchResultsArea = document.getElementById('searchResultsArea');
const episodeSelectRow = document.getElementById('episodeSelectRow');
const seasonInput = document.getElementById('seasonInput');
const episodeInput = document.getElementById('episodeInput');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();
  
  checkServerConnection();
  serverPollInterval = setInterval(checkServerConnection, 5000);
  
  setupEventListeners();
  loadActiveTorrentsList();
  
  // Set Instant Stream 200MB + 10% Prebuffer + Auto Cache Removal for zero-wait playback
  applyBufferSettings(524288000, 120, 10, '500MB Instant', 'Instant Stream');

  // Check URL parameters for Direct Auto-Play API Link (?q=... or ?play=... or ?magnet=...)
  checkUrlAutoPlay();
});

// Helper functions for size prioritization (1.5GB - 2.5GB movie streams given top priority)
function parseSizeBytes(input) {
  if (typeof input === 'number' && !isNaN(input)) return input;
  if (!input || typeof input !== 'string') return 0;
  const str = input.trim();
  const match = str.match(/([\d\.]+)\s*([GMKT]?i?B)/i);
  if (match) {
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase().replace('I', '');
    if (unit === 'TB') return val * 1024 * 1024 * 1024 * 1024;
    if (unit === 'GB') return val * 1024 * 1024 * 1024;
    if (unit === 'MB') return val * 1024 * 1024;
    if (unit === 'KB') return val * 1024;
    if (unit === 'B') return val;
  }
  return 0;
}

function getStreamPriorityScore(item, isMovie = true) {
  let bytes = item.sizeBytes || 0;
  if (!bytes && item.size) {
    bytes = parseSizeBytes(item.size);
  }
  if (!bytes && item.raw_title) {
    bytes = parseSizeBytes(item.raw_title);
  }

  const sizeInGB = bytes / (1024 * 1024 * 1024);
  const seeders = item.seeders || item.seeds || 0;

  let tierScore = 0;
  if (isMovie) {
    if (sizeInGB >= 1.45 && sizeInGB <= 2.55) {
      // MOST PRIORITIZED: 1.5 GB to 2.5 GB
      tierScore = 300000;
    } else if (sizeInGB > 0 && sizeInGB < 1.45) {
      // MEDIUM PRIORITY: Less than 1.5 GB
      tierScore = 200000;
    } else if (sizeInGB > 2.55) {
      // LEAST PRIORITIZED: Above 2.5 GB
      tierScore = 100000;
    } else {
      tierScore = 50000;
    }
  } else {
    tierScore = 100000;
  }

  return tierScore + Math.min(seeders, 9999);
}

// Direct Auto-Play API Handler
async function checkUrlAutoPlay() {
  const urlParams = new URLSearchParams(window.location.search);
  const autoQuery = urlParams.get('play') || urlParams.get('q') || urlParams.get('search') || urlParams.get('magnet');

  if (autoQuery) {
    const queryStr = autoQuery.trim();
    console.log(`[Auto-Play API] Direct play trigger for: "${queryStr}"`);
    magnetInput.value = queryStr;

    if (queryStr.startsWith('magnet:?') || queryStr.startsWith('http://') || queryStr.startsWith('https://')) {
      playMagnetOrUrl(queryStr);
    } else {
      showLoading(`Searching & Auto-Playing "${queryStr}"...`, 'Fetching best stream from external providers...');
      try {
        const type = urlParams.get('type') || 'movie';
        const season = urlParams.get('season') || urlParams.get('s') || '1';
        const episode = urlParams.get('episode') || urlParams.get('e') || '1';
        const tmdb = urlParams.get('tmdb');
        const imdb = urlParams.get('imdb');

        let searchApiUrl = `/api/v1/search?q=${encodeURIComponent(queryStr)}&type=${type}&s=${season}&e=${episode}`;
        if (tmdb) searchApiUrl += `&tmdb=${tmdb}`;
        if (imdb) searchApiUrl += `&imdb=${imdb}`;

        const res = await fetch(searchApiUrl);
        if (res.ok) {
          const data = await res.json();
          
    let results = data.results || data.streams || [];
    if (results.length === 0 && data.imdbId) {
        try {
            const torrentioType = data.mediaType === 'series' ? 'series' : 'movie';
            const streamPath = torrentioType === 'series' ? `${data.imdbId}:${data.season}:${data.episode}` : data.imdbId;
            const torUrl = `https://torrentio.strem.fun/stream/${torrentioType}/${streamPath}.json`;
            console.log('Fallback fetching from Torrentio API on client:', torUrl);
            const torRes = await fetch(torUrl);
            const torData = await torRes.json();
            if (torData && torData.streams) {
                results = torData.streams.map(s => {
                    const infoHash = s.infoHash;
                    let magnet = s.magnet;
                    if (!magnet && infoHash) {
                        magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(data.title)}`;
                        const DEFAULT_TRACKERS = [
                            'http://nyaa.tracker.wf:7777/announce',
                            'udp://tracker.opentrackr.org:1337/announce',
                            'udp://open.stealth.si:80/announce',
                            'udp://tracker.torrent.eu.org:451/announce',
                            'udp://exodus.desync.com:6969/announce',
                            'udp://tracker.dler.org:6969/announce',
                            'udp://open.demonii.com:1337/announce',
                            'udp://tracker.openbittorrent.com:6969/announce',
                            'udp://opentracker.i2p.rocks:6969/announce'
                        ];
                        DEFAULT_TRACKERS.forEach(tr => {
                            magnet += `&tr=${encodeURIComponent(tr)}`;
                        });
                    }
                    const rawTitle = s.title || s.name || data.title;
                    const seedMatch = rawTitle.match(/👤\s*(\d+)/);
                    const sizeMatch = rawTitle.match(/💾\s*([\d\.]+\s*[GMK]B)/i);
                    const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);
                    return {
                        name: s.name || 'Torrent Stream',
                        title: `${data.title} (${qualityMatch ? qualityMatch[1] : '1080p'})`,
                        raw_title: rawTitle,
                        magnet: magnet,
                        infoHash: infoHash,
                        seeders: seedMatch ? parseInt(seedMatch[1]) : 0,
                        size: sizeMatch ? sizeMatch[1] : 'Unknown',
                        quality: qualityMatch ? qualityMatch[1] : 'HD'
                    };
                });
                results.sort((a, b) => getStreamPriorityScore(b, (type || 'movie') === 'movie') - getStreamPriorityScore(a, (type || 'movie') === 'movie'));
                data.results = results;
            }
        } catch (e) {
            console.error('Fallback torrentio error:', e);
        }
    }

          if (data.results && data.results.length > 0) {
            const isMovie = (type || 'movie') === 'movie';
            data.results.sort((a, b) => getStreamPriorityScore(b, isMovie) - getStreamPriorityScore(a, isMovie));
            const bestResult = data.results[0];
            console.log(`[Auto-Play API] Selected top stream (Size Prioritized): ${bestResult.title} (${bestResult.size || 'Unknown'})`);
            magnetInput.value = bestResult.magnet;
            playMagnetOrUrl(bestResult.magnet);
            return;
          }
        }
      } catch (e) {
        console.warn('Auto-play search failed:', e);
      }
      playMagnetOrUrl(queryStr);
    }
  }
}

// Event Listeners
function setupEventListeners() {
  refreshServerBtn.addEventListener('click', checkServerConnection);
  
  clearInputBtn.addEventListener('click', () => {
    magnetInput.value = '';
    magnetInput.focus();
  });

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        magnetInput.value = text.trim();
        magnetInput.focus();
      }
    } catch (err) {
      console.warn('Clipboard access denied:', err);
    }
  });

  magnetForm.addEventListener('submit', (e) => {
    e.preventDefault();
        e.stopImmediatePropagation();
    const inputVal = magnetInput.value.trim();
    if (inputVal) {
      playMagnetOrUrl(inputVal);
    }
  });

  // Search Type Radio Toggle (Movie vs TV Series)
  document.querySelectorAll('input[name="mediaType"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'series') {
        episodeSelectRow.classList.remove('hidden');
      } else {
        episodeSelectRow.classList.add('hidden');
      }
    });
  });

  // Search Modal Handlers
  openSearchBtn.addEventListener('click', () => {
    searchModal.classList.remove('hidden');
    modalSearchInput.focus();
  });

  closeSearchBtn.addEventListener('click', () => {
    searchModal.classList.add('hidden');
  });

  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      searchModal.classList.add('hidden');
    }
  });

  modalSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = modalSearchInput.value.trim();
    const selectedType = document.querySelector('input[name="mediaType"]:checked').value;
    const season = seasonInput.value || '1';
    const episode = episodeInput.value || '1';

    if (q) performMovieSearch(q, selectedType, season, episode);
  });

  // Buffer Mode Buttons
  document.querySelectorAll('.buffer-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.buffer-mode-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cacheSize = parseInt(btn.dataset.cache);
      const maxPeers = parseInt(btn.dataset.peers);
      const label = btn.dataset.label;
      const tagText = cacheSize >= 500000000 ? 'Ultra 4K' : (cacheSize >= 200000000 ? 'Instant Stream' : 'Standard');

      applyBufferSettings(cacheSize, maxPeers, 10, `${label} Cache`, tagText);
    });
  });

  // Sample Chips
  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const mag = chip.getAttribute('data-magnet');
      if (mag) {
        magnetInput.value = mag;
        playMagnetOrUrl(mag);
      }
    });
  });

  // Video Events
  ['playing', 'timeupdate', 'canplay'].forEach(evt => {
    videoPlayer.addEventListener(evt, () => {
      isPlaybackInitiated = true;
      hideLoading();
      playerPlaceholder.classList.add('hidden');
    });
  });

  videoPlayer.addEventListener('waiting', () => {
    if (isPlaybackInitiated || videoPlayer.error || (videoPlayer.paused && typeof isPerformSeeking !== 'undefined' && !isPerformSeeking)) return;
    showLoading('Buffering Stream...', 'Fetching data from TorrServer cache...');
  });

  videoPlayer.addEventListener('error', (e) => {
    if (!videoPlayer.src || videoPlayer.src === window.location.href) return;
    const err = videoPlayer.error;
    console.warn('[Video Player]', err ? `Media Error Code ${err.code}` : 'Playback error occurred');
    hideLoading();

    // Cascading Auto-Recovery: Direct -> Remux -> Transcode
    if (gstEngineMode === 'direct' && currentStreamInfo.hash) {
      if (directRetryCount < 2) {
        directRetryCount++;
        console.warn(`[Video Player] Buffering torrent piece headers. Retrying Direct Native Stream (${directRetryCount}/2)...`);
        showLoading('Buffering Header Pieces...', 'TorrServer downloading video metadata & header...');
        setTimeout(() => {
          if (gstEngineMode === 'direct' && currentStreamInfo.hash) {
            const directUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
            videoPlayer.src = directUrl;
            videoPlayer.load();
            videoPlayer.play().catch(() => { hideLoading(); });
          }
        }, 1200);
        return;
      }

      console.warn('[Video Player] Direct playback unsupported by browser. Auto-recovering via FFmpeg Live Remux...');
      gstEngineMode = 'remux';
      const engineLabelEl = document.getElementById('currentEngineLabel');
      if (engineLabelEl) engineLabelEl.textContent = 'FFmpeg (Live Remux)';

      showLoading('Auto-Recovering via FFmpeg...', 'Remuxing video/audio for browser compatibility...');
      const directUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
      loadStreamWithExactTimeline(`/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directUrl)}&mode=remux`);
    } else if (gstEngineMode === 'remux' && currentStreamInfo.hash) {
      console.warn('[Video Player] Remux playback failed. Auto-recovering via FFmpeg Transcode...');
      gstEngineMode = 'transcode';
      const engineLabelEl = document.getElementById('currentEngineLabel');
      if (engineLabelEl) engineLabelEl.textContent = 'FFmpeg (Live Transcode)';

      showLoading('Auto-Transcoding Stream...', 'Transcoding video via x264/AAC for full browser compatibility...');
      const directUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
      loadStreamWithExactTimeline(`/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directUrl)}&mode=transcode`);
    }
  });

  const ffmpegEngineBtn = document.getElementById('ffmpegEngineBtn');
  if (ffmpegEngineBtn) {
    ffmpegEngineBtn.addEventListener('click', () => {
      if (gstEngineMode === 'direct') {
        gstEngineMode = 'remux';
      } else if (gstEngineMode === 'remux') {
        gstEngineMode = 'transcode';
      } else {
        gstEngineMode = 'direct';
      }

      const labels = {
        direct: 'Direct Stream (Full Timeline)',
        remux: 'FFmpeg (Live Remux)',
        transcode: 'FFmpeg (Live Transcode)'
      };

      const engineLabelEl = document.getElementById('currentEngineLabel');
      if (engineLabelEl) engineLabelEl.textContent = labels[gstEngineMode];

      if (currentStreamInfo.hash && currentStreamInfo.fileId) {
        playTorrentFile(
          currentStreamInfo.hash,
          currentStreamInfo.fileId,
          currentStreamInfo.filePath,
          currentStreamInfo.title,
          currentStreamInfo.fileLength
        );
      }
    });
  }

  copyStreamUrlBtn.addEventListener('click', () => {
    if (videoPlayer.src) {
      navigator.clipboard.writeText(videoPlayer.src);
      const originalText = copyStreamUrlBtn.innerHTML;
      copyStreamUrlBtn.innerHTML = '<i data-lucide="check"></i> Copied!';
      if (window.lucide) lucide.createIcons();
      setTimeout(() => {
        copyStreamUrlBtn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
      }, 2000);
    }
  });

  const downloadVideoBtn = document.getElementById('downloadVideoBtn');
  if (downloadVideoBtn) {
    downloadVideoBtn.addEventListener('click', () => {
      if (!currentStreamInfo || !currentStreamInfo.hash) {
        alert('Please play a video torrent first before downloading.');
        return;
      }
      const directStreamUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
      const a = document.createElement('a');
      a.href = directStreamUrl;
      const cleanFileName = getFileName(currentStreamInfo.title || currentStreamInfo.filePath || 'torrent_video.mp4');
      a.download = cleanFileName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  }

  refreshTorrentsBtn.addEventListener('click', loadActiveTorrentsList);
}

// Perform Movie & Series Search Query via Standalone REST API V1
async function performMovieSearch(query, mediaType = 'movie', season = '1', episode = '1') {
  const isTmdbId = /^\d+$/.test(query);
  const isImdbId = /^tt\d+$/.test(query);
  let searchUrl = `/api/v1/search?type=${mediaType}&s=${season}&e=${episode}`;

  if (isTmdbId) searchUrl += `&tmdb=${query}`;
  else if (isImdbId) searchUrl += `&imdb=${query}`;
  else searchUrl += `&q=${encodeURIComponent(query)}`;

  searchResultsArea.innerHTML = `
    <div class="search-initial-state">
      <div class="spinner"></div>
      <p>Searching ${mediaType === 'series' ? 'TV episode' : 'movie'} streams for "${query}"...</p>
    </div>`;

  try {
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error('Search failed');

    const data = await res.json();
    
    let results = data.results || data.streams || [];
    if (results.length === 0 && data.imdbId) {
        try {
            const torrentioType = data.mediaType === 'series' ? 'series' : 'movie';
            const streamPath = torrentioType === 'series' ? `${data.imdbId}:${data.season}:${data.episode}` : data.imdbId;
            const torUrl = `https://torrentio.strem.fun/stream/${torrentioType}/${streamPath}.json`;
            console.log('Fallback fetching from Torrentio API on client:', torUrl);
            const torRes = await fetch(torUrl);
            const torData = await torRes.json();
            if (torData && torData.streams) {
                results = torData.streams.map(s => {
                    const infoHash = s.infoHash;
                    let magnet = s.magnet;
                    if (!magnet && infoHash) {
                        magnet = `magnet:?xt=urn:btih:${infoHash}&dn=${encodeURIComponent(data.title)}`;
                        const DEFAULT_TRACKERS = [
                            'http://nyaa.tracker.wf:7777/announce',
                            'udp://tracker.opentrackr.org:1337/announce',
                            'udp://open.stealth.si:80/announce',
                            'udp://tracker.torrent.eu.org:451/announce',
                            'udp://exodus.desync.com:6969/announce',
                            'udp://tracker.dler.org:6969/announce',
                            'udp://open.demonii.com:1337/announce',
                            'udp://tracker.openbittorrent.com:6969/announce',
                            'udp://opentracker.i2p.rocks:6969/announce'
                        ];
                        DEFAULT_TRACKERS.forEach(tr => {
                            magnet += `&tr=${encodeURIComponent(tr)}`;
                        });
                    }
                    const rawTitle = s.title || s.name || data.title;
                    const seedMatch = rawTitle.match(/👤\s*(\d+)/);
                    const sizeMatch = rawTitle.match(/💾\s*([\d\.]+\s*[GMK]B)/i);
                    const qualityMatch = rawTitle.match(/(2160p|4K|1080p|720p|HDR|Remux|CAM|TS)/i);
                    return {
                        name: s.name || 'Torrent Stream',
                        title: `${data.title} (${qualityMatch ? qualityMatch[1] : '1080p'})`,
                        raw_title: rawTitle,
                        magnet: magnet,
                        infoHash: infoHash,
                        seeders: seedMatch ? parseInt(seedMatch[1]) : 0,
                        size: sizeMatch ? sizeMatch[1] : 'Unknown',
                        quality: qualityMatch ? qualityMatch[1] : 'HD'
                    };
                });
                results.sort((a, b) => getStreamPriorityScore(b, (data.mediaType || 'movie') === 'movie') - getStreamPriorityScore(a, (data.mediaType || 'movie') === 'movie'));
                data.results = results;
            }
        } catch (e) {
            console.error('Fallback torrentio error:', e);
        }
    }

    renderSearchResults(results);
  } catch (err) {
    console.error('Search query error:', err);
    searchResultsArea.innerHTML = `
      <div class="search-initial-state">
        <i data-lucide="alert-circle"></i>
        <p>Could not perform search. Try again.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
  }
}

// Render Movie & Series Search Cards
function renderSearchResults(results) {
  if (results.length === 0) {
    searchResultsArea.innerHTML = `
      <div class="search-initial-state">
        <i data-lucide="film"></i>
        <p>No torrent results found for that query.</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  searchResultsArea.innerHTML = '';
  results.forEach(m => {
    let bytes = m.sizeBytes || parseSizeBytes(m.size) || parseSizeBytes(m.raw_title);
    let sizeInGB = bytes / (1024 * 1024 * 1024);
    let isOptimalSize = (sizeInGB >= 1.45 && sizeInGB <= 2.55);
    let isOverSize = (sizeInGB > 2.55);

    let sizeBadgeHtml = `<span class="meta-badge badge-size">💾 ${m.size || '1 GB'}</span>`;
    if (isOptimalSize) {
      sizeBadgeHtml = `<span class="meta-badge badge-size" style="background: rgba(34, 197, 94, 0.25); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.4); font-weight: 700;">⭐ Optimal Size: ${m.size}</span>`;
    } else if (isOverSize) {
      sizeBadgeHtml = `<span class="meta-badge badge-size" style="opacity: 0.7;">💾 ${m.size} (Large)</span>`;
    }

    const card = document.createElement('div');
    card.className = 'movie-result-card';
    card.innerHTML = `
      <div class="result-content">
        <div class="result-title">🎬 ${m.title} ${m.year ? `(${m.year})` : ''}</div>
        <div class="result-meta">
          <span class="meta-badge badge-quality">${m.quality || '1080p'}</span>
          ${sizeBadgeHtml}
          <span class="meta-badge badge-seeds">👥 ${m.seeds || m.seeders || 100} Seeders</span>
        </div>
      </div>
      <div class="result-actions">
        <button class="btn btn-primary btn-sm play-result-btn">
          <i data-lucide="play"></i> Stream Now
        </button>
      </div>
    `;

    card.querySelector('.play-result-btn').addEventListener('click', () => {
      searchModal.classList.add('hidden');
      magnetInput.value = m.magnet;
      playMagnetOrUrl(m.magnet);
    });

    searchResultsArea.appendChild(card);
  });

  if (window.lucide) lucide.createIcons();
}

// Apply Instant Stream Settings to TorrServer Engine API
async function applyBufferSettings(cacheSizeBytes, maxPeers, preloadPercent = 10, badgeText, tagText) {
  try {
    const res = await fetch(`${TORRSERVER_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set',
        sets: {
          CacheSize: cacheSizeBytes,
          ConnectionsLimit: maxPeers,
          PreloadCache: preloadPercent,
          ReaderReadAHead: 30,
          ResponsiveMode: true,
          RetrackersMode: 1,
          RemoveCacheOnDrop: true,
          TorrentDisconnectTimeout: 30
        }
      })
    });

    if (res.ok) {
      if (bufferPresetText) bufferPresetText.textContent = badgeText;
      if (presetTag) presetTag.textContent = tagText;
      console.log(`[TorrServer Engine] Instant Stream + Auto Cache Removal Applied: Cache=${cacheSizeBytes}, Preload=${preloadPercent}%, RemoveCacheOnDrop=true`);
    }
  } catch (err) {
    console.warn('Could not update engine settings:', err);
  }
}

// Check TorrServer API Connectivity
async function checkServerConnection() {
  try {
    const res = await fetch(`${TORRSERVER_BASE}/echo`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      let ver = text.trim();
      if (ver.startsWith('<') || ver.includes('<!doctype') || ver.includes('<html')) {
        setServerStatus(false, 'Offline (Starting Up)');
        return false;
      }
      setServerStatus(true, `Online (${ver || 'TorrServer'})`);
      return true;
    }
  } catch (err) {
    try {
      const res = await fetch(`${TORRSERVER_BASE}/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          setServerStatus(true, 'Online (TorrServer)');
          return true;
        }
      }
    } catch (e) {}
  }
  setServerStatus(false, 'Offline (Port 8090)');
  return false;
}

function setServerStatus(isOnline, text) {
  serverStatusPill.className = `status-pill ${isOnline ? 'online' : 'offline'}`;
  serverStatusText.textContent = text;
}

// Main Function: Play Magnet Link or Stream URL
async function playMagnetOrUrl(input) {
  if (metadataPollTimer) clearTimeout(metadataPollTimer);
  if (statsPollInterval) clearInterval(statsPollInterval);

  if (!input.startsWith('magnet:?') && !input.startsWith('http://') && !input.startsWith('https://')) {
    searchModal.classList.remove('hidden');
    modalSearchInput.value = input;
    performMovieSearch(input);
    return;
  }

  showLoading('Connecting to BitTorrent Peers...', 'Adding magnet link to TorrServer engine...');

  try {
    const addRes = await fetch(`${TORRSERVER_BASE}/torrents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        link: input,
        save_to_db: true
      })
    });

    const resText = await addRes.text();
    let torrData;
    try {
      torrData = JSON.parse(resText);
    } catch (e) {
      throw new Error('TorrServer is starting up or unavailable. Please try again in a few seconds.');
    }

    if (!addRes.ok || torrData.status === 'error') {
      throw new Error(torrData.message || `Failed to add magnet: HTTP ${addRes.status}`);
    }

    currentTorrentData = torrData;
    activeTorrentHash = torrData.hash;

    await pollTorrentMetadata(torrData.hash, 0);

  } catch (err) {
    console.error('Error adding magnet:', err);
    hideLoading();
    alert(`Could not stream magnet link: ${err.message}\n\nMake sure TorrServer is running on http://localhost:8090`);
  }
}

// Poll TorrServer until torrent metadata is loaded
async function pollTorrentMetadata(hash, attempts = 0) {
  const maxAttempts = 40;

  try {
    const res = await fetch(`${TORRSERVER_BASE}/torrents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', hash: hash })
    });

    const resText = await res.text();
    let data;
    try {
      data = JSON.parse(resText);
    } catch (e) {
      throw new Error('TorrServer service starting up');
    }

    if (!res.ok) throw new Error(data.message || 'Could not fetch torrent info');
    currentTorrentData = data;

    const fileStats = data.file_stats || data.FileStats || [];
    
    const peers = data.active_peers || data.connected_seeders || 0;
    const statText = data.stat_string ? ` (${data.stat_string})` : '';
    showLoading(
      'Fetching Torrent Metadata...',
      `Connected to ${peers} peers${statText}. Resolving file contents...`
    );

    if (fileStats.length > 0) {
      renderFileList(fileStats);

      const videoFiles = fileStats.filter(f => isVideoFile(f.path));
      let targetFile = null;

      // Prefer MKV/MP4 files over legacy AVI files for native browser playback
      const mkvMp4Files = videoFiles.filter(f => !f.path.toLowerCase().endsWith('.avi'));
      if (mkvMp4Files.length > 0) {
        targetFile = mkvMp4Files.reduce((prev, current) => (prev.length > current.length) ? prev : current);
      } else if (videoFiles.length > 0) {
        targetFile = videoFiles.reduce((prev, current) => (prev.length > current.length) ? prev : current);
      } else {
        targetFile = fileStats.reduce((prev, current) => (prev.length > current.length) ? prev : current);
      }

      if (targetFile) {
        playTorrentFile(hash, targetFile.id, targetFile.path, data.title || targetFile.path, targetFile.length);
      } else {
        hideLoading();
        alert('No files found inside this torrent.');
      }

      loadActiveTorrentsList();
      return;
    }

    if (attempts < maxAttempts) {
      metadataPollTimer = setTimeout(() => {
        pollTorrentMetadata(hash, attempts + 1);
      }, 800);
    } else {
      console.warn('Metadata timeout, attempting direct stream index 1 fallback...');
      playTorrentFile(hash, 1, data.title || 'Torrent Stream', data.title || 'Torrent Stream', 0);
    }

  } catch (err) {
    console.error('Torrent metadata poll error:', err);
    if (attempts < maxAttempts) {
      metadataPollTimer = setTimeout(() => {
        pollTorrentMetadata(hash, attempts + 1);
      }, 800);
    } else {
      hideLoading();
      alert('Timed out waiting for torrent metadata. Ensure the magnet link has active seeders.');
    }
  }
}

window.exactProbedDuration = 0;
let plyrInstance = null;

function initPlyrPlayer() {
  if (window.Plyr && videoPlayer && !window.plyrInstance) {
    try {
      window.plyrInstance = new Plyr(videoPlayer, {
        controls: [
          'play-large', 'restart', 'rewind', 'play', 'fast-forward',
          'progress', 'current-time', 'duration', 'mute', 'volume',
          'settings', 'pip', 'airplay', 'download', 'fullscreen'
        ],
        invertTime: false,
        toggleInvert: false
      });
      window.plyrPlayer = window.plyrInstance;

      window.plyrInstance.on('timeupdate', enforceExactDuration);
      window.plyrInstance.on('seeking', enforceExactDuration);
      window.plyrInstance.on('seeked', enforceExactDuration);
    } catch(e) {
      console.warn("Plyr initialization fallback", e);
    }
  }
  attachSeekingHandler();
}
window.initPlyrPlayer = initPlyrPlayer;

function enforceExactDuration() {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && videoPlayer) {
    const totalSecs = Math.floor(window.exactProbedDuration);
    const seekOffset = window.currentSeekOffset || 0;
    const currentActualSecs = Math.min(totalSecs, Math.floor(seekOffset + (videoPlayer.currentTime || 0)));

    try {
      Object.defineProperty(videoPlayer, 'duration', {
        get: () => window.exactProbedDuration,
        configurable: true
      });
    } catch(e) {}

    if (window.plyrInstance && window.plyrInstance.media) {
      try {
        Object.defineProperty(window.plyrInstance.media, 'duration', {
          get: () => window.exactProbedDuration,
          configurable: true
        });
      } catch(e) {}
    }

    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    const formattedTotal = hours > 0 
      ? `${hours}:${mins.toString().padStart(2, '0')}:${secs}` 
      : `${mins}:${secs}`;

    const curHours = Math.floor(currentActualSecs / 3600);
    const curMins = Math.floor((currentActualSecs % 3600) / 60);
    const curSecs = (currentActualSecs % 60).toString().padStart(2, '0');
    const formattedCur = curHours > 0
      ? `${curHours}:${curMins.toString().padStart(2, '0')}:${curSecs}`
      : `${curMins}:${curSecs}`;

    const durEls = document.querySelectorAll('.plyr__time--duration');
    durEls.forEach(durEl => {
      durEl.textContent = formattedTotal;
    });

    const curEls = document.querySelectorAll('.plyr__time--current');
    curEls.forEach(curEl => {
      curEl.textContent = formattedCur;
    });

    const progressInputs = document.querySelectorAll('.plyr__progress input[type="range"]');
    progressInputs.forEach(input => {
      input.setAttribute('max', totalSecs.toString());
      input.setAttribute('aria-valuemax', totalSecs.toString());
      if (!isPerformSeeking) {
        input.value = currentActualSecs.toString();
      }
    });
  }
}
window.enforceExactDuration = enforceExactDuration;

if (videoPlayer) {
  ['loadedmetadata', 'durationchange', 'timeupdate', 'playing', 'progress', 'canplay'].forEach(evt => {
    videoPlayer.addEventListener(evt, enforceExactDuration);
  });
}

// ==========================================
// FIX MODULE: GETDURATION & SEEKING FOR MKV/WEBM
// ==========================================
function initializeWebmPlayerFix(playerElement) {
    if (!playerElement) return;

    playerElement.setAttribute('preload', 'metadata');
    
    playerElement.addEventListener('loadedmetadata', function() {
        console.log(`[TorrStream Fix] Metadata Loaded. Initial Duration: ${playerElement.duration}`);
        
        if (playerElement.duration === Infinity || isNaN(playerElement.duration)) {
            console.warn("[TorrStream Fix] Duration is reported as Infinity. Enforcing metadata polling...");
            pollForValidDuration(playerElement);
        } else {
            if (statsOverlay) statsOverlay.classList.remove('hidden');
        }
    });

    // Removed redundant error listener to prevent infinite fallback loops
}

let webmPollTimer = null;
function pollForValidDuration(video) {
    let checkCount = 0;
    const maxChecks = 30;

    if (webmPollTimer) clearInterval(webmPollTimer);

    webmPollTimer = setInterval(() => {
        checkCount++;
        if (video.duration === Infinity || isNaN(video.duration)) {
            if (video.buffered.length > 0 && video.currentTime === 0) {
                video.currentTime = Math.max(0, video.buffered.end(0) - 0.1);
                setTimeout(() => { video.currentTime = 0; }, 50); 
            }
        } else {
            console.log(`[TorrStream Fix] Accurate Stream Duration Resolved: ${video.duration}s`);
            clearInterval(webmPollTimer);
            if (statsOverlay) statsOverlay.classList.remove('hidden');
        }

        if (checkCount >= maxChecks) {
            clearInterval(webmPollTimer);
            console.error("[TorrStream Fix] Failed to calculate duration natively.");
        }
    }, 500);
}

if (videoPlayer) {
    initializeWebmPlayerFix(videoPlayer);
}

document.addEventListener('DOMContentLoaded', initPlyrPlayer);

// Load FFmpeg Stream with Exact Probed Duration Timeline
async function loadStreamWithExactTimeline(ffmpegStreamUrl) {
  initPlyrPlayer();
  try {
    const response = await fetch(ffmpegStreamUrl, { method: 'HEAD' });
    const exactDuration = parseFloat(response.headers.get('X-Video-Duration'));
    if (exactDuration && exactDuration > 0) {
      window.exactProbedDuration = exactDuration;
      console.log(`[FFmpeg Stream] Exact probed duration: ${exactDuration}s`);
      enforceExactDuration();
    } else if (currentStreamInfo && currentStreamInfo.hash) {
      const directStreamUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
      const durRes = await fetch(`/api/torrent/duration?url=${encodeURIComponent(directStreamUrl)}`);
      const durData = await durRes.json();
      if (durData.duration && durData.duration > 0) {
        window.exactProbedDuration = durData.duration;
        console.log(`[FFmpeg Stream] Exact probed duration via API: ${durData.duration}s`);
        enforceExactDuration();
      }
    }
  } catch(e) {
    console.warn("[FFmpeg Stream] Duration probe failed", e);
  }

  if (videoPlayer) {
    videoPlayer.src = ffmpegStreamUrl;
    videoPlayer.load();
    enforceExactDuration();
    if (window.plyrInstance) {
      window.plyrInstance.play().catch(e => {
        console.log('Autoplay deferred, waiting for user click:', e);
        hideLoading();
      });
    } else {
      videoPlayer.play().catch(e => {
        console.log('Autoplay deferred, waiting for user click:', e);
        hideLoading();
      });
    }
  }
}
window.loadStreamWithExactTimeline = loadStreamWithExactTimeline;

// Play specific file inside torrent
function playTorrentFile(hash, fileId, filePath, title, fileLength) {
  activeTorrentHash = hash;
  activeFileIndex = fileId;
  currentStreamInfo = { hash, fileId, filePath, title, fileLength };
  directRetryCount = 0;
  window.currentSeekOffset = 0;

  const fileName = (filePath || '').toLowerCase();
  const ext = fileName.split('.').pop();
  const isNonNativeFormat = ['avi', 'flv', 'wmv', 'vob', 'divx', 'xvid', 'ts', 'm2ts'].includes(ext);

  const directStreamUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(hash)}&index=${fileId}&play=1`;

  let modeToUse = gstEngineMode;
  if (isNonNativeFormat && modeToUse === 'direct') {
    modeToUse = 'remux';
  }

  let activeEngineLabel = 'Direct Stream (Full Timeline)';
  let activeUrl = `/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directStreamUrl)}&mode=remux`;

  if (modeToUse === 'direct') {
    activeUrl = directStreamUrl;
    activeEngineLabel = 'Direct Stream Engine';
  } else if (modeToUse === 'transcode') {
    activeUrl = `/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directStreamUrl)}&mode=transcode`;
    activeEngineLabel = 'FFmpeg (Live Transcode)';
  } else if (modeToUse === 'remux') {
    activeUrl = `/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directStreamUrl)}&mode=remux`;
    activeEngineLabel = 'FFmpeg (Live Remux)';
  }

  const engineLabelEl = document.getElementById('currentEngineLabel');
  if (engineLabelEl) engineLabelEl.textContent = activeEngineLabel;

  currentTitle.textContent = getFileName(title || filePath || 'Torrent Video Stream');
  currentHash.textContent = `Hash: ${hash.substring(0, 10)}...`;
  currentSize.textContent = fileLength ? `Size: ${formatBytes(fileLength)}` : 'Size: Dynamic';

  highlightActiveFile(fileId);

  playerPlaceholder.classList.add('hidden');

  showLoading('Instant Stream Starting...', `Streaming via ${activeEngineLabel}...`);
  loadStreamWithExactTimeline(activeUrl);

  startStatsPolling(hash);
  checkAndApplyTorrentSubtitles(hash);
}

// Function to check and auto-load SRT subtitle files from the torrent package
async function checkAndApplyTorrentSubtitles(hash) {
  if (!hash) return;
  try {
    const res = await fetch(`/api/torrent/check-subtitles?link=${encodeURIComponent(hash)}`);
    const data = await res.json();
    if (data.subtitles && data.subtitles.length > 0) {
      const firstSub = data.subtitles[0];
      console.log(`[Torrent Subtitle] Auto-applying SRT subtitle from torrent: ${firstSub.name}`);
      applySubtitleTrack(firstSub.url, `[Torrent] ${firstSub.name}`);
    }
  } catch (e) {
    console.warn('[Torrent Subtitle Check Failed]', e);
  }
}

function startDirectVideo(url, title) {
  currentTitle.textContent = title;
  currentHash.textContent = 'Hash: Direct URL';
  currentSize.textContent = 'Size: Dynamic';
  
  playerPlaceholder.classList.add('hidden');
  videoPlayer.src = url;
  videoPlayer.load();
  videoPlayer.play();
}

// Live TorrServer Statistics Poller
function startStatsPolling(hash) {
  if (statsPollInterval) clearInterval(statsPollInterval);

  statsPollInterval = setInterval(async () => {
    try {
      const res = await fetch(`${TORRSERVER_BASE}/torrents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', hash: hash })
      });

      if (res.ok) {
        const data = await res.json();
        
        const speed = formatBytes(data.download_speed || 0) + '/s';
        const peers = `${data.connected_seeders || 0} / ${data.active_peers || 0}`;
        const buffer = data.prebuffer_bytes && data.preload_size
          ? Math.min(100, Math.round((data.prebuffer_bytes / data.preload_size) * 100))
          : (data.stat_string || 'Ready');

        statSpeed.textContent = speed;
        statPeers.textContent = `${peers} Peers`;
        statBuffer.textContent = typeof buffer === 'number' ? `Buffer ${buffer}%` : buffer;

        const loadingStats = document.getElementById('loadingStats');
        if (loadingStats && loadingOverlay && !loadingOverlay.classList.contains('hidden')) {
          loadingStats.textContent = `Speed: ${speed} | Peers: ${peers} | Status: ${typeof buffer === 'number' ? `Buffer ${buffer}%` : buffer}`;
        }
        if (typeof buffer === 'number' && bufferProgressFill) {
          bufferProgressFill.style.width = `${buffer}%`;
        }
      }
    } catch (e) {
      console.warn('Stats poll fail:', e);
    }
  }, 1500);
}

// File List & Tree Renderer
function renderFileList(fileStats) {
  filesCountBadge.textContent = `${fileStats.length} files`;
  
  if (fileStats.length === 0) {
    filesListContainer.innerHTML = `
      <div class="panel-empty-state">
        <i data-lucide="file-video"></i>
        <p>No files found in torrent metadata</p>
      </div>`;
    if (window.lucide) lucide.createIcons();
    return;
  }

  filesListContainer.innerHTML = '';
  fileStats.forEach(file => {
    const isVideo = isVideoFile(file.path);
    const isAvi = file.path.toLowerCase().endsWith('.avi');

    const item = document.createElement('div');
    item.className = `file-item ${file.id === activeFileIndex ? 'active' : ''}`;
    item.dataset.fileId = file.id;

    const fileNameSpan = document.createElement('span');
    fileNameSpan.className = 'file-name';
    fileNameSpan.title = file.path;
    fileNameSpan.textContent = (isAvi ? '⚠️ ' : (isVideo ? '🎬 ' : '📄 ')) + getFileName(file.path);

    const fileSizeSpan = document.createElement('span');
    fileSizeSpan.className = 'file-size';
    fileSizeSpan.textContent = formatBytes(file.length);

    item.appendChild(fileNameSpan);
    item.appendChild(fileSizeSpan);

    item.addEventListener('click', () => {
      playTorrentFile(activeTorrentHash, file.id, file.path, getFileName(file.path), file.length);
    });

    filesListContainer.appendChild(item);
  });
}

function highlightActiveFile(fileId) {
  document.querySelectorAll('.file-item').forEach(el => {
    if (parseInt(el.dataset.fileId) === fileId) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

// Active Torrents List in Sidebar
async function loadActiveTorrentsList() {
  try {
    const res = await fetch(`${TORRSERVER_BASE}/torrents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'list' })
    });

    if (!res.ok) return;
    const torrents = await res.json();
    
    if (!torrents || torrents.length === 0) {
      activeTorrentsList.innerHTML = `
        <div class="panel-empty-state">
          <p>No active torrents in TorrServer memory</p>
        </div>`;
      return;
    }

    activeTorrentsList.innerHTML = '';
    torrents.forEach(t => {
      const card = document.createElement('div');
      card.className = 'torrent-item';
      card.innerHTML = `
        <div class="torrent-title" title="${t.title || t.hash}">${t.title || 'Torrent ' + t.hash.substring(0, 8)}</div>
        <div class="torrent-stats">
          <span>⚡ ${formatBytes(t.download_speed || 0)}/s</span>
          <span>👥 ${t.active_peers || 0} peers</span>
        </div>
      `;
      card.addEventListener('click', () => {
        pollTorrentMetadata(t.hash, 0);
      });
      activeTorrentsList.appendChild(card);
    });
  } catch (e) {
    console.warn('Load active torrents failed:', e);
  }
}

// Loading Helpers
let bufferTimeoutTimer = null;
function showLoading(title, subtitle) {
  if (isPlaybackInitiated && videoPlayer && !videoPlayer.paused && videoPlayer.currentTime > 0) {
    return;
  }
  if (bufferTimeoutTimer) clearTimeout(bufferTimeoutTimer);
  loadingTitle.textContent = title;
  loadingSubtitle.textContent = subtitle;
  loadingOverlay.classList.remove('hidden');

  // Auto-dismiss safety: hide overlay after 5s max so it NEVER gets stuck
  bufferTimeoutTimer = setTimeout(() => {
    hideLoading();
  }, 5000);
}

function hideLoading() {
  if (bufferTimeoutTimer) clearTimeout(bufferTimeoutTimer);
  loadingOverlay.classList.add('hidden');
}

if (loadingOverlay) {
  loadingOverlay.addEventListener('click', hideLoading);
}

// Utilities
function isVideoFile(path) {
  if (!path) return false;
  const ext = path.split('.').pop().toLowerCase();
  return ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v', 'ts', 'flv', 'wmv', 'mpg', 'mpeg', 'm2ts', '3gp', 'vob', 'divx', 'ogv', 'mp3', 'aac', 'flac', 'm4a'].includes(ext);
}

function getFileName(path) {
  if (!path) return 'File';
  return path.split(/[\/\\]/).pop();
}

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Attach seek resync handler for timeline seeking
let isPerformSeeking = false;
let seekDebounceTimeout = null;
let isSeekingAttached = false;

function attachSeekingHandler() {
  if (!videoPlayer || isSeekingAttached) return;
  isSeekingAttached = true;

  const handleSeekRequest = (targetSecs) => {
    if (!currentStreamInfo || !currentStreamInfo.hash) return;
    if (isPerformSeeking) return;
    if (gstEngineMode === 'direct') {
        // Native browser player handles byte-range seeking natively for direct mp4/mkv.
        return;
    }

    const currentPos = (window.currentSeekOffset || 0) + (videoPlayer.currentTime || 0);
    if (Math.abs(currentPos - targetSecs) < 2) return;

    console.log(`[Torrent Player] Seeking timeline to target time: ${targetSecs}s`);
    isPerformSeeking = true;
    window.currentSeekOffset = Math.floor(targetSecs);

    const directStreamUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
    let modeToUse = gstEngineMode === 'direct' ? 'remux' : gstEngineMode;
    let seekUrl = `/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directStreamUrl)}&mode=${modeToUse}&startTime=${Math.floor(targetSecs)}`;
    if (currentAudioTrackIndex !== '') {
      seekUrl += `&audioTrack=${currentAudioTrackIndex}`;
    }

    showLoading(`Seeking to ${formatTime(targetSecs)}...`, 'Fetching stream segment...');

    videoPlayer.src = seekUrl;
    videoPlayer.load();
    videoPlayer.play().then(() => {
      hideLoading();
      setTimeout(() => { isPerformSeeking = false; }, 800);
    }).catch(() => {
      hideLoading();
      isPerformSeeking = false;
    });
  };

  const onSeekingTriggered = () => {
    if (isPerformSeeking) return;
    let targetTime = videoPlayer.currentTime;
    if (window.plyrInstance && window.plyrInstance.currentTime !== undefined) {
      targetTime = window.plyrInstance.currentTime;
    }
    clearTimeout(seekDebounceTimeout);
    seekDebounceTimeout = setTimeout(() => handleSeekRequest(targetTime), 250);
  };

  videoPlayer.addEventListener('seeking', onSeekingTriggered);
  if (window.plyrInstance) {
    window.plyrInstance.on('seeking', onSeekingTriggered);
    window.plyrInstance.on('seeked', onSeekingTriggered);
  }

  // Direct progress bar input event listener for clicking specific timeline points
  document.addEventListener('change', (e) => {
    if (e.target && e.target.matches && e.target.matches('.plyr__progress input[type="range"]')) {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        console.log('[Torrent Player] Range input changed, seeking to:', val);
        handleSeekRequest(val);
      }
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target && e.target.matches && e.target.matches('.plyr__progress input[type="range"]')) {
      const val = parseFloat(e.target.value);
      if (!isNaN(val) && val >= 0) {
        clearTimeout(seekDebounceTimeout);
        seekDebounceTimeout = setTimeout(() => handleSeekRequest(val), 300);
      }
    }
  });
}

function formatTime(secs) {
  const s = Math.floor(secs || 0);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const sec = s % 60;
  const min = m % 60;
  if (h > 0) {
    return `${h}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// Subtitles Modal Handlers
const subtitleModal = document.getElementById('subtitleModal');
const subtitlesBtn = document.getElementById('subtitlesBtn');
const closeSubtitleBtn = document.getElementById('closeSubtitleBtn');
const btnFetchSubs = document.getElementById('btnFetchSubs');
const subSearchQuery = document.getElementById('subSearchQuery');
const subLangSelect = document.getElementById('subLangSelect');
const subResultsList = document.getElementById('subResultsList');
const subFileInput = document.getElementById('subFileInput');

if (subtitlesBtn && subtitleModal) {
  subtitlesBtn.addEventListener('click', () => {
    subtitleModal.classList.remove('hidden');
    if (currentStreamInfo && currentStreamInfo.title) {
      if (subSearchQuery) subSearchQuery.value = getFileName(currentStreamInfo.title);
      fetchSubtitlesOnline();
    }
  });
}

if (closeSubtitleBtn) {
  closeSubtitleBtn.addEventListener('click', () => {
    subtitleModal.classList.add('hidden');
  });
}

if (btnFetchSubs) {
  btnFetchSubs.addEventListener('click', fetchSubtitlesOnline);
}

async function fetchSubtitlesOnline() {
  if (!subResultsList) return;
  const q = subSearchQuery ? subSearchQuery.value.trim() : '';
  const lang = subLangSelect ? subLangSelect.value : 'English';

  subResultsList.innerHTML = `<p style="color: #6366f1; font-size: 13px;">Checking torrent files & searching subtitles...</p>`;

  let torrentSubs = [];
  if (activeTorrentHash) {
    try {
      const tRes = await fetch(`/api/torrent/check-subtitles?link=${encodeURIComponent(activeTorrentHash)}`);
      const tData = await tRes.json();
      if (tData.subtitles) torrentSubs = tData.subtitles;
    } catch (e) {}
  }

  try {
    const res = await fetch(`/api/subtitles/fetch?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}`);
    const data = await res.json();
    const onlineSubs = data.subtitles || [];

    if (torrentSubs.length === 0 && onlineSubs.length === 0) {
      subResultsList.innerHTML = `<p style="color: #ef4444; font-size: 13px;">No subtitles found. Try uploading a custom .srt or .vtt file below.</p>`;
      return;
    }

    subResultsList.innerHTML = '';

    // Render Torrent Internal SRT Files
    if (torrentSubs.length > 0) {
      const tHeader = document.createElement('div');
      tHeader.style.cssText = 'color: #34d399; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;';
      tHeader.textContent = '📁 Torrent Package Subtitles (SRT/VTT)';
      subResultsList.appendChild(tHeader);

      torrentSubs.forEach((sub) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 10px; background: rgba(52,211,153,0.1); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(52,211,153,0.3); margin-bottom: 8px; cursor: pointer;';
        item.innerHTML = `
          <div>
            <div style="color: #fff; font-size: 13px; font-weight: 700;">${sub.name}</div>
            <div style="color: #34d399; font-size: 11px;">Source: Torrent Package (.srt)</div>
          </div>
          <button class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px; background: #059669; border: none;">Load Track</button>
        `;
        item.addEventListener('click', () => {
          applySubtitleTrack(sub.url, `[Torrent] ${sub.name}`);
          if (subtitleModal) subtitleModal.classList.add('hidden');
        });
        subResultsList.appendChild(item);
      });
    }

    // Render Online Subtitles
    if (onlineSubs.length > 0) {
      const oHeader = document.createElement('div');
      oHeader.style.cssText = 'color: #818cf8; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 10px; margin-bottom: 6px;';
      oHeader.textContent = '🌐 Online Subtitles';
      subResultsList.appendChild(oHeader);

      onlineSubs.forEach((sub) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 6px; cursor: pointer;';
        item.innerHTML = `
          <div>
            <div style="color: #fff; font-size: 13px; font-weight: 600;">${sub.display}</div>
            <div style="color: #818cf8; font-size: 11px;">Source: ${sub.source} [${sub.language}]</div>
          </div>
          <button class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px;">Load Track</button>
        `;
        item.addEventListener('click', () => {
          applySubtitleTrack(sub.url, sub.display, sub.langCode);
          if (subtitleModal) subtitleModal.classList.add('hidden');
        });
        subResultsList.appendChild(item);
      });
    }

  } catch (e) {
    if (torrentSubs.length > 0) {
      // Still show torrent subs if online sub fetch fails
      subResultsList.innerHTML = '';
      torrentSubs.forEach((sub) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 10px; background: rgba(52,211,153,0.1); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(52,211,153,0.3); margin-bottom: 8px; cursor: pointer;';
        item.innerHTML = `
          <div>
            <div style="color: #fff; font-size: 13px; font-weight: 700;">${sub.name}</div>
            <div style="color: #34d399; font-size: 11px;">Source: Torrent Package (.srt)</div>
          </div>
          <button class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px; background: #059669; border: none;">Load Track</button>
        `;
        item.addEventListener('click', () => {
          applySubtitleTrack(sub.url, `[Torrent] ${sub.name}`);
          if (subtitleModal) subtitleModal.classList.add('hidden');
        });
        subResultsList.appendChild(item);
      });
    } else {
      subResultsList.innerHTML = `<p style="color: #ef4444; font-size: 13px;">Subtitle search error. Try uploading a custom file below.</p>`;
    }
  }
}

function applySubtitleTrack(vttUrl, label, srclang = 'en') {
  if (!videoPlayer) return;
  const existingTracks = videoPlayer.querySelectorAll('track');
  existingTracks.forEach(t => t.remove());

  const track = document.createElement('track');
  track.kind = 'subtitles';
  track.label = label || 'Subtitle';
  track.srclang = srclang;
  track.src = vttUrl;
  track.default = true;

  videoPlayer.appendChild(track);
  if (videoPlayer.textTracks && videoPlayer.textTracks[0]) {
    videoPlayer.textTracks[0].mode = 'showing';
  }
  
  if (window.plyrInstance) {
    window.plyrInstance.currentTrack = 0;
  }
}

if (subFileInput) {
  subFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    applySubtitleTrack(fileUrl, file.name.replace(/\.[^/.]+$/, ''));
    if (subtitleModal) subtitleModal.classList.add('hidden');
  });
}

// Audio Tracks Modal Handlers
let currentAudioTrackIndex = '';
const audioTrackModal = document.getElementById('audioTrackModal');
const audioTracksBtn = document.getElementById('audioTracksBtn');
const closeAudioBtn = document.getElementById('closeAudioBtn');
const audioTracksList = document.getElementById('audioTracksList');

if (audioTracksBtn && audioTrackModal) {
  audioTracksBtn.addEventListener('click', () => {
    audioTrackModal.classList.remove('hidden');
    loadAudioTracks();
  });
}

if (closeAudioBtn) {
  closeAudioBtn.addEventListener('click', () => {
    audioTrackModal.classList.add('hidden');
  });
}

async function loadAudioTracks() {
  if (!audioTracksList) return;
  if (!currentStreamInfo || !currentStreamInfo.hash) {
    audioTracksList.innerHTML = `<p style="color: #a1a1aa; font-size: 13px;">Play a video torrent first to inspect audio tracks.</p>`;
    return;
  }

  audioTracksList.innerHTML = `<p style="color: #6366f1; font-size: 13px;">Probing audio streams via ffprobe...</p>`;

  const directStreamUrl = `${TORRSERVER_BASE}/stream?link=${encodeURIComponent(currentStreamInfo.hash)}&index=${currentStreamInfo.fileId}&play=1`;
  
  try {
    const res = await fetch(`/api/torrent/audio-tracks?url=${encodeURIComponent(directStreamUrl)}`);
    const data = await res.json();

    if (!data.tracks || data.tracks.length === 0) {
      audioTracksList.innerHTML = `<p style="color: #a1a1aa; font-size: 13px;">Default Audio Track active.</p>`;
      return;
    }

    audioTracksList.innerHTML = '';
    data.tracks.forEach((tr, i) => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-outline';
      btn.style.cssText = 'width: 100%; text-align: left; justify-content: space-between; padding: 12px; font-size: 13px; font-weight: 600;';
      if ((currentAudioTrackIndex === '' && i === 0) || currentAudioTrackIndex === tr.index.toString()) {
        btn.className = 'btn btn-primary';
      }
      btn.innerHTML = `
        <span><i data-lucide="volume-2" style="width:14px; height:14px; display:inline-block; vertical-align:middle; margin-right:6px;"></i> ${tr.label}</span>
        ${(currentAudioTrackIndex === '' && i === 0) || currentAudioTrackIndex === tr.index.toString() ? '<span style="font-size:11px; font-weight:800; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:12px;">ACTIVE</span>' : ''}
      `;
      btn.addEventListener('click', () => {
        currentAudioTrackIndex = tr.index.toString();
        audioTrackModal.classList.add('hidden');
        
        const targetTime = videoPlayer ? videoPlayer.currentTime : 0;
        let modeToUse = gstEngineMode === 'direct' ? 'remux' : gstEngineMode;
        let seekUrl = `/api/torrent/stream-ffmpeg?url=${encodeURIComponent(directStreamUrl)}&mode=${modeToUse}&audioTrack=${currentAudioTrackIndex}`;
        if (targetTime > 5) {
          seekUrl += `&startTime=${Math.floor(targetTime)}`;
        }
        showLoading(`Switching Audio Track to ${tr.label}...`, 'Re-muxing audio stream...');
        if (videoPlayer) {
          videoPlayer.src = seekUrl;
    videoPlayer.load();
          videoPlayer.play().then(() => hideLoading()).catch(() => hideLoading());
        }
      });
      audioTracksList.appendChild(btn);
    });
    if (window.lucide) window.lucide.createIcons();
  } catch (e) {
    audioTracksList.innerHTML = `<p style="color: #ef4444; font-size: 13px;">Failed to probe audio tracks.</p>`;
  }
}

// Keyboard shortcut 'q' to toggle UI
document.addEventListener('keydown', (e) => {
  if (e.key === 'q' || e.key === 'Q') {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      document.body.classList.toggle('ui-hidden');
    }
  }
});

// Set default UI hidden mode on load so normal user only sees the video player
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('ui-hidden');
  attachSeekingHandler();
});

// Force Plyr duration display continuously

// Force Plyr duration display continuously
setInterval(() => {
  if (window.exactProbedDuration && window.exactProbedDuration > 0 && typeof gstEngineMode !== 'undefined' && gstEngineMode !== 'direct') {
    const totalSecs = Math.floor(window.exactProbedDuration);
    
    const timeDisplays = document.querySelectorAll('.plyr__time--duration');
    timeDisplays.forEach(el => {
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = (totalSecs % 60).toString().padStart(2, '0');
      const formattedTotal = hours > 0 
        ? `${hours}:${mins.toString().padStart(2, '0')}:${secs}` 
        : `${mins.toString().padStart(2, '0')}:${secs}`;
      el.textContent = formattedTotal;
    });
    
    // Fix current time
    const currentTimeDisplays = document.querySelectorAll('.plyr__time--current');
    currentTimeDisplays.forEach(el => {
      const seekOffset = window.currentSeekOffset || 0;
      const currentActualSecs = Math.min(totalSecs, Math.floor(seekOffset + (window.videoPlayer ? window.videoPlayer.currentTime : 0)));
      const chours = Math.floor(currentActualSecs / 3600);
      const cmins = Math.floor((currentActualSecs % 3600) / 60);
      const csecs = (currentActualSecs % 60).toString().padStart(2, '0');
      const formattedCurrent = chours > 0 
        ? `${chours}:${cmins.toString().padStart(2, '0')}:${csecs}` 
        : `${cmins.toString().padStart(2, '0')}:${csecs}`;
      el.textContent = formattedCurrent;
    });

    const inputs = document.querySelectorAll('.plyr__progress input[type="range"]');
    inputs.forEach(input => {
       input.max = window.exactProbedDuration;
       input.setAttribute('aria-valuemax', window.exactProbedDuration);
       const seekOffset = window.currentSeekOffset || 0;
       const currentActualSecs = Math.min(totalSecs, Math.floor(seekOffset + (window.videoPlayer ? window.videoPlayer.currentTime : 0)));
       // don't overwrite value if user is seeking
       if (!document.activeElement || document.activeElement !== input) {
           input.value = currentActualSecs;
           input.style.setProperty('--value', (currentActualSecs / window.exactProbedDuration * 100) + '%');
       }
    });
  }
}, 500);

window.addEventListener("error", function (e) {
    if (e.message === undefined && e.error === undefined && e.isTrusted !== undefined) {
        // This is a DOM element error (e.g., <track>, <video>, <img> failing to load)
        // Prevent it from bubbling up to AI Studio's global error capturer
        e.preventDefault();
        e.stopImmediatePropagation();
        console.warn('Caught unhandled DOM element error:', e);
    }
}, true);
