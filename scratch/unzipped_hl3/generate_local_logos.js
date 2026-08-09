const fs = require('fs');
const path = require('path');

const logosDir = path.join(__dirname, 'assets', 'logos');
if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
}

// Function to generate high-definition vector SVG for TV channels
function generateChannelSvg(name, primaryColor, textColor, text, subtext = '', shape = 'rounded') {
    const safeText = text || name;
    
    let shapeContent = '';
    if (shape === 'circle') {
        shapeContent = `<circle cx="250" cy="250" r="230" fill="${primaryColor}" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>`;
    } else {
        shapeContent = `<rect x="15" y="15" width="470" height="470" rx="60" fill="${primaryColor}" stroke="rgba(255,255,255,0.15)" stroke-width="8"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="#090d16"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="10" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="500" height="500" rx="60" fill="url(#grad)" />
  <rect x="10" y="10" width="480" height="480" rx="50" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4"/>
  <g text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif">
    <text x="250" y="${subtext ? 230 : 270}" fill="${textColor}" font-size="${safeText.length > 12 ? '42' : (safeText.length > 8 ? '54' : '72')}" font-weight="900" letter-spacing="-1" filter="url(#glow)">${safeText}</text>
    ${subtext ? `<text x="250" y="320" fill="#e2e8f0" font-size="32" font-weight="800" letter-spacing="3" opacity="0.9">${subtext}</text>` : ''}
  </g>
</svg>`;
}

// Custom specialized SVG generators for accurate brand representations
const customSvgs = {
  'abc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#000000"/><circle cx="250" cy="250" r="210" fill="#000000" stroke="#333333" stroke-width="8"/><text x="250" y="290" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="160" font-weight="900" letter-spacing="-8">abc</text></svg>`,
  
  'a_and_e': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#111111"/><rect x="40" y="140" width="420" height="220" rx="20" fill="#cc0000"/><text x="250" y="295" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial, sans-serif" font-size="140" font-weight="bold" letter-spacing="2">A&amp;E</text></svg>`,

  'bein_sports': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#5c2d91"/><text x="250" y="240" text-anchor="middle" fill="#ffffff" font-family="'Helvetica Neue', Arial, sans-serif" font-size="80" font-weight="900" letter-spacing="-2">beIN</text><text x="250" y="330" text-anchor="middle" fill="#fbba00" font-family="'Helvetica Neue', Arial, sans-serif" font-size="70" font-weight="900" letter-spacing="4">SPORTS</text></svg>`,

  'espn': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#cd1017"/><text x="250" y="285" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial Black, sans-serif" font-size="150" font-style="italic" font-weight="900" letter-spacing="-4">ESPN</text><line x1="50" y1="210" x2="450" y2="210" stroke="#cd1017" stroke-width="16"/></svg>`,

  'dazn': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#080808"/><rect x="60" y="120" width="380" height="260" fill="#f8f8f8" rx="10"/><text x="250" y="290" text-anchor="middle" fill="#080808" font-family="Arial Black, sans-serif" font-size="110" font-weight="900" letter-spacing="-2">DAZN</text></svg>`,

  'fox_sports': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#002244"/><text x="250" y="220" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial, sans-serif" font-size="120" font-weight="900">FOX</text><text x="250" y="320" text-anchor="middle" fill="#ffcc00" font-family="Arial Black, sans-serif" font-size="70" font-weight="900" letter-spacing="2">SPORTS</text></svg>`,

  'tnt': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#000000"/><circle cx="250" cy="250" r="190" fill="#000000" stroke="#ffffff" stroke-width="24"/><text x="250" y="295" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" letter-spacing="-5">TNT</text></svg>`,

  'tsn': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#d01110"/><text x="250" y="285" text-anchor="middle" fill="#ffffff" font-family="Impact, Arial, sans-serif" font-size="160" font-style="italic" font-weight="900" letter-spacing="-3">TSN</text></svg>`,

  'starz': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#000000"/><text x="250" y="285" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="100" font-weight="900" letter-spacing="6">STARZ</text></svg>`,

  'cinemax': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#0f0f0f"/><rect x="50" y="160" width="400" height="180" fill="#ffcc00" rx="20"/><text x="250" y="285" text-anchor="middle" fill="#000000" font-family="Impact, Arial Black, sans-serif" font-size="95" font-weight="900" letter-spacing="2">CINEMAX</text></svg>`,

  'bbc_america': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#111111"/><g transform="translate(85, 140)"><rect x="0" y="0" width="100" height="100" fill="#ffffff"/><text x="50" y="75" text-anchor="middle" fill="#000" font-family="Arial Black" font-size="70">B</text><rect x="115" y="0" width="100" height="100" fill="#ffffff"/><text x="165" y="75" text-anchor="middle" fill="#000" font-family="Arial Black" font-size="70">B</text><rect x="230" y="0" width="100" height="100" fill="#ffffff"/><text x="280" y="75" text-anchor="middle" fill="#000" font-family="Arial Black" font-size="70">C</text></g><text x="250" y="340" text-anchor="middle" fill="#00a0e9" font-family="Arial Black, sans-serif" font-size="48" font-weight="900" letter-spacing="4">AMERICA</text></svg>`,

  'cbs': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#0d1b2a"/><path d="M250 140 C140 140 50 250 50 250 C50 250 140 360 250 360 C360 360 450 250 450 250 C450 250 360 140 250 140 Z" fill="none" stroke="#ffffff" stroke-width="24"/><circle cx="250" cy="250" r="60" fill="#ffffff"/><text x="250" y="420" text-anchor="middle" fill="#ffffff" font-family="Arial Black" font-size="50" font-weight="900">CBS</text></svg>`,

  'cnbc': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#051923"/><text x="250" y="270" text-anchor="middle" fill="#00a8e8" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" letter-spacing="-2">CNBC</text></svg>`,

  'disney_xd': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#101010"/><text x="250" y="220" text-anchor="middle" fill="#ffffff" font-family="'Comic Sans MS', Arial, sans-serif" font-size="60" font-weight="bold">Disney</text><text x="250" y="350" text-anchor="middle" fill="#00ff66" font-family="Impact, Arial Black, sans-serif" font-size="140" font-weight="900">XD</text></svg>`,

  'nat_geo_wild': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" rx="60" fill="#000000"/><rect x="60" y="80" width="380" height="340" fill="none" stroke="#ffcc00" stroke-width="20"/><text x="250" y="210" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="42" font-weight="900">NATIONAL</text><text x="250" y="265" text-anchor="middle" fill="#ffffff" font-family="Arial Black, sans-serif" font-size="42" font-weight="900">GEOGRAPHIC</text><text x="250" y="350" text-anchor="middle" fill="#ffcc00" font-family="Impact, Arial Black, sans-serif" font-size="70" font-weight="900">WILD</text></svg>`
};

// Generate files for all 51 user channels
const channelMap = {
  'abc_usa': customSvgs['abc'],
  'abc_ny_usa': customSvgs['abc'],
  'a_and_e_usa': customSvgs['a_and_e'],
  'bein_sports_mena_english_2': customSvgs['bein_sports'],
  'bein_sports_1_france': customSvgs['bein_sports'],
  'bein_sports_2_france': customSvgs['bein_sports'],
  'bein_sports_3_france': customSvgs['bein_sports'],
  'bein_sports_1_turkey': customSvgs['bein_sports'],
  'bein_sports_2_turkey': customSvgs['bein_sports'],
  'bein_sports_3_turkey': customSvgs['bein_sports'],
  'bein_sports_4_turkey': customSvgs['bein_sports'],
  'astro_supersport_3': generateChannelSvg('Astro SuperSport 3', '#004b87', '#ffffff', 'ASTRO', 'SUPER SPORT 3'),
  'astro_supersport_4': generateChannelSvg('Astro SuperSport 4', '#004b87', '#ffffff', 'ASTRO', 'SUPER SPORT 4'),
  'astro_cricket': generateChannelSvg('Astro Cricket', '#0f5132', '#ffc107', 'ASTRO', 'CRICKET'),
  'dazn_2_spain': customSvgs['dazn'],
  'arena_sport_2_serbia': generateChannelSvg('Arena Sport 2', '#003366', '#ffffff', 'ARENA', 'SPORT 2'),
  'arena_sport_2_croatia': generateChannelSvg('Arena Sport 2', '#003366', '#ffffff', 'ARENA', 'SPORT 2'),
  'espn_brasil': customSvgs['espn'],
  'fox_sports_2_usa': customSvgs['fox_sports'],
  'fox_sports_503_au': customSvgs['fox_sports'],
  'fanduel_sports_network_midwest': generateChannelSvg('FanDuel Sports', '#0052ff', '#ffffff', 'FANDUEL', 'SPORTS'),
  'sportsnet_one': generateChannelSvg('Sportsnet One', '#002b49', '#e31837', 'SPORTSNET', 'ONE'),
  'sportsnet_360': generateChannelSvg('Sportsnet 360', '#002b49', '#e31837', 'SPORTSNET', '360'),
  'supersport_variety_1': generateChannelSvg('SuperSport Variety 1', '#002244', '#00a3e0', 'SUPER', 'SPORT V1'),
  'tsn5': customSvgs['tsn'],
  'tnt_usa': customSvgs['tnt'],
  'starz': customSvgs['starz'],
  'cinemax_usa': customSvgs['cinemax'],
  'mgm_plus_usa_epix': generateChannelSvg('MGM+', '#111111', '#d4af37', 'MGM+', 'HOLLYWOOD'),
  'showtime_showcase_usa': generateChannelSvg('Showtime', '#8b0000', '#ffffff', 'SHOWTIME', 'SHOWCASE'),
  'bbc_america_bbca': customSvgs['bbc_america'],
  'bet_usa': generateChannelSvg('BET', '#000000', '#ffffff', 'BET', 'NETWORK'),
  'cnbc_usa': customSvgs['cnbc'],
  'ctv_canada': generateChannelSvg('CTV', '#0055a5', '#ffffff', 'CTV', 'CANADA'),
  'cbsny_usa': customSvgs['cbs'],
  'canal5_mx': generateChannelSvg('Canal 5', '#e60012', '#ffffff', 'CANAL 5', 'MEXICO'),
  'sport_1_cz': generateChannelSvg('Sport 1', '#cc0000', '#ffffff', 'SPORT 1', 'HD'),
  'joj_sport_sk': generateChannelSvg('JOJ Sport', '#ff6600', '#ffffff', 'JOJ', 'ŠPORT'),
  'discovery_life_channel': generateChannelSvg('Discovery Life', '#003366', '#ffffff', 'DISCOVERY', 'LIFE'),
  'disney_xd': customSvgs['disney_xd'],
  'racer_tv_usa': generateChannelSvg('Racer TV', '#111111', '#ffcc00', 'RACER', 'TV USA'),
  'nbc_sports_philadelphia': generateChannelSvg('NBC Sports', '#000000', '#00a8e8', 'NBC', 'SPORTS PHILLY'),
  'nat_geo_wild_usa': customSvgs['nat_geo_wild'],
  'reelz_channel': generateChannelSvg('Reelz', '#800000', '#ffffff', 'REELZ', 'CHANNEL'),
  'sport_5_plus_israel': generateChannelSvg('Sport 5 Plus', '#0033a0', '#ffffff', 'SPORT 5', 'PLUS'),
  'sport_5_live_israel': generateChannelSvg('Sport 5 Live', '#0033a0', '#ffffff', 'SPORT 5', 'LIVE'),
  'sport_5_star_israel': generateChannelSvg('Sport 5 Star', '#0033a0', '#ffffff', 'SPORT 5', 'STAR'),
  'tv4_sport_live_3': generateChannelSvg('TV4 Sport Live 3', '#e2001a', '#ffffff', 'TV4', 'SPORT LIVE 3'),
  'v_sport_motor_sweden': generateChannelSvg('V Sport Motor', '#00142e', '#ff0033', 'V SPORT', 'MOTOR'),
  'fox_weather_channel': generateChannelSvg('Fox Weather', '#002244', '#00d2ff', 'FOX', 'WEATHER'),
  'eurosport_1_spain': generateChannelSvg('EuroSport 1', '#001c38', '#3b82f6', 'EUROSPORT', '1 SPAIN')
};

for (const [filename, svgContent] of Object.entries(channelMap)) {
    const filePath = path.join(logosDir, `${filename}.svg`);
    fs.writeFileSync(filePath, svgContent, 'utf8');
}

console.log(`Generated ${Object.keys(channelMap).length} high-definition vector logos in /assets/logos/!`);
