const axios = require('axios');
async function test() {
  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int) {
      Page(page: 1, perPage: 20) {
        airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
          episode
          airingAt
          media {
            id
            title { english romaji }
            coverImage { large }
            averageScore
          }
        }
      }
    }
  `;
  // let's say we want today's schedule
  const now = new Date();
  now.setHours(0,0,0,0);
  const start = Math.floor(now.getTime() / 1000);
  now.setHours(23,59,59,999);
  const end = Math.floor(now.getTime() / 1000);
  
  const res = await axios.post('https://graphql.anilist.co', {
    query,
    variables: { airingAt_greater: start, airingAt_lesser: end }
  });
  console.log(res.data.data.Page.airingSchedules[0]);
}
test();
