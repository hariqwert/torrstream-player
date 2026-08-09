const { ANIME } = require('@consumet/extensions');
const providers = [
    new ANIME.AnimePahe(),
    new ANIME.AnimeKai(),
    new ANIME.KickAssAnime(),
    new ANIME.AnimeSaturn(),
    new ANIME.AnimeUnity(),
    new ANIME.AnimeSama()
];

(async () => {
    for (const p of providers) {
        try {
            const start = Date.now();
            const res = await p.fetchRecentlyUpdated();
            console.log(p.name, "success", Date.now() - start, "ms");
        } catch(e) {
            console.log(p.name, "failed:", e.message);
        }
    }
})();
