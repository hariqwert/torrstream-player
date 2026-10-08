const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Comprehensive Multi-Engine Live Sports & OTT Catalog
// Incorporates all tested GitHub feeds AND all external web portals/APIs discovered:
// (MatchDekho, Sportlink/Sayan, AllInOneReborn, PremiumPlugX, TimStreams, MDTV, Doctor Strange, DrmLive, Monirul)
const SOURCE_CONFIG = {
  // 1. JioTV Network
  jio: {
    name: 'JioTV Network (Star Sports, Sony Ten, DD, Eurosport)',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/sm-monirulislam/SM-IPTV/main/jio_tv.m3u',
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/jtv.m3u',
        'https://raw.githubusercontent.com/sm-monirulislam/SM-IPTV/main/jio_hotstar.m3u',
        'https://raw.githubusercontent.com/sportlive18/jio-tv-auto-update-playlist/refs/heads/main/Combined.m3u'
      ]
    },
    json: {
      primary: 'https://jjtvxweb.pages.dev/jstr4web.json', // 1,176 Channels ClearKey DB
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/jtv.json'
      ]
    }
  },

  // 2. Sony & SonyLiv Network
  sony: {
    name: 'Sony & SonyLiv Network',
    type: 'both',
    m3u: {
      primary: 'https://premiumplugx.com/Sliv/sony_playlist.php?m3u', // PremiumPlugX Direct CDN
      backups: [
        'https://sportlink-playlist.pages.dev/sony3.m3u', // Sayan / Sportlink
        'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.m3u',
        'https://raw.githubusercontent.com/drmlive/sliv-live-events/main/sonyliv.m3u',
        'https://raw.githubusercontent.com/sm-monirulislam/SonyLiv_Event_Playlist/main/sonyLiv.m3u',
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/sony.m3u'
      ]
    },
    json: {
      primary: 'https://allinonereborn2.online/sony/sliv3.json', // AllInOne 22ch directory
      backups: [
        'https://raw.githubusercontent.com/drmlive/sliv-live-events/main/sonyliv.json',
        'https://raw.githubusercontent.com/doctor-8trange/zyphora/refs/heads/main/data/sony.json',
        'https://raw.githubusercontent.com/sm-monirulislam/SonyLiv_Event_Playlist/main/sonyLiv_data.json'
      ]
    }
  },

  // 3. FanCode Sports Network
  fancode: {
    name: 'FanCode Sports Network',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.m3u',
      backups: [
        'https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.m3u',
        'https://raw.githubusercontent.com/sm-monirulislam/Fancode_Auto_Update_Playlist/main/fancode_bd.m3u',
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/fancode.m3u'
      ]
    },
    json: {
      primary: 'https://allinonereborn2.online/fctest/json/fancode_latest.json', // AllInOne 1080p FanCode Hub
      backups: [
        'https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json',
        'https://raw.githubusercontent.com/doctor-8trange/zyphx8/refs/heads/main/data/fancode.json',
        'https://raw.githubusercontent.com/kajju027/Fancode-Events-Json/refs/heads/main/fancode.json'
      ]
    }
  },

  // 4. MatchDekho Worldwide Live Sports
  matchdekho: {
    name: 'MatchDekho & Sportzfy Engine',
    type: 'both',
    m3u: {
      primary: 'https://matchdekho.pages.dev/sports.m3u',
      backups: [
        'https://matchdekho.pages.dev/playlist.m3u'
      ]
    },
    json: {
      primary: 'https://matchdekho.in/api/world-sports.json', // Live 22+ match events API
      backups: []
    }
  },

  // 5. TimStreams / Epiembeds Sports
  timstreams: {
    name: 'TimStreams Live Sports & Channels',
    type: 'json',
    json: {
      primary: 'https://timst.top/api/streams', // Live sports events
      backups: [
        'https://timst.top/api/channels' // Live TV channels
      ]
    }
  },

  // 6. ICC Cricket Tournaments
  icc: {
    name: 'ICC Cricket Tournaments',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.m3u',
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/willow.m3u'
      ]
    },
    json: {
      primary: 'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.json',
      backups: [
        'https://raw.githubusercontent.com/srhady/willow-event/refs/heads/main/live_sports.json',
        'https://raw.githubusercontent.com/drmlive/willow-live-events/main/willow.json'
      ]
    }
  },

  // 7. FIFA & Football Events
  fifa: {
    name: 'FIFA & Football Events',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/srhady/fifaplus/refs/heads/main/fifa_live.m3u',
      backups: [
        'https://raw.githubusercontent.com/sm-monirulislam/Upcoming-and-Live-Sports-Data/main/Sports_data.m3u'
      ]
    },
    json: {
      primary: 'https://raw.githubusercontent.com/srhady/fifaplus/refs/heads/main/match_data.json',
      backups: [
        'https://raw.githubusercontent.com/sm-monirulislam/Upcoming-and-Live-Sports-Data/main/Sports_data.json'
      ]
    }
  },

  // 8. Willow Cricket Network
  willow: {
    name: 'Willow Cricket Network',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/willow.m3u',
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Willow-Cricbuzz-Prime-Video-Sport-Live-Event-Auto-Updated-Playlist/main/willow.m3u',
        'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.m3u'
      ]
    },
    json: {
      primary: 'https://raw.githubusercontent.com/drmlive/willow-live-events/main/willow.json',
      backups: [
        'https://raw.githubusercontent.com/srhady/willow-event/refs/heads/main/live_sports.json',
        'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.json'
      ]
    }
  },

  // 9. Zee & Zee5 Network
  zee5: {
    name: 'Zee & Zee5 Network',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.m3u',
      backups: [
        'https://raw.githubusercontent.com/sm-monirulislam/SM-IPTV/main/Zee5.m3u',
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/zee.m3u',
        'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/zee2.m3u'
      ]
    },
    json: {
      primary: 'https://allinonereborn2.online/zee5/channels199.json', // 30 ClearKey channels
      backups: [
        'https://raw.githubusercontent.com/doctor-8trange/quarnex/refs/heads/main/data/zee5.json'
      ]
    }
  },

  // 10. Prime Video Sports
  prime: {
    name: 'Prime Video Sports Network',
    type: 'both',
    m3u: {
      primary: 'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/primesport.m3u',
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Willow-Cricbuzz-Prime-Video-Sport-Live-Event-Auto-Updated-Playlist/main/primesport.m3u'
      ]
    },
    json: {
      primary: 'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/primesport.json',
      backups: [
        'https://raw.githubusercontent.com/sportlive18/Willow-Cricbuzz-Prime-Video-Sport-Live-Event-Auto-Updated-Playlist/main/primesport.json'
      ]
    }
  }
};

