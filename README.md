# TorrStream — Instant Magnet Video Player

TorrStream is a web-based video player interface for streaming torrent magnet links directly in your browser without waiting for the full file download, powered by [yourok/torrserver](https://github.com/yourok/torrserver).

![TorrStream Preview](index.html)

## Features

- **⚡ Instant Playback**: Paste any torrent magnet link and start streaming video immediately.
- **🎬 Integrated TorrServer Engine**: Automatically manages background BitTorrent engine and streaming on port `8090`.
- **📊 Real-time Stats**: Live overlay showing download speed, connected seeders/leechers, active peers, and prebuffer percentage.
- **📂 Torrent File Explorer**: View all video, audio, and subtitle files inside a multi-file torrent and switch files with 1 click.
- **✨ Open Source Movie Demos**: Pre-configured 1-click sample magnets (Sintel, Big Buck Bunny, Tears of Steel) to test instantly.
- **🎨 Glassmorphic Dark Aesthetics**: Deep dark responsive UI with glowing controls and status badges.

## Quick Start

### 1. Launch TorrStream
To start both TorrServer engine and the Web Player:

```bash
node start-player.js
```
*(or double-click `start-player.js`)*

The player will open in your default web browser at:
👉 **`http://localhost:3000`**

### 2. Paste Magnet Link
Paste any magnet link into the search bar and click **Instant Play** or click one of the demo movie chips!

---

## Architecture & Repositories

- `torrserver/` — Official cloned repository from `https://github.com/yourok/torrserver`.
- `bin/TorrServer.exe` — Windows 64-bit prebuilt binary executable.
- `index.html` & `styles.css` & `app.js` — Frontend Web Player app.
- `start-player.js` — Full-stack runner script.
