# 🌐 Stalker Pro (Stalker Portal Emulator & Streamer)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-red.svg)](https://github.com//LICENSE)
[![PHP Version](https://img.shields.io/badge/PHP-%3E%3D%207.4-blue.svg)](#)
[![STB Emulation](https://img.shields.io/badge/STB-MAG%20250%2F254%2F270-orange.svg)](#)

A professional, high-performance PHP emulation suite designed to mimic physical Set-Top Boxes (**MAG 250, 254, 270**). It allows developers and power users to authenticate, perform handshakes, bypass strict security parameters, and parse Stalker Portals (`/c/` or `/stalker_portal`). 

Featuring an ultra-premium, dark-themed responsive dashboard, the app lets you manage multiple portal identities via the **Identity Vault**, browse categorized media grids, and stream live contents seamlessly across devices.

---

## 🛑 CRITICAL ADVISORY & COOLDOWN RULES

> [!IMPORTANT]
> ### 1. Handshake Success but Content Grid is Empty?
> If your handshake returns **"HANDSHAKE SUCCESS"** but the discovery grid is blank, the target portal has detected rapid requests and is **rate-limiting** your server's IP. 
> * **The Solution:** Do not spam clicks or refresh! Close the tab and wait **exactly 5 minutes** to allow the remote connection cooldown to expire.
>
> ### 2. Browser Playback Requires Proxy Mode
> * **Standard browsers cannot play raw IPTV streams natively** due to strict CORS and transport protocol policies.
> * If you want to watch streams inside any web browser, you **must select `PROXY: GO WEB PLAYER`** in the routing options.
>
> ### 3. Device Fingerprint Strictness
> Any errors like "Authorization Expired" or "Access Denied" come directly from the remote portal. Ensure your `Device ID 1/2`, `Serial Number (SN)`, and `Signature (SG)` parameters are correctly emulated if the portal uses strict hardware validation.

---

<p align='center'>
  <img src="https://i.ibb.co/0Vj3VTw/download-1.png" alt="Stalker Portal Banner" width="750" />
</p>

<h4 align='center'>
  📺 A local PHP-based engine to emulate MAG hardware, fetch streaming playlists, and pipe live channels.<br>
  Works seamlessly on PC, Mobile, VLC Player, Tivimate, and Smart TVs through your LocalHost server!
</h4>

---

## 🎨 System Walkthrough & Interface Preview

Explore the polished user interface, built with deep contrast aesthetics, micro-interactions, and beautiful negative space.

### 1. Initialization Dashboard
Configure portal URLs, hardware configurations, MAC addresses, and proxy parameters on a modern unified input form.
<img src="https://i.ibb.co/0jyRBbQR/Screenshot-2026-06-25-at-6-12-01-PM.png" alt="Initialization Dashboard" width="100%" class="rounded-3xl border border-white/5 mt-2" />

### 2. Identity Vault (Pinned Default Portal)
Access your saved handshakes instantly. Includes a pinned premium **US Default Portal** at the top and a direct action to configure new credentials.
<img src="https://i.ibb.co/1GLskLr8/Screenshot-2026-06-25-at-6-12-19-PM.png" alt="Identity Vault" width="100%" class="rounded-3xl border border-white/5 mt-2" />

### 3. Identity Switching
Review emulated hardware metrics (API version, serial numbers, models) and switch active handshakes instantly with a single click.
<img src="https://i.ibb.co/LXMbx5SQ/Screenshot-2026-06-25-at-6-12-31-PM.png" alt="Identity Switching" width="100%" class="rounded-3xl border border-white/5 mt-2" />

### 4. Interactive Handshake Success Screen
Receive live validation feedback, expiration dates, parental PIN info, and token credentials parsed in real-time from the portal's core API.
<img src="https://i.ibb.co/XkFf7f8k/Screenshot-2026-06-25-at-6-12-56-PM.png" alt="Handshake Success Screen" width="100%" class="rounded-3xl border border-white/5 mt-2" />

### 5. Content Discovery & Live Channel Grid
Browse categorized streams in a high-density, fully searchable grid. Filter instantly by name, country, or category.
<img src="https://i.ibb.co/KjPJKL3q/Screenshot-2026-06-25-at-6-13-09-PM.png" alt="Content Discovery" width="100%" class="rounded-3xl border border-white/5 mt-2" />

---

## ⚡ Key Highlights & Features

* 📟 **Deep MAG STB Emulation:** Complete emulation profiles for **MAG250**, **MAG254**, and **MAG270** models, complete with customized API versions and validation signatures.
* 🛡️ **Identity Vault (Saved Portals):** Securely save and toggle between multiple active portal sessions without re-entering complex credentials.
* 🇺🇸 **Pre-configured US Default Portal:** Instant, out-of-the-box configuration for a premium public portal (`http://123.geoent.cc/stalker_portal`) built directly into the vault list.
* ➕ **Simplified "+ Add New" Flow:** Quick-action triggers inside the Vault header and footer let you jump right back to custom configuration inputs with zero session friction.
* 👣 **Advanced Device Fingerprinting:** Input custom `Device ID 1`, `Device ID 2`, and device `Signature (SG)` parameters to pass portals enforcing strict authentication filters.
* 🔄 **Flexible Proxy Modes:**
  * **`PROXY: DIRECT` (Recommended):** Pipes direct stream links (`m3u8`/TS) to your player. This routes 100% of video bandwidth directly from the client to the portal, keeping your server lightweight and responsive.
  * **`PROXY: GO WEB PLAYER`:** Relays the stream through your PHP backend. Necessary for playing content inside standard web browsers, but consumes server bandwidth.
* 🔍 **Fast Client-Side Filtering:** Search live channels instantly by typing name fragments (e.g., `Sony`, `HBO`, `Zee`, `Sky`).
* 🎵 **Music Vibes Integration:** Built-in streaming audio player with custom playlists, merging tracks from Audius and Indian streaming platforms (JioSaavn proxy).
* 📺 **Custom M3U Playlist Builder:** Load custom generic M3U playlists, store them offline, switch between Stalker Portals and Custom M3U lists seamlessly. Search live channels instantly by typing name fragments (e.g., `Sony`, `HBO`, `Zee`, `Sky`).
* 📁 **Local Backup Playlists:** Previously extracted channel indexes are backed up under `/data` or downloadable directly as an standard M3U playlist file.

---

## 🛠️ Step-by-Step Environment Setup

To run this emulation engine, you need a web server (such as Apache) with PHP (>= 7.4) and `mod_rewrite` enabled for route matching.

### 📱 Option A: Mobile & Android Setup (using KSWEB)
1. Download and install **KSWEB PRO v3.987** on your Android device:
   👉 [Download KSWEB PRO APK](https://tsneh.vercel.app/ksweb_3.987.apk)
2. Download the project codebase:
   👉 [Stalker-Portal master bundle (ZIP)](https://heads/main.zip)
3. Extract the contents of the ZIP inside your KSWEB root web directory (usually `/sdcard/htdocs/`).
4. Boot up the Apache/PHP server inside the KSWEB app.
5. Visit the link provided on your local host (usually `http://localhost:8080/Stalker-Portal/`).

### 💻 Option B: Desktop & PC Setup (using XAMPP)
1. Download and install **XAMPP Server** (for Windows, macOS, or Linux):
   👉 [Download XAMPP Server](https://www.apachefriends.org/download.html)
2. Download the project codebase ZIP and extract it to your XAMPP installation directory under the `htdocs` folder (e.g., `C:\xampp\htdocs\Stalker-Portal\`).
3. Launch the XAMPP Control Panel and start the **Apache** service.
4. Open your web browser and navigate to:
   👉 `http://localhost/Stalker-Portal/`

---

## 📺 Multi-Device Playback & Streaming Integration

### 1. Smart TVs (Tizen OS, webOS, Android TV)
* Run **KSWEB** on your mobile device as the local server host.
* Connect both your server phone and your Smart TV to the **same Wi-Fi network**.
* Note the Local IP displayed on your KSWEB dashboard (e.g., `http://192.168.1.100:8000`).
* Open the browser app on your Smart TV and navigate to that IP address to load the interactive stream controller.

<p align="center">
  <img src="https://i.ibb.co/K5s5n5d/IMG-20240811-170717.jpg" alt="Smart TV Integration" width="280" class="rounded-2xl border border-white/10" />
</p>

---

### 2. VLC Media Player Integration

We can stream parsed channels in standard players via dynamic M3U playlists generated by the script.

1. Locate the dynamic playlist URL from your portal dashboard or use:
   `http://localhost/Stalker-Portal/playlist.php`
2. Open VLC Media Player and press **Ctrl + N** (Network Stream).
3. Paste the playlist URL into the input field and press **Play**.

<img src="https://i.ibb.co/1nRbLnG/image.png" alt="VLC Stream Open" width="100%" class="rounded-xl border border-white/5 my-2" />

4. Open the playlist manager inside VLC (**View > Docked Playlist**) to view, search, and switch between all the active live channels.

<img src="https://i.ibb.co/kghv1Cc/image.png" alt="VLC Active Channels" width="100%" class="rounded-xl border border-white/5 my-2" />

---

### 3. Dedicated IPTV Apps (TiviMate, OTT Navigator, etc.)
To watch parsed channels with full Electronic Program Guide (EPG) support inside specialized IPTV media clients:
* Add a new **M3U Playlist** source in your IPTV app.
* Enter your local dynamic playlist URL:
  `http://localhost:8000/Stalker-Portal/playlist.php`

---

## 📈 Performance & Bandwidth Warning

> [!WARNING]
> Selecting `PROXY: GO WEB PLAYER` routes all streaming media chunks directly through your server. If hosting on a public VPS or mobile network, this will consume a significant amount of data and bandwidth. Always use **`PROXY: DIRECT`** where possible to stream media directly to your player and offload server resources.

---

## 📬 Contact & Channel Updates

* **📢 Official Telegram Channel:** Join our update pipeline for bug fixes and releases: [Telegram @stalker_github](https://t.me/)
* **✉️ Developer Email:** Send technical bug reports and suggestions to [stalker@pm.me](mailto:stalker@.me)

---

## ⚖️ Academic License & Disclosures

This repository is strictly published as an educational research study analyzing STB protocol handshakes, custom HTTP authorization wrappers, and media stream formatting. The author assumes absolutely no responsibility for any misuse of this codebase, subscription violations, or streaming access issues. 

Distributed under the open-source **[GPL-3.0 License](https://github.com//main/LICENSE)**.

<h4 align='center'>© 2021-2026 Stalker Pro Team</h4>
