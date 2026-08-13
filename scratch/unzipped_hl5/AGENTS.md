# 🤖 Stalker Pro AI instructions, Hosting & Project Architecture Guide

This guide is designed for AI developers, agents, and system administrators to understand the **Stalker Pro** codebase, how to host it, what actions must be taken after cloning, its project architecture, and other helpful resources.

---

## 🛠️ Architecture Evolution: PHP to Node.js (TypeScript)

Stalker Pro has evolved from a pure PHP application into a modern **Node.js (Express + TypeScript)** architecture. 
To maintain backward compatibility with the frontend structure, the legacy `.php` files (`index.php`, `play.php`, `login.php`) are now utilized purely as **HTML templates**. 
The Express server strips out any PHP tags on the fly and serves them as static HTML. 
The core backend logic (handshakes, proxying, decryption) has been entirely rewritten into TypeScript.

---

## 🚀 How to Host Stalker Pro (Hosting Instructions)

### 1. Requirements
* **Node.js**: version `18.x` or higher (tested with Node `22.x`).
* **Package Manager**: `npm` or `yarn`.

### 2. Local & Direct Hosting
To run the high-performance Express server locally:

```bash
# Install dependencies
npm install

# Start the server (runs via tsx on port 3000)
npm start
```
The server will automatically bind to `0.0.0.0:3000`.

### 3. Docker Container Deployment
Stalker Pro comes pre-configured with a highly efficient Docker environment based on Node.js.

**Build the image:**
```bash
docker build -t stalker-pro .
```

**Run the container:**
```bash
docker run -d \
  -p 3000:3000 \
  -e PORT=3000 \
  --name stalker-player \
  --restart unless-stopped \
  stalker-pro
```

---

## 📂 Project Directory & File Structure

Here is the comprehensive map of the workspace root and essential folders:

```text
/
├── .env.example                     # Reference template for configuration variables
├── Dockerfile                       # Node.js container build configuration
├── package.json                     # Node.js dependencies and scripts
├── server.ts                        # Main Express application entry point & router
│
├── src/                             # TypeScript Backend Logic
│   ├── stalkerAPI.ts                # Core Stalker portal API connector, IPTV client, and crypto logic
│   ├── proxy.ts                     # Dynamic TS proxy, HLS playlist builder, and decryption engine
│   └── routes/                      # Express route definitions (e.g., admin routes)
│
├── index.php                        # (Template) Interactive web portal dashboard (channels list, groups, search)
├── play.php                         # (Template) High-performance HLS video player (Plyr + Hls.js)
├── login.php                        # (Template) Config login dashboard for connecting portal credentials
│
├── doctor_strange/                  # Credentials, login states, and playlist config directory (protected JSON storage)
│   ├── admin_db.json                # Admin portal configurations
│   ├── genre.json                   # Cached genre categories
│   ├── iptv_logo_map.json           # Cached channel-to-logo mapping
│   ├── live.stalker                 # Session caching
│   └── token.stalker                # Cache of handshake security token
│
├── cache_stalker/                   # Ephemeral caching for channels, genres, and stream links (protected)
└── assets/                          # Custom UI logos, fallback vectors, and branding styles
```

---

## 🔑 Core Components Deep Dive

* **`server.ts`**: The application gateway. It intercepts requests, serves static files, renders the `.php` templates using `servePhpFile()`, and blocks unauthorized direct access to sensitive directories like `/doctor_strange/`.
* **`src/stalkerAPI.ts`**: Handshakes with standard external portals, handles authentication tokens, retrieves channel collections, logs actions, and populates category lists. 
* **`src/proxy.ts`**: Core video streaming pipeline. It proxies the binary data with correct mime-types (`video/MP2T`, `application/x-mpegURL`) while stripping CORS limits.
* **`index.php` (Frontend)**: Fully polished, interactive search-friendly grid layout with auto-fallback logos retrieved from the `iptv-org` community database. It features a built-in **Audius+JioSaavn streaming music player** and a custom **M3U Playlist Manager** storing generic playlists directly in IndexedDB.
* **`play.php` (Frontend)**: Built with **Tailwind CSS**, **Plyr**, and **Hls.js**. Includes responsive channel banners, keyboard shortcuts, live error handling, manual fallback recovery, and picture-in-picture modes.

---

## 💡 Developer Tips & Troubleshooting

1. **How to test streaming locally**:
   - Clear cached files in `cache_stalker/` to force Stalker Pro to run fresh portal queries if streams fail.
2. **CORS and Stream Blockages**:
   - The application automatically acts as an inline reverse proxy to bypass CORS restrictions. All streams should be routed through the `/live.php` Express handler (`src/proxy.ts`).
3. **Template Rendering**:
   - Do not write PHP code inside the `.php` files anymore. They are parsed as HTML strings. Any dynamic values are injected via basic string replacements in the `servePhpFile()` function inside `server.ts`.
