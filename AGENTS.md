# 🤖 AGENTS.md — HL AI, Stalker Pro & TorrStream Architecture Guide

This document provides comprehensive, authoritative technical guidance for AI coding agents (Claude Code, Cursor, Copilot, Antigravity, OpenCode) working with the code, scrapers, APIs, and player engines in this repository.

---

## 1. System Overview & Multi-Engine Architecture

**TorrStream / HL Remix (Stalker Pro)** is a unified high-performance OTT Streaming Platform combining BitTorrent P2P streaming with real-time Live Sports scraping and IPTV distribution.

```
                                  ┌──────────────────────────────────────────────┐
                                  │             Web Client / Browser             │
                                  │  (consumet.html / hero.html / index.html)    │
                                  └──────────────────────┬───────────────────────┘
                                                         │ HTTP / WS / M3U
                      ┌──────────────────────────────────┴──────────────────────────────────┐
                      ▼                                                                     ▼
   ┌──────────────────────────────────────┐                              ┌──────────────────────────────────────┐
   │       TorrStream Server              │                              │         TorrServer Engine            │
   │       (start-player.js:3000)         │                              │         (bin/TorrServer.exe:8090)    │
   ├──────────────────────────────────────┤                              ├──────────────────────────────────────┤
   │ • MDTV Scraper (mdtv-scraper.js)     │                              │ • BitTorrent Swarm Engine & P2P      │
   │ • TimStreams Live TV Resolver        │                              │ • /torrents (Add, Get, List, Drop)   │
   │ • /sports.m3u & /api/mdtv/playlist   │                              │ • /stream (Chunked Video Stream)     │
   │ • /player/mdtv (ClearKey Player)     │                              │ • /settings (RAM Cache Optimizer)    │
   │ • /api/v1/search (TMDB + Torrentio)  │                              └──────────────────────────────────────┘
   │ • HLS Segment Proxy (/api/ts)        │
   │ • Auto Cache Removal Garbage Collector│
   └──────────────────────────────────────┘
```

---

## 2. Live Sports Scrapers & Streaming Engines

### 📡 A. MDTV Sports Scraper (`mdtv-scraper.js`)
- **Target Portal**: `https://i.mdtv.dpdns.org/live-stream`
- **Upstream Channel & DRM Feed**: `https://raw.githubusercontent.com/sportlive18/jio-tv-auto-update-playlist/refs/heads/main/star2.json`
- **Channels Managed**: 34 premium sports channels:
  - **Star Sports Network**: Star Sports 1 HD, Star Sports 2 HD, 1 Hindi HD, 1 Tamil HD, 1 Telugu HD, 1 Kannada, 2 Hindi HD, Select 1 HD, Select 2 HD, Star Sports 3, Star Sports Khel.
  - **Sony Sports Network**: Sony Sports Ten 1 HD, Ten 2 HD, Ten 3 Hindi HD, Ten 4 Telugu/Tamil/Kannada, Ten 5 HD.
  - **Multi-Sport & National**: Eurosport HD, Eurosport SD, DD Sports.
- **Security & Stream Protocol**:
  - **Stream Type**: Dynamic DASH (`application/dash+xml` `.mpd` manifests).
  - **DRM Encryption**: W3C ClearKey DRM with `key_id:key` pairs (e.g. `965dc2ddb1d85138ad787999a7f30ca5:859695076e67fe961836b564db6d689c`).
  - **Akamai Token (`__hdnea__`)**: URL-encoded authorization cookies with HMAC SHA-256 signatures (`st=...~exp=...~acl=...~hmac=...`).
- **CLI Commands**:
  ```bash
  node mdtv-scraper.js list           # Displays tabular list of all 34 channels with DRM status
  node mdtv-scraper.js resolve 1106   # Resolves channel 1106 (Star Sports 1 HD) stream URL, token & keys
  node mdtv-scraper.js m3u            # Outputs standard IPTV M3U with Kodi ClearKey DRM properties
  node mdtv-scraper.js export-hl      # Exports channels formatted for HL Remix assets/channels.json
  node mdtv-scraper.js sync-hl [path] # Merges MDTV channels directly into assets/channels.json
  ```

