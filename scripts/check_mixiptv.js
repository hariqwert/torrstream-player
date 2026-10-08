const https = require('https');
https.get('https://raw.githubusercontent.com/sportlive18/jio-tv-auto-update-playlist/refs/heads/main/mixiptv.m3u', res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const lines = data.split('\n');
    let curName = '', curGroup = '', curKey = '', curCookie = '', curHeaders = '';
    const channels = [];
    lines.forEach(l => {
      l = l.trim();
      if (l.startsWith('#EXTINF:')) {
        const gm = l.match(/group-title="([^"]*)"/i);
        curGroup = gm ? gm[1] : '';
        const comma = l.lastIndexOf(',');
        curName = comma !== -1 ? l.substring(comma+1) : '';
      } else if (l.startsWith('#KODIPROP:inputstream.adaptive.license_key=')) {
        curKey = l.replace('#KODIPROP:inputstream.adaptive.license_key=', '').trim();
      } else if (l.startsWith('#EXTVLCOPT:http-cookie=')) {
        curCookie = l.replace('#EXTVLCOPT:http-cookie=', '').trim();
      } else if (l.startsWith('#KODIPROP:inputstream.adaptive.stream_headers=')) {
        curHeaders = l.replace('#KODIPROP:inputstream.adaptive.stream_headers=', '').trim();
      } else if (l.startsWith('http://') || l.startsWith('https://')) {
        channels.push({
          name: curName,
          group: curGroup,
          url: l,
          key: curKey,
          cookie: curCookie,
          headers: curHeaders,
          isMpd: l.includes('.mpd')
        });
        curKey = ''; curCookie = ''; curHeaders = '';
      }
    });

    console.log('Total Channels:', channels.length);
    console.log('\n--- JIO TV+ SPORTS CHANNELS ---');
    channels.filter(c => c.group.toLowerCase().includes('sport')).forEach(c => {
      console.log(`[${c.name}] MPD: ${c.isMpd} | Key: ${c.key ? 'YES' : 'NO'} | Cookie: ${c.cookie ? 'YES' : 'NO'}`);
      console.log(`   URL: ${c.url}`);
      if (c.key) console.log(`   Key: ${c.key}`);
      if (c.cookie) console.log(`   Cookie: ${c.cookie.substring(0, 40)}...`);
    });

    console.log('\n--- SONY LIV / OTHER SPORTS CHANNELS ---');
    channels.filter(c => !c.group.toLowerCase().includes('sport') && (c.name.toLowerCase().includes('ten') || c.name.toLowerCase().includes('sony'))).slice(0, 15).forEach(c => {
      console.log(`[${c.name}] (${c.group}) MPD: ${c.isMpd} | Key: ${c.key ? 'YES' : 'NO'}`);
    });
  });
});
