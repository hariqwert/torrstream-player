/**
 * MDTV Sports Scraper & Stream Resolver Engine
 * Compatible with TorrStream, Stalker Pro, and Kodi InputStream Adaptive
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PRIMARY_FEED = 'https://jjtvxweb.pages.dev/jstr4web.json';
const FALLBACK_FEED = 'https://allinonereborn2.online/sony/sliv3.json';

const SLUG_MAP = {
  'ss1': '1106',
  'star1': '1106',
  'star-sports-1': '1106',
  'ss1-hindi': '1107',
  'ss2': '1108',
  'star2': '1108',
  'ten1': '162',
  'sony-ten-1': '162',
  'ten2': '891',
  'sony-ten-2': '891',
  'ten3': '892',
  'sony-ten-3': '892',
  'ten4': '893',
  'sony-ten-4': '893',
  'ten5': '894',
  'sony-ten-5': '894',
  'ddsports': '204',
  'dd-sports': '204',
  'eurosport': '875',
  'willow': 'willow-1080p'
};

// Verified Direct CDN fallback streams
const DIRECT_BACKUPS = {
  '162': ['https://drk6xq0vhn.gpcdn.net/live/ten_1_hd_720/index.m3u8', 'https://premiumplugx.com/Sliv/sony_playlist.php?m3u'],
  '891': ['https://drk6xq0vhn.gpcdn.net/live/ten_2_hd_720/index.m3u8'],
  '894': ['https://drk6xq0vhn.gpcdn.net/live/ten_5_hd_720/index.m3u8'],
  'willow-1080p': ['https://d36r8jifhgsk5j.cloudfront.net/Willow_TV1080p.m3u8', 'https://d36r8jifhgsk5j.cloudfront.net/Willow_TV540p.m3u8']
};

let cachedChannels = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min TTL

function fetchJson(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function fetchMdtvChannels() {
  const now = Date.now();
  if (cachedChannels && (now - lastCacheTime < CACHE_TTL_MS)) {
    return cachedChannels;
  }

  let data = await fetchJson(PRIMARY_FEED);
  if (!data || !Array.isArray(data)) {
    // Check local snapshot
    const localSnap = path.join(__dirname, 'data', 'jio', 'jio.json');
    if (fs.existsSync(localSnap)) {
      try { data = JSON.parse(fs.readFileSync(localSnap, 'utf8')); } catch(e) {}
    }
  }

  if (Array.isArray(data)) {
    // Filter sports and major channels
    const sports = data.filter(c => 
      /sport/i.test(c.category) || 
      /sport|ten|star|dd|willow|euro/i.test(c.name)
    ).map(c => ({
      id: String(c.id),
      name: c.name,
      category: c.category || 'Sports',
      logo: c.logo || '',
      stream_url: c.url || c.stream_url || '',
      drm: {
        type: 'clearkey',
        key_id: c.keyId || (c.keys && c.keys[0] && c.keys[0].kid) || '',
        key: c.key || (c.keys && c.keys[0] && c.keys[0].k) || ''
      },
      backup_streams: DIRECT_BACKUPS[String(c.id)] || []
    }));

    cachedChannels = sports;
    lastCacheTime = now;
    return cachedChannels;
  }

  return [];
}

async function resolveMdtvStream(idOrSlug) {
  const channels = await fetchMdtvChannels();
  const searchId = SLUG_MAP[String(idOrSlug).toLowerCase()] || String(idOrSlug);
  
  const found = channels.find(c => 
    c.id === searchId || 
    c.name.toLowerCase().includes(String(idOrSlug).toLowerCase())
  );

  if (found) {
    return {
      id: found.id,
      name: found.name,
      logo: found.logo,
      streamUrl: found.stream_url,
      drm: found.drm,
      backupStreams: found.backup_streams || DIRECT_BACKUPS[found.id] || []
    };
  }

  // Check if it's one of direct backups
  if (DIRECT_BACKUPS[searchId]) {
    return {
      id: searchId,
      name: `Stream ${searchId}`,
      streamUrl: DIRECT_BACKUPS[searchId][0],
      drm: null,
      backupStreams: DIRECT_BACKUPS[searchId]
    };
  }

  return null;
}

async function generateMdtvM3u(baseUrl) {
  const channels = await fetchMdtvChannels();
  let m3u = '#EXTM3U\n';

  for (const ch of channels) {
    const playUrl = `${baseUrl}/player/mdtv?id=${ch.id}`;
    m3u += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.category}",${ch.name}\n`;
    if (ch.drm && ch.drm.key_id && ch.drm.key) {
      m3u += `#KODIPROP:inputstream.adaptive.manifest_type=mpd\n`;
      m3u += `#KODIPROP:inputstream.adaptive.license_type=clearkey\n`;
      m3u += `#KODIPROP:inputstream.adaptive.license_key=${ch.drm.key_id}:${ch.drm.key}\n`;
    }
    m3u += `${playUrl}\n`;
  }

  return m3u;
}

module.exports = {
  fetchMdtvChannels,
  resolveMdtvStream,
  generateMdtvM3u,
  SLUG_MAP
};