---

### 📡 B. TimStreams & epiembeds Resolver (`start-player.js`)
- **Upstream Hub**: `https://timst.cfd/api/streams` & `https://exmxbxe.cfd/<slug>`
- **Cipher Decryption**:
  - Scrapes embed HTML pages and dynamically decodes obfuscated XOR + subtraction ciphers:
    ```javascript
    decoded += String.fromCharCode(((arr[i] ^ k1) - k2 + 256) & 255);
    ```
  - Follows up to 5 HTTP 302 redirects to extract ephemeral `.m3u8` CDN URLs.
- **In-Memory Cache**: 90-second TTL cache for active HLS tokens to ensure fast channel switching without hitting rate limits.

---

### 📡 C. DaddyLive / DLHD Resolver (`src/routes/sportsM3u.ts` in HL)
- **Upstream Hub**: `https://hamis.romponalis.st/premiumtv/daddy3.php?id=<id>` & `https://dlhd.st/`
- **Decoding Engine**: Base64 (`atob()`) extraction and numerical array unscramblers.

---

## 3. Player Architecture & DRM Playback

### 📺 1. Clean Web Player (`player_mdtv.html` / `/player/mdtv`)
- **Engine**: JWPlayer (Version 8.x) configured with native ClearKey DRM support.
- **Aspect Ratio**: Responsive 16:9 full viewport with zero ads, tracking, or devtool blockers.
- **XHR Interception**:
  - Automatically intercepts all browser `XMLHttpRequest` calls for `.mpd`, `.m4s`, and `.m3u8` media chunks.
  - Dynamically appends `__hdnea__=<token>` to each `.m4s` segment request so JioTV CDN does not throw HTTP 403 Forbidden.
- **Usage**:
  ```html
  <iframe src="http://localhost:3000/player/mdtv?id=1106" allowfullscreen></iframe>
  ```

### 📺 2. Full OTT Dashboard (`consumet.html`)
- **Sports View (`#view-sports`)**:
  - Features dynamic shelves: Sky Sports, Cricket Network, Formula 1, US Sports, and Sony Sports.
  - Automatically populates channels from `/sports.m3u` and `/api/sports/channels`.
  - Clicking any channel directly opens the embedded theater player modal.

### 📺 3. Standard IPTV / Kodi M3U (`/sports.m3u` & `/api/mdtv/playlist.m3u`)
- Exports standard `#EXTM3U` format with `#KODIPROP` directives compatible with:
  - **TiviMate**, **OTT Navigator**, **IPTV Smarters Pro**, **Kodi (InputStream Adaptive)**, and **VLC**.
- Format sample:
  ```m3u
  #EXTINF:-1 tvg-id="1106" tvg-name="Star Sports 1 HD" tvg-logo="..." group-title="Cricket",Star Sports 1 HD
  #KODIPROP:inputstream.adaptive.manifest_type=mpd
  #KODIPROP:inputstream.adaptive.license_type=clearkey
  #KODIPROP:inputstream.adaptive.license_key=965dc2ddb1d85138ad787999a7f30ca5:859695076e67fe961836b564db6d689c
  http://localhost:3000/player/mdtv?id=1106
  ```

---

## 4. HL Zip / Stalker Pro Compatibility

HL AI maintains an active catalog in `assets/channels.json`. MDTV channels are formatted according to the HL schema:

```json
{
  "channel_id": "mdtv-1106",
  "name": "Star Sports 1 HD [DASH | ClearKey]",
  "genre": "Cricket",
  "logo": "https://img.media.jio.com/...",
  "source": "mdtv",
  "stream_url": "http://localhost:3000/player/mdtv?id=1106",
  "drm": {
    "type": "clearkey",
    "key_id": "965dc2ddb1d85138ad787999a7f30ca5",
    "key": "859695076e67fe961836b564db6d689c"
  }
}
```

To sync channels between TorrStream and HL Zip:
```bash
node mdtv-scraper.js sync-hl assets/channels.json
```

