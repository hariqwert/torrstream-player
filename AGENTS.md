# AGENTS.md

This document provides comprehensive technical guidance for AI coding agents (Claude Code, Cursor, Copilot, Antigravity, OpenCode) working with the code in this repository.

---

## 1. Repository Overview & System Architecture

**AnimeStream Scraper** is an automated video scraping engine, HLS media server, and OTT streaming web player with deep MyAnimeList (MAL) and Kitsu integration. It extracts high-definition video streams with multiple audio tracks and subtitles directly from streaming sources, generates standard `.m3u` / `.m3u8` playlists for media players (VLC, IPTVnator, MPV), and provides a responsive dark-mode web player with zero external npm dependencies.

```
                  ┌──────────────────────────────────────────────┐
                  │       Web Browser / OTT Client (HLS.js)      │
                  │             (http://localhost:3050)          │
                  └──────────────────────┬───────────────────────┘
                                         │ REST / HLS Video Stream
                     ┌───────────────────┴───────────────────┐
                     │                                       │
                     ▼                                       ▼
┌─────────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│     AnimeStream Server (server.js:3050) │ │        External APIs & Upstream         │
├─────────────────────────────────────────┤ ├─────────────────────────────────────────┤
│ • Static Assets Server (HTML/CSS/JS)    │ │ • MyAnimeList API (Search & Watchlists) │
│ • /api/scrape (Single Ep & Full Season) │ │ • Kitsu API (Romaji → English Mapping)  │
│ • /api/discover (Episode Enumeration)   │ │ • AnimeSalt Video Swarm & CDNs          │
│ • /api/match (English Anime Source URL) │ │ • Transparent CORS HLS Proxy (/proxy/hls│
│ • Storage Manager & M3U Playlist Engine │ │                                         │
└─────────────────────────────────────────┘ └─────────────────────────────────────────┘
```

---

## 2. File-by-File Technical Deep Dive

### 📄 `server.js` — Core HTTP Server & REST API Dispatcher
- **Role**: Primary application entry point running on port `3050`. Uses native Node.js `http` module with zero npm packages.
- **Key Functions & Endpoints**:
  - `/api/scrape`: Handles POST requests for scraping. Supports `{ url, limit, force, episodeNumber, singleEpisode, range }` with real-time Chunked Transfer log streaming.
  - `/api/discover`: Resolves available episodes with English episode titles directly from upstream series or episode URLs.
  - `/api/match`: Queries anime titles, maps Romaji to official English titles via Kitsu, searches AnimeSalt, and returns exact stream match URLs.
  - `/api/mal/search` & `/api/mal/user`: Searches MyAnimeList and loads user watchlists with synchronized Kitsu English translations.
  - `/proxy/hls`: Transparent CORS streaming proxy rewriting m3u8 playlist chunk URLs so browsers can play CDN streams without CORS errors.
  - `/api/catalog`, `/api/episodes`, `/api/playlists`: Local file system API endpoints exposing stored anime metadata and playlists.

### 📄 `cli.js` — Unified Command-Line Interface
- **Role**: Full-featured CLI for terminal workflows and automated background cron tasks.
- **Commands**:
  - `node cli.js scrape <url> [--limit <n>] [--force] [--episode <num>] [--single]`
  - `node cli.js episode <url> [episodeNumber]`: Targeted single episode scraping.
  - `node cli.js list`: Lists all stored anime, seasons, episode counts, and playlist paths.
  - `node cli.js status`: Displays storage statistics and disk usage.
  - `node cli.js export [anime-slug]`: Regenerates `.m3u` season and master series playlists.
  - `node cli.js clean`: Purges expired stream cache tokens.

### 📄 `lib/scraper-engine.js` — Scraper Orchestrator & Crawler
- **Role**: Coordinates episode discovery, stream resolution, token cache lookup, and storage writes.
- **Key Features**:
  - `discoverEpisodes(targetUrl)`: Crawls series or episode pages, parses episode numbers, and extracts clean English episode titles.
  - `scrapeSeries(...)`: Handles multi-episode iterations with configurable rate-limiting and delay.
  - Strict Single Episode Mode: Targets exactly one episode when `singleEpisode: true` or `episodeNumber` is provided, never falling back to full season scraping.

