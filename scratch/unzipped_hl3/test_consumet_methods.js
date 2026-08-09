const { ANIME } = require('@consumet/extensions');
console.log(Object.keys(ANIME));
const provider = new ANIME.Hianime();
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(provider)));
