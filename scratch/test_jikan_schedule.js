const https = require('https');

function testSchedule(day = 'monday') {
  return new Promise(resolve => {
    https.get(`https://api.jikan.moe/v4/schedules?filter=${day}&limit=6`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.data || []);
        } catch(e) {
          resolve([]);
        }
      });
    }).on('error', () => resolve([]));
  });
}

async function run() {
  const items = await testSchedule('monday');
  console.log('Fetched Monday schedule items count:', items.length);
  if (items.length > 0) {
    console.log('Sample item:', {
      title: items[0].title || items[0].title_english,
      images: items[0].images?.jpg?.large_image_url,
      episodes: items[0].episodes,
      broadcast: items[0].broadcast?.string,
      score: items[0].score
    });
  }
}
run();