### 📄 `lib/stream-resolver.js` — Video Source & Iframe Resolver
- **Role**: Resolves player iframes, decrypts video payloads, and extracts direct `.m3u8` HLS stream links with audio and subtitle tracks.

### 📄 `lib/storage-manager.js` — Atomic Filesystem Manager
- **Role**: Manages file system writes under `storage/`, directory generation, atomic JSON operations, and log rotation.

### 📄 `lib/playlist-builder.js` — M3U / M3U8 Generator
- **Role**: Compiles standardized `#EXTM3U` playlists for season-level (`season-X.m3u`) and master series-level (`all-seasons.m3u`) playback in VLC, IPTVnator, and MPV.

### 📄 `index.html` & `public/index.html` — Web Application Layout
- **Role**: Semantic HTML5 dashboard featuring:
  - Mode Switcher: Single Episode Mode vs Full Season Mode toggle.
  - `📋 Pick Episode` button: Opens the interactive episode picker modal.
  - Live Terminal Console: Displays streaming execution logs.
  - Video Player: 16:9 HLS.js player with audio track selector and subtitle switchers.
  - MyAnimeList Hub: Live search with English title prioritization and Watchlist importer.
  - Local Storage Explorer: Browse and 1-click play cached anime and playlists.

### 📄 `public/app.js` — Client-Side Application Logic
- **Role**: Manages UI state, HLS.js video binding, audio/sub track population, terminal log streams, and modal interactions.

### 📄 `public/styles.css` — Glassmorphism Design System
- **Role**: Dark OTT user interface styling with CSS custom properties, backdrop filters, and responsive layouts.

---

## 3. Storage Architecture

All scraped metadata and playlists are stored under `storage/`:

```
storage/
├── metadata/                  # Structured JSON metadata per anime & season
│   └── <anime-slug>/
│       └── season-1.json
├── playlists/                 # Standard M3U playlists
│   └── <anime-slug>/
│       ├── season-1.m3u       # Season playlist
│       └── all-seasons.m3u    # Master aggregated series playlist
├── cache/                     # Temporary stream token cache (gitignored)
│   └── <hash>.json
├── logs/                      # Scraper runtime logs (gitignored)
│   └── scraper.log
└── catalog.json               # Top-level index of all scraped anime & episodes
```

---

## 4. API Reference

| Endpoint | Method | Description |
|---|---|---|
| `http://localhost:3050` | `GET` | Main Web OTT Player & Dashboard |
| `http://localhost:3050/api/scrape` | `POST` | Execute scraper job with streaming chunked logs |
| `http://localhost:3050/api/discover` | `GET` | Discover available episodes & English titles from URL |
| `http://localhost:3050/api/match` | `GET` | Match anime title to streaming series source |
| `http://localhost:3050/api/mal/search` | `GET` | Search MyAnimeList with English title mapping |
| `http://localhost:3050/api/mal/user` | `GET` | Fetch MyAnimeList user watchlist |
| `http://localhost:3050/api/catalog` | `GET` | Retrieve stored anime series catalog |
| `http://localhost:3050/api/episodes` | `GET` | Retrieve episodes for a specific anime & season |
| `http://localhost:3050/api/playlists` | `GET` | List generated M3U playlists |
| `http://localhost:3050/proxy/hls` | `GET` | Transparent CORS proxy for HLS streams |

---

## 5. Developer Guidelines

- **Zero External Dependencies**: Keep the server and engine dependency-free (native Node.js modules only).
- **English Title Priority**: When rendering anime titles or searching, always prioritize English titles over Japanese Romaji.
- **Single Episode Integrity**: When single episode mode is triggered, scrape only the targeted episode and do not trigger season sweeps.
