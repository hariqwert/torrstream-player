const axios = require('axios');
const fs = require('fs');
async function test() {
  const response = await axios.get('https://raw.githubusercontent.com/mitthu786/tvepg/main/tataplay/epg.xml.gz', { responseType: 'stream' });
  const writeStream = fs.createWriteStream('test.xml');
  response.data.pipe(writeStream);
  writeStream.on('finish', () => {
    console.log('Finished writing, size:', fs.statSync('test.xml').size);
  });
}
test();
