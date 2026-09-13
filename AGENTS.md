# AGENTS.md

This document provides comprehensive technical guidance for AI coding agents (Claude Code, Cursor, Copilot, Antigravity, OpenCode) working with the code in this repository.

---

## 1. Repository Overview & System Architecture

**TorrStream** is a high-performance OTT Magnet Video Streaming Web Application integrated with the [yourok/torrserver](https://github.com/yourok/torrserver) BitTorrent engine. It enables real-time video streaming of torrent magnet links without requiring full file downloads, featuring an integrated movie & TV series episode search engine powered by TMDB and Torrentio.

```
                  ┌─────────────────────────────────────────┐
                  │          Web Browser / Client           │
                  │  (http://localhost:3000 — index.html)   │
                  └────────────────────┬────────────────────┘
                                       │ REST / WS
                   ┌───────────────────┴───────────────────┐
                   │                                       │
                   ▼                                       ▼
┌──────────────────────────────────────┐ ┌──────────────────────────────────────┐
│       TorrStream Server              │ │         TorrServer Engine            │
│       (start-player.js:3000)         │ │         (bin/TorrServer.exe:8090)    │
├──────────────────────────────────────┤ ├──────────────────────────────────────┤
│ • Static Asset Server (HTML/CSS/JS)  │ │ • BitTorrent Swarm Engine & P2P      │
│ • /api/v1/search (TMDB + Torrentio)  │ │ • /torrents (Add, Get, List)         │
│ • /api/play (Direct Auto-Play Link)  │ │ • /stream (HTTP Chunked Video Stream)│
│ • Auto Cache Removal Collector       │ │ • /settings (RAM Cache & Prebuffer)  │
└──────────────────────────────────────┘ └──────────────────────────────────────┘
```

> [!IMPORTANT]
> **AUTOMATIC CACHE REMOVAL MECHANISM IS ACTIVE & CRITICAL**
> 
> To prevent RAM leaks, high memory usage, and disk exhaustion during continuous video streaming sessions, TorrStream implements a 2-tier **Automatic Cache Removal Mechanism**:
> 
> 1. **Engine Level (`RemoveCacheOnDrop: true`, `TorrentDisconnectTimeout: 30`)**:
>    - Configured automatically in `app.js` via `POST http://localhost:8090/settings`.
>    - Forces TorrServer to immediately free and release RAM cache blocks when a torrent is dropped or completed.
>    - Automatically disconnects idle swarm connections after 30 seconds of inactivity.
> 
> 2. **Backend Garbage Collector (`startAutoCacheRemoval()` in `start-player.js`)**:
>    - Runs a background interval every 10 minutes checking active torrents in engine memory.
>    - If more than 3 active torrents accumulate in RAM, it automatically purges older idle torrent RAM caches via `{ action: 'drop', hash }` API calls, preserving system RAM and guaranteeing zero memory bloat.

---

## 2. File-by-File Technical Deep Dive

### 📄 `start-player.js` — Full-Stack Server & Search Dispatcher
- **Role**: Primary application entry point and Node.js HTTP server running on port `3000`.
- **Key Functions**:
  - `startAutoCacheRemoval()`: Background garbage collector running every 10 minutes to drop idle torrent RAM caches.
  - `launchTorrServerProcess()`: Spawns `bin/TorrServer.exe -p 8090` as a child process and monitors stdout/stderr logs.
  - `handleSearchV1(params)`: Implements the `/api/v1/search` endpoint. Resolves movie/series titles, TMDB IDs, or IMDb IDs using TMDB API (`api.themoviedb.org`), queries Torrentio (`torrentio.strem.fun/stream/{movie|series}/{id}.json`), appends high-speed trackers, and returns structured stream JSON.
  - `searchExternalProviders(query)`: Aggregates magnet streams, extracts resolution tags (`2160p`, `1080p`, `720p`), file sizes, and seeder counts.
  - `/api/play` Route: Handles direct URL playback triggers (`/api/play?q=Title`), resolving magnet links and issuing HTTP 302 redirects to `/?magnet=...`.
  - `startWebPlayerServer()`: Serves static web assets (`index.html`, `styles.css`, `app.js`) with proper MIME types.

### 📄 `app.js` — Client-Side Application & Player Logic
- **Role**: Client UI logic, REST API client for TorrServer, metadata poller, and HTML5 player manager.
- **Key State Variables**:
  - `activeTorrentHash`: Hash of the currently playing torrent.
  - `activeFileIndex`: File ID of the selected video track within the torrent.
  - `currentTorrentData`: Full torrent object returned from TorrServer.
  - `statsPollInterval`: 1.5s interval polling download speed, seeder/leecher counts, and buffer progress.
- **Key Functions**:
  - `checkUrlAutoPlay()`: Parses `window.location.search` for `?play=`, `?q=`, `?search=`, or `?magnet=` URL parameters for zero-click playback.
  - `playMagnetOrUrl(input)`: Validates magnet format or query string; posts `{ action: 'add', link: input }` to TorrServer (`http://localhost:8090/torrents`).
  - `pollTorrentMetadata(hash, attempts)`: 40-second polling cycle (every 800ms) waiting for TorrServer to resolve torrent header metadata (`file_stats`).
  - `playTorrentFile(hash, fileId, ...)`: Binds `http://localhost:8090/stream?link=${hash}&index=${fileId}&play=1` to the `<video>` element.
  - `applyBufferSettings(...)`: Issues `POST /settings` to TorrServer setting `CacheSize`, `ConnectionsLimit: 120`, `PreloadCache: 10`, `RemoveCacheOnDrop: true`, `TorrentDisconnectTimeout: 30`, and `ResponsiveMode: true`.
  - `performMovieSearch(query, type, season, episode)`: Fetches `/api/v1/search` and renders interactive stream cards in the search modal.

### 📄 `index.html` — User Interface Structure
- **Role**: Semantic HTML5 layout for the web player and dashboard.
- **Key UI Sections**:
  - `.header`: Branding, server status indicator (`.status-pill`), current buffer badge, and **Search Movies & Series** modal trigger.
  - `.magnet-hero-card`: Hero input bar supporting magnet paste, clear button, and instant play action.
  - `.quick-samples`: Demo movie chips (*Sintel 4K*, *Big Buck Bunny*, *Tears of Steel*).
  - `.player-card`: Responsive 16:9 video player container, live stats overlay badge bar, and loading spinner overlay.
  - `.buffer-config-card`: Buffer & Speed Optimizer panel with selectable RAM cache presets (**Standard 64MB**, **⚡ 200MB Instant**, **🚀 500MB Ultra**).
  - `#filesListContainer`: Torrent file tree explorer allowing 1-click file track selection.
  - `#searchModal`: Modal overlay containing Movie vs TV Series radio toggle, Season/Episode number inputs, search input, and results card container.

### 📄 `styles.css` — Glassmorphism Design System
- **Role**: Deep dark theme stylesheet using CSS custom properties (design tokens).
- **Design Tokens**:
  - Font Families: `Outfit` (sans-serif titles/body), `JetBrains Mono` (monospace stats/hashes).
  - HSL Color Palette: Background `#0a0c14`, Cards `rgba(18, 22, 34, 0.7)`, Primary Accent `#8b5cf6` (Purple), Secondary Accent `#06b6d4` (Cyan), Emerald `#10b981`.
  - Glassmorphism: `backdrop-filter: blur(16px)` / `blur(20px)` on cards, headers, and modal backdrops.
  - Breakpoints: Responsive design for `320px`, `768px`, `1024px`, `1440px`.

### 📄 `bin/TorrServer.exe` — BitTorrent Engine Binary
- **Role**: Prebuilt 64-bit Windows executable of TorrServer (Version MatriX.142.2).
- **Port**: `8090`
- **Key Engine REST Endpoints**:
  - `GET /echo`: Returns server version (`MatriX.142.2`).
  - `POST /torrents`: JSON API with actions `add`, `get`, `list`, `rem`, `drop`.
  - `GET /stream`: Live HTTP video stream endpoint (`/stream?link=<hash>&index=<id>&play=1`).
  - `POST /settings`: Configuration API (`CacheSize`, `PreloadCache`, `ConnectionsLimit`, `ResponsiveMode`, `RemoveCacheOnDrop`).

---

## 3. End-to-End Execution & Data Flows

### A. Magnet Stream Initialization Flow
```
User Pastes Magnet ───► app.js (playMagnetOrUrl)
                             │
                             ▼
                  POST /torrents { action: "add" }
                             │
                             ▼
                 TorrServer Resolves DHT Metadata
                             │
                             ▼
                  app.js (pollTorrentMetadata)
                             │ (file_stats resolved)
                             ▼
              Auto-Selects Largest Video Track
                             │
                             ▼
           videoPlayer.src = http://localhost:8090/stream?link=...&play=1
                             │
                             ▼
                   Live Stream Playback Starts
```

### B. Search & Direct Play Flow
```
User Search Request ───► /api/v1/search?q=Query&type=series&s=1&e=1
                                   │
                                   ▼
                       TMDB API Resolves ID
                                   │
                                   ▼
                      Torrentio Stream Query
                                   │
                                   ▼
                   Appends Swarm Trackers list
                                   │
                                   ▼
                     Returns JSON Stream Array
                                   │
                                   ▼
                  1-Click Play Launches Stream
```

---

## 4. API Quick Reference

| Endpoint | Method | Description | Example Query |
|---|---|---|---|
| `http://localhost:3000` | `GET` | Main Web OTT Video Player | `http://localhost:3000/?play=Avatar` |
| `http://localhost:3000/api/play` | `GET` | Direct Auto-Play API Link | `http://localhost:3000/api/play?q=The+Batman` |
| `http://localhost:3000/api/v1/search` | `GET` | Standalone REST Search API V1 | `http://localhost:3000/api/v1/search?q=Breaking+Bad&s=1&e=1` |
| `http://localhost:3000/api/v1/search` | `GET` | TMDB TV Series Episode Search | `http://localhost:3000/api/v1/search?tmdb=1396&type=series&s=1&e=1` |
| `http://localhost:3000/api/v1/search` | `GET` | TMDB Movie Search | `http://localhost:3000/api/v1/search?tmdb=19995&type=movie` |
| `http://localhost:8090/echo` | `GET` | TorrServer Engine Ping | `http://localhost:8090/echo` |
| `http://localhost:8090/torrents` | `POST` | TorrServer Torrent Control | `POST { "action": "list" }` |
| `http://localhost:8090/settings` | `POST` | TorrServer Engine Config | `POST { "action": "set", "sets": { "CacheSize": 209715200, "RemoveCacheOnDrop": true } }` |

---

## 5. Troubleshooting: Possible Errors & Solutions

### Error 1: `Offline (Port 8090)` or `Failed to add magnet: HTTP 500/Failed to fetch`
- **Root Cause**: `bin/TorrServer.exe` process is not running, binary is missing, or port 8090 is blocked by a local firewall/antivirus.
- **Diagnostic Step**:
  ```bash
  # Check if port 8090 is listening
  powershell -Command "Test-NetConnection -ComputerName localhost -Port 8090"
  ```
- **Solution**:
  1. Verify `bin/TorrServer.exe` exists. If missing, run `download-torrserver.ps1` in PowerShell.
  2. Kill any stale TorrServer instances:
     ```cmd
     taskkill /F /IM TorrServer.exe
     ```
  3. Restart the server via `npm start` or `node start-player.js`.

---

### Error 2: Heavy Buffering / Stuttering / Slow Loading on 4K & 1080p Videos
- **Root Cause**: TorrServer prebuffer percentage (`PreloadCache`) was set too high (e.g. 60%), requiring hundreds of megabytes to download before playback starts, or RAM cache (`CacheSize`) is constrained to 64MB.
- **Diagnostic Step**: Check the engine settings configuration in the server logs or via `POST http://localhost:8090/settings`.
- **Solution**:
  1. Select **⚡ 200MB Instant** or **🚀 500MB Ultra** in the **Buffer & Speed Optimizer** side panel.
  2. `app.js` automatically sets `PreloadCache: 10`, `ReaderReadAHead: 30`, and `ResponsiveMode: true` so playback starts in **1 second**.

---

### Error 3: `Timed out waiting for torrent metadata. Ensure magnet has active seeders.`
- **Root Cause**: The torrent magnet link has 0 active seeders in the BitTorrent DHT swarm, or trackers are missing.
- **Diagnostic Step**:
  - Inspect seeder count overlay in the player (`statPeers`). If `0 Peers` remains for > 30 seconds, DHT resolution failed.
- **Solution**:
  1. `start-player.js` auto-appends 9 high-speed BitTorrent trackers (`nyaa.tracker.wf`, `opentrackr.org`, `open.stealth.si`).
  2. Test alternative magnet links with active seeder swarms via the **Search Movies & Series** modal.

---

### Error 4: Video Audio Plays but Video Screen is Black (Codec / HTML5 Error)
- **Root Cause**: The video container (e.g., MKV with HEVC/H.265 or AC3 audio) is not natively hardware-decoded by certain browser engines (Safari/Firefox).
- **Diagnostic Step**: Open browser console (`F12`) and inspect `<video>` error codes (`videoPlayer.error`).
- **Solution**:
  1. Use modern Chromium-based browsers (Google Chrome, Microsoft Edge, Brave) which feature native hardware acceleration for HEVC/H.264/MKV.
  2. Click **Copy Stream URL** button in the player meta bar, open **VLC Media Player** -> *Media* -> *Open Network Stream* (`Ctrl+N`), and paste the HTTP stream URL.

---

### Error 5: `EADDRINUSE: address already in use :::3000`
- **Root Cause**: A background Node process is already running `start-player.js` on port `3000`.
- **Diagnostic Step**:
  ```powershell
  Get-Process -Name node
  ```
- **Solution**:
  Terminate the existing Node process:
  ```powershell
  Stop-Process -Name node -Force
  ```

---

## 6. Developer Guidelines & Boundaries

### Always Do
- Test changes by running `node start-player.js` or `npm start`.
- Preserve responsive layout, CSS custom properties, and dark glassmorphic styling in `styles.css`.
- Keep the `PreloadCache` at 10%, `RemoveCacheOnDrop: true`, and `ResponsiveMode: true` in `app.js` to prevent heavy buffering and RAM bloat.
- Ensure video extensions (`.mkv`, `.mp4`, `.webm`, `.avi`, `.ts`, `.m2ts`, `.wmv`) and largest-file fallbacks are maintained.

### Never Do
- Do not modify ports `3000` or `8090` without updating both `app.js` and `start-player.js`.
- Do not remove the `bin/TorrServer.exe` binary.
- Do not swallow errors or disable metadata polling timeouts.

---

## 7. AnimeStream Automated Scraper & File System (`anime-scraper/`)

### 📦 Overview
`anime-scraper/` is an automated scraping engine and HLS media server with integrated MyAnimeList search and playlist generation:

- **Entry Point**: `node anime-scraper/server.js` running on `http://localhost:3050`.
- **CLI Commands**: `node anime-scraper/cli.js <scrape|list|status|export|clean|episode>`.
- **Storage Architecture**:
  - `storage/metadata/<anime-slug>/`: Structured JSON metadata per anime & season.
  - `storage/playlists/<anime-slug>/`: Standard `.m3u` playlists for VLC / IPTV / MPV.
  - `storage/catalog.json`: Top-level index of scraped anime & episodes.
- **MyAnimeList Hub**:
  - Automatically translates Romaji titles (e.g. *Ore dake Level Up na Ken*) to English (*Solo Leveling*).
  - 1-Click episode picker with single-episode targeted scraping.

