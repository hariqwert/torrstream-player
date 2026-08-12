async function testKinoCheckParams() {
    try {
        console.log('Testing KinoCheck API with language=en parameter...');
        const res1 = await fetch('https://api.kinocheck.com/movies?tmdb_id=19995&language=en');
        const data1 = await res1.json();
        console.log('KinoCheck English Result YouTube ID:', data1.trailer?.youtube_video_id);

        console.log('\nTesting KinoCheck API for TMDB Movie 550 (Fight Club)...');
        const res2 = await fetch('https://api.kinocheck.com/movies?tmdb_id=550');
        const data2 = await res2.json();
        console.log('KinoCheck Fight Club Result YouTube ID:', data2.trailer?.youtube_video_id);
    } catch(e) {
        console.error('KinoCheck API Test Error:', e);
    }
}

testKinoCheckParams();
