async function testKinoCheck() {
    try {
        console.log('Testing KinoCheck API for TMDB Movie 19995 (Avatar)...');
        const res1 = await fetch('https://api.kinocheck.com/movies?tmdb_id=19995');
        const data1 = await res1.json();
        console.log('KinoCheck Movie Result:', JSON.stringify(data1, null, 2).substring(0, 500));

        console.log('\nTesting KinoCheck API for TMDB Show 1396 (Breaking Bad)...');
        const res2 = await fetch('https://api.kinocheck.com/shows?tmdb_id=1396');
        const data2 = await res2.json();
        console.log('KinoCheck Show Result:', JSON.stringify(data2, null, 2).substring(0, 500));
    } catch(e) {
        console.error('KinoCheck API Test Error:', e);
    }
}

testKinoCheck();