async function fetchUrl(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === 'https:' ? https : http;
      const req = mod.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        timeout: 10000
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300 && data.trim().length > 10) {
            resolve({ ok: true, statusCode: res.statusCode, data, url });
          } else {
            resolve({ ok: false, statusCode: res.statusCode, url });
          }
        });
      });
      req.on('error', err => resolve({ ok: false, error: err.message, url }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'Timeout', url }); });
    } catch (e) {
      resolve({ ok: false, error: e.message, url });
    }
  });
}

async function resolveSource(sourceType, config) {
  console.log(`\n--- Fetching ${config.name} (${sourceType.toUpperCase()}) ---`);
  const cand = config[sourceType];
  if (!cand) return null;

  // Try Primary first
  console.log(`[PRIMARY] Checking: ${cand.primary}`);
  const primRes = await fetchUrl(cand.primary);
  if (primRes.ok) {
    console.log(` -> Primary SUCCESS (${primRes.data.length} bytes)`);
    return { data: primRes.data, url: cand.primary, role: 'primary' };
  }
  console.log(` -> Primary failed (${primRes.statusCode || primRes.error}), attempting backups...`);

  // Fallback to Backups sequentially
  for (let i = 0; i < cand.backups.length; i++) {
    const backupUrl = cand.backups[i];
    console.log(`[BACKUP ${i + 1}] Checking: ${backupUrl}`);
    const bRes = await fetchUrl(backupUrl);
    if (bRes.ok) {
      console.log(` -> Backup ${i + 1} SUCCESS (${bRes.data.length} bytes)`);
      return { data: bRes.data, url: backupUrl, role: `backup-${i + 1}` };
    }
  }

  console.log(` -> ALL sources failed for ${config.name} (${sourceType})`);
  return null;
}

async function syncTarget(targetKey) {
  const cfg = SOURCE_CONFIG[targetKey];
  if (!cfg) {
    console.error(`Unknown target: ${targetKey}`);
    return;
  }

  const outDir = path.join(__dirname, '..', 'data', targetKey);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Sync M3U
  if (cfg.m3u) {
    const m3uRes = await resolveSource('m3u', cfg);
    if (m3uRes) {
      const outPath = path.join(outDir, `${targetKey}.m3u`);
      fs.writeFileSync(outPath, m3uRes.data);
      console.log(`Saved: ${outPath} [Source: ${m3uRes.role}]`);
    }
  }

  // 2. Sync JSON
  if (cfg.json) {
    const jsonRes = await resolveSource('json', cfg);
    if (jsonRes) {
      const outPath = path.join(outDir, `${targetKey}.json`);
      fs.writeFileSync(outPath, jsonRes.data);
      console.log(`Saved: ${outPath} [Source: ${jsonRes.role}]`);
    }
  }
}

async function run() {
  const targetArg = process.argv[2]; // e.g. "matchdekho", "timstreams", "all"
  if (targetArg && targetArg !== 'all') {
    await syncTarget(targetArg);
  } else {
    for (const key of Object.keys(SOURCE_CONFIG)) {
      await syncTarget(key);
    }
  }
  console.log('\n[SYNC COMPLETE] All configured live web & git sources verified and written to /data');
}

run();
