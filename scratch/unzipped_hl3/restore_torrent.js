const fs = require('fs');
let code = fs.readFileSync('public/torrent.js', 'utf8');

const replacement = `
// Video Events
}

async function checkServerConnection() {
  try {
    const res = await fetch(\`\${TORRSERVER_BASE}/echo\`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const text = await res.text();
      setServerStatus(true, \`Online (\${text.trim() || 'TorrServer'})\`);
      return true;
    }
  } catch (err) {
    try {
      const res = await fetch(\`\${TORRSERVER_BASE}/torrents\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) {
        setServerStatus(true, 'Online (TorrServer)');
        return true;
      }
    } catch(e) {}
  }
  setServerStatus(false, 'Server Offline or Starting...');
  return false;
}

function setServerStatus(isOnline, text) {
  serverStatusText.textContent = text;
  if (isOnline) {
    serverStatusPill.classList.remove('offline');
    serverStatusPill.classList.add('online');
  } else {
    serverStatusPill.classList.remove('online');
    serverStatusPill.classList.add('offline');
  }
}

async function applyBufferSettings(cacheSize, maxPeers, preload, label, tagText) {
  bufferPresetText.textContent = label;
  if (presetTag) presetTag.textContent = tagText;
  try {
    const confRes = await fetch(\`\${TORRSERVER_BASE}/settings\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'set',
        sets: {
          CacheSize: cacheSize,
          ConnectionsLimit: maxPeers,
          PreloadCache: preload,
          ReaderReadAHead: 30
        }
      })
    });
    console.log('Buffer settings applied');
  } catch (e) {
    console.warn('Failed to set buffer config:', e);
  }
}

async function playMagnetOrUrl(input) {
  const isDirectVideo = isVideoFile(input) && (input.startsWith('http') || input.startsWith('/'));
  
  if (isDirectVideo) {
    startDirectVideo(input, getFileName(input));
    return;
  }
  
  showLoading('Analyzing link...', 'Extracting hash from Magnet URL...');
  
  let hash = input;
  if (input.includes('xt=urn:btih:')) {
    const match = input.match(/xt=urn:btih:([a-zA-Z0-9]+)/);
    if (match) hash = match[1];
  }
  
  if (!hash || hash.length < 32) {
    hideLoading();
    alert('Invalid Magnet link or Hash.');
    return;
  }
  
  activeTorrentHash = hash.toLowerCase();
  
  try {
    showLoading('Connecting to TorrServer...', 'Adding torrent to engine...');
    const addRes = await fetch(\`\${TORRSERVER_BASE}/torrents\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add',
        link: input,
        save_to_db: true
      })
    });
    
    if (!addRes.ok) throw new Error('Failed to add torrent');
    const text = await addRes.text();
    if (text.startsWith('<')) throw new Error('Received HTML instead of JSON on add');
    const torrData = JSON.parse(text);
    
    currentTorrentData = torrData;
    activeTorrentHash = torrData.hash;
    
    pollTorrentMetadata(activeTorrentHash, 0);
  } catch (err) {
    console.error(err);
    hideLoading();
    alert('Failed to add torrent. TorrServer might be offline.');
  }
}

function pollTorrentMetadata(hash, retries = 0) {
  showLoading('Fetching Metadata...', 'Waiting for peers to download torrent info...');
  
  if (metadataPollTimer) clearTimeout(metadataPollTimer);
  
  metadataPollTimer = setTimeout(async () => {
    try {
      const res = await fetch(\`\${TORRSERVER_BASE}/torrents\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get', hash: hash })
      });
      
      if (res.ok) {
        const text = await res.text();
        if (text.startsWith('<')) throw new Error('HTML response');
        const data = JSON.parse(text);
        
        let fileStats = null;
        if (data.data) {
           try {
             const parsedData = JSON.parse(data.data);
             if (parsedData && parsedData.TorrServer && parsedData.TorrServer.Files) {
                fileStats = parsedData.TorrServer.Files;
             }
           } catch(e) {}
        }
        
        if (fileStats && fileStats.length > 0) {
           renderFileList(fileStats);
           
           let bestFile = null;
           for (const f of fileStats) {
             if (isVideoFile(f.path)) {
               if (!bestFile || f.length > bestFile.length) bestFile = f;
             }
           }
           
           if (!bestFile) bestFile = fileStats[0];
           
           playTorrentFile(hash, bestFile.id, bestFile.path, data.title, bestFile.length);
           return;
        }
      }
    } catch (e) {
      console.warn('Poll meta err:', e);
    }
    
    if (retries < 20) {
       pollTorrentMetadata(hash, retries + 1);
    } else {
       hideLoading();
       alert('Timeout waiting for metadata. Not enough peers.');
    }
  }, 2000);
}

function playTorrentFile(hash, fileId, filePath, title, fileLength) {
  activeFileIndex = fileId;
  const isAvi = filePath.toLowerCase().endsWith('.avi');
  const isMkv = filePath.toLowerCase().endsWith('.mkv');
  const isHevc = filePath.toLowerCase().includes('hevc') || filePath.toLowerCase().includes('x265');
  const isUnsupported = isAvi || isMkv || isHevc;
  
  const streamUrl = \`\${TORRSERVER_BASE}/stream?link=\${encodeURIComponent(hash)}&index=\${fileId}&play=1\`;
  
  currentTitle.textContent = getFileName(title || filePath || 'Torrent Video Stream');
  currentHash.textContent = isAvi ? '⚠️ Legacy AVI Format (Use Copy Stream URL for VLC)' : \`Hash: \${hash.substring(0, 10)}...\`;
  currentSize.textContent = fileLength ? \`Size: \${formatBytes(fileLength)}\` : 'Size: Dynamic';
  
  highlightActiveFile(fileId);
  playerPlaceholder.classList.add('hidden');
  
  videoPlayer.src = \`/play_torrent.php?url=\${encodeURIComponent(streamUrl)}&name=\${encodeURIComponent(title || filePath || 'Torrent Video Stream')}\`;
  hideLoading();
  startStatsPolling(hash);
}

function startDirectVideo(url, title) {
  currentTitle.textContent = title;
  currentHash.textContent = 'Hash: Direct URL';
  currentSize.textContent = 'Size: Dynamic';
  playerPlaceholder.classList.add('hidden');
  
  videoPlayer.src = \`/play_torrent.php?url=\${encodeURIComponent(url)}&name=\${encodeURIComponent(title || 'Torrent Video Stream')}\`;
  hideLoading();
}

async function performMovieSearch(query, type, season, episode) {
  searchModal.classList.add('hidden');
  showLoading(\`Searching & Auto-Playing "\${query}"...\`, 'Fetching best stream from external providers...');
  
  try {
    let url = \`/api/search?q=\${encodeURIComponent(query)}&type=\${type}\`;
    if (type === 'series') {
       url += \`&s=\${season}&e=\${episode}\`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    let results = data.results || data.streams || [];
    
    if (results && results.length > 0) {
      const bestResult = results[0];
      console.log(\`[Auto-Play API] Selected top stream: \${bestResult.title}\`);
      
      const targetUrl = bestResult.magnet || bestResult.url;
      magnetInput.value = targetUrl;
      playMagnetOrUrl(targetUrl);
      return;
    } else {
       hideLoading();
       alert('No streams found for this title.');
    }
  } catch(e) {
    console.warn('Auto-play search failed:', e);
    hideLoading();
    alert('Search failed or timed out.');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkServerConnection();
  loadActiveTorrentsList();
  serverPollInterval = setInterval(checkServerConnection, 5000);
  setInterval(loadActiveTorrentsList, 15000);
});

`;

code = code.replace(/  \/\/ Video Events\n\}/, replacement);
fs.writeFileSync('public/torrent.js', code);
console.log("Restored missing functions to torrent.js");
