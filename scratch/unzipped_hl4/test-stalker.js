"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stalkerAPI_1 = require("./src/stalkerAPI");
async function test() {
    const url = 'https://xameleon.phantemlis.top/three/secure/f35398505ad1162023b896c2d5350cfb/1786377591/premium51/index.m3u8';
    const headers = ['Referer: https://hamis.romponalis.st/', 'Origin: https://hamis.romponalis.st/'];
    const res = await stalkerAPI_1.StalkerAPI.stalkerRequest(url, headers, 'GET', null, true);
    console.log(res.STALKER.info.http_code);
    console.log(res.STALKER.data.length);
    console.log(res.STALKER.data.substring(0, 100));
}
test();
