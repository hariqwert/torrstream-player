# AnimeStream Scraper 🎌

> Automated Anime HLS Video Scraper, M3U Playlist Generator & Web Player with MyAnimeList Integration.

---

## ✨ Features

- 🎯 **Targeted Single Episode & Full Season Scraping**: Scrape an entire season or pick a single specific episode.
- 📋 **Interactive Episode Picker**: Browse all episodes by number with official English titles and launch playback in 1 click.
- 🌐 **MyAnimeList & Kitsu Integration**: Automatically resolves native Japanese Romaji (e.g. *Ore dake Level Up na Ken*) to English titles (*Solo Leveling*).
- 📺 **OTT HLS Web Player**: Integrated HLS.js player with multi-audio and multi-subtitle track selectors.
- 📁 **Automated Storage Filesystem**: Organizes anime metadata into JSON catalogs and compiles standard `.m3u` / `.m3u8` playlists ready for VLC, IPTVnator, or MPV.
- ⚡ **Cache & Token Aware**: Re-uses valid unexpired stream tokens to eliminate duplicate scrapes and avoid rate limits.
- 🚀 **Zero Dependencies**: Powered entirely by native Node.js APIs without bulky npm dependencies.

---

## 🚀 Quick Start

### 1. Start Web Player Server
```bash
npm start
# or: node server.js
```
Open [http://localhost:3050](http://localhost:3050) in your browser.

### 2. Command-Line Interface (CLI)

```bash
# Scrape a single specific episode:
node cli.js episode https://animesalt.cx/episode/one-piece-21x1155/ 1155

# Scrape an entire season:
node cli.js scrape https://animesalt.cx/episode/one-piece-21x1155/

# List all stored anime and playlists:
node cli.js list

# View storage status:
node cli.js status

# Clean expired cache tokens:
node cli.js clean
```

---

## 📖 Technical Documentation

For in-depth architecture, developer guidelines, and AI agent instructions, see [AGENTS.md](AGENTS.md).

---

## 📄 License

MIT © [hariqwert](https://github.com/hariqwert)
