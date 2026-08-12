const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'consumet.html');
let html = fs.readFileSync(filePath, 'utf8');

// Refine loadNewSubsectionsHome with staggered timing
const oldSubsectionFn = `async function loadNewSubsectionsHome() {
    const map = [
        { query: 'Marvel', shelf: 'marvelDcShelf' },
        { genre: '878', shelf: 'scifiOdysseyShelf', type: 'movie' },
        { genre: '14', shelf: 'fantasyDragonsShelf', type: 'movie' },
        { genre: '80', shelf: 'trueCrimeShelf', type: 'movie' },
        { genre: '28', shelf: 'highOctaneActionShelf', type: 'movie' },
        { sort: 'vote_average.desc', shelf: 'oscarWinnersShelf', type: 'movie' },
        { query: 'Star Wars', shelf: 'blockbusterFranchiseShelf' }
    ];

    map.forEach((item, idx) => {
        setTimeout(async () => {
            try {
                if (item.query) {
                    const res = await fetchTMDB('search/multi', { query: item.query });
                    if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, 'movie');
                } else {
                    const params = { page: 1 };
                    if (item.genre) params.with_genres = item.genre;
                    if (item.sort) params.sort_by = item.sort;
                    const res = await fetchTMDB(\`discover/\${item.type}\`, params);
                    if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, item.type);
                }
            } catch(e) {}
        }, idx * 120);
    });
}`;

const newSubsectionFn = `async function loadNewSubsectionsHome() {
    const map = [
        { genre: '28,878', shelf: 'marvelDcShelf', type: 'movie' },
        { genre: '878', shelf: 'scifiOdysseyShelf', type: 'movie' },
        { genre: '14', shelf: 'fantasyDragonsShelf', type: 'movie' },
        { genre: '80', shelf: 'trueCrimeShelf', type: 'movie' },
        { genre: '28', shelf: 'highOctaneActionShelf', type: 'movie' },
        { sort: 'vote_average.desc', shelf: 'oscarWinnersShelf', type: 'movie' },
        { genre: '12,878', shelf: 'blockbusterFranchiseShelf', type: 'movie' }
    ];

    map.forEach((item, idx) => {
        setTimeout(async () => {
            try {
                const params = { page: 1 };
                if (item.genre) params.with_genres = item.genre;
                if (item.sort) params.sort_by = item.sort;
                const res = await fetchTMDB(\`discover/\${item.type}\`, params);
                if (res && res.results) renderShelfGrid(res.results.slice(0, 15), item.shelf, item.type);
            } catch(e) {}
        }, idx * 100);
    });
}`;

html = html.replace(oldSubsectionFn, newSubsectionFn);

fs.writeFileSync(filePath, html, 'utf8');
console.log('Updated loadNewSubsectionsHome in consumet.html');