---

## 5. API Quick Reference

| Endpoint | Method | Description | Example Usage |
|---|---|---|---|
| `/api/mdtv/channels` | `GET` | All 34 MDTV channels with stream data & keys | `curl http://localhost:3000/api/mdtv/channels` |
| `/api/mdtv/manifest/:id.mpd` | `GET` | Rewritten DASH manifest (Absolute BaseURL + W3C ClearKey UUID) | `curl http://localhost:3000/api/mdtv/manifest/162.mpd` |
| `/api/mdtv/stream/:id` | `GET` | Resolves single channel (ID, slug alias, or name) | `curl http://localhost:3000/api/mdtv/stream/ss1` |
| `/play_consumet.php` / `/play.php` | `GET` | Native Plyr UI player with Shaka Player + Base64URL Dash.js | `http://localhost:3000/play_consumet.php?channel_id=mdtv-162` |
| `/player/mdtv?id=:id` | `GET` | Clean embedded ClearKey web player | `http://localhost:3000/player/mdtv?id=1106` |
| `/sports.m3u` | `GET` | Dynamic sports M3U playlist | `http://localhost:3000/sports.m3u` |
| `/api/sports/channels` | `GET` | Formatted channels list for OTT dashboard | `http://localhost:3000/api/sports/channels` |
| `/api/live/all.m3u` | `GET` | Unified live TV M3U (TimStreams + MDTV) | `http://localhost:3000/api/live/all.m3u` |
| `/api/live/:slug.m3u8` | `GET` | Resolves and proxies live HLS stream | `http://localhost:3000/api/live/sonysport.m3u8` |
| `/api/ts?u=:url` | `GET` | HLS media segment proxy with origin referer | `http://localhost:3000/api/ts?u=<encoded-url>` |

---

## 6. Developer & AI Agent Operating Rules

### Always Do:
1. **Use Pure Node.js HTTP/HTTPS**: Scrapers must execute via native `http`/`https` or `fetch`. Never introduce headless browsers (Puppeteer, Playwright) for channel scraping.
2. **Preserve Akamai Token Flow**: When resolving JioTV DASH streams, ensure `__hdnea__` is present on both manifest URL and all media segment requests.
3. **Respect Memory Guards**: Ensure TorrServer cache optimizer runs every 10 minutes (`startAutoCacheRemoval()`) to avoid RAM bloat during marathon streaming.
4. **Follow Semantic Slug Aliases**: When adding channels, map both official numeric IDs (e.g. `1106`) and intuitive shorthand slugs (`ss1`, `ss1-hindi`, `ten1`, `ddsports`) in `SLUG_MAP`.

### Never Do:
1. **Never Hardcode Expired Tokens**: Stream tokens expire periodically. Always pull through `fetchMdtvChannels()` or cache with a TTL $\le$ 5 minutes.
2. **Never Attempt DRM Circumvention**: Do not use CDM dumpers or bypass widevine keys. Use only standard W3C ClearKey decryption as provided by the open upstream manifests.
3. **Never Block on Missing Channels**: If an upstream channel fails to respond, return HTTP 404 or fallback gracefully to the catalog without crashing the server process.

---

## 7. Troubleshooting Playbook

### Issue 1: `HTTP 403 Forbidden` on `.m4s` chunks in player
- **Root Cause**: The Akamai authentication token (`__hdnea__`) was stripped by the browser when loading DASH media segments.
- **Solution**: Verify that `player_mdtv.html` XHR interceptor (`XMLHttpRequest.prototype.open`) is active and appending the token to every `.m4s` request.

### Issue 2: Channel fails with `Channel not found`
- **Root Cause**: Channel ID or slug mismatch.
- **Solution**: Check `SLUG_MAP` in `mdtv-scraper.js`. Test resolution directly using `node mdtv-scraper.js resolve <id>`.

### Issue 3: `EADDRINUSE: address already in use :::3000`
- **Root Cause**: Stale Node process is running.
- **Solution**: Run `Stop-Process -Name node -Force` in PowerShell, then restart via `node start-player.js`.
