const https = require('https');

async function testAniListSchedule() {
    const now = Math.floor(Date.now() / 1000);
    const dayStart = now - (now % 86400);
    const dayEnd = dayStart + 86400;

    const query = `
        query ($dayStart: Int, $dayEnd: Int) {
            Page(page: 1, perPage: 12) {
                airingSchedules(airingAt_greater: $dayStart, airingAt_lesser: $dayEnd, sort: TIME_DESC) {
                    airingAt
                    episode
                    media {
                        id
                        title { romaji english }
                        coverImage { large }
                        averageScore
                        episodes
                    }
                }
            }
        }
    `;

    const body = JSON.stringify({ query, variables: { dayStart, dayEnd } });

    const req = https.request('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body)
        }
    }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const json = JSON.parse(data);
            const list = json?.data?.Page?.airingSchedules || [];
            console.log('AniList Airing Schedule Count:', list.length);
            if (list.length > 0) {
                console.log('Sample airing item:', {
                    episode: list[0].episode,
                    title: list[0].media.title.english || list[0].media.title.romaji,
                    poster: list[0].media.coverImage.large
                });
            }
        });
    });

    req.on('error', err => console.error(err));
    req.write(body);
    req.end();
}

testAniListSchedule();
