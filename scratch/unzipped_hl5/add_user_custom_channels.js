const fs = require('fs');
const path = require('path');

const userChannels = [
  {
    "channel_id": "http://103.253.18.58:8000/play/a00m?http-user-agent=VLC%2F3.0.18",
    "name": "Star Sports 1 HD [MPEG-TS | Port 8000]",
    "genre": "Sports",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_STAR_SPORTS_1_HD/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "http://103.253.18.58:8000/play/a03o?http-user-agent=VLC%2F3.0.18",
    "name": "Star Sports 1 Hindi [MPEG-TS | Port 8000]",
    "genre": "Sports",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_STAR_SPORTS_1_HINDI/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "http://103.253.18.58:8000/play/a00t?http-user-agent=VLC%2F3.0.18",
    "name": "Star Sports 1 Hindi HD [MPEG-TS | Port 8000]",
    "genre": "Sports",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_STAR_SPORTS_1_HINDI_HD/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://d3qs3d2rkhfqrt.cloudfront.net/out/v1/b17adfe543354fdd8d189b110617cddd/index.m3u8",
    "name": "DD Sports SD [Native HLS | CloudFront]",
    "genre": "Sports",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/2/23/DD_Sports_logo_2020.png",
    "source": "custom"
  },
  {
    "channel_id": "https://streams2.sofast.tv/ptnr-yupptv/title-cricketgold/v1/master/611d79b11b77e2f571934fd80ca1413453772ac7/b2048bb8-1686-4432-aa50-647245383e0c/manifest.m3u8",
    "name": "Cricket Gold 24x7 [Native HLS | YuppTV FAST]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/Mh9tKPx.png",
    "source": "custom"
  },
  {
    "channel_id": "https://d36r8jifhgsk5j.cloudfront.net/Willow_TV1080p.m3u8",
    "name": "Willow Sports HD [Native HLS | CloudFront]",
    "genre": "Sports",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Willow_TV_logo.svg/512px-Willow_TV_logo.svg.png",
    "source": "custom"
  },
  {
    "channel_id": "https://d36r8jifhgsk5j.cloudfront.net/Willow_TV.m3u8",
    "name": "Willow Sports Alternate [Native HLS | CloudFront]",
    "genre": "Sports",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Willow_TV_logo.svg/512px-Willow_TV_logo.svg.png",
    "source": "custom"
  },
  {
    "channel_id": "https://xemzi.short.gy/2000006",
    "name": "Sky Sports Cricket HD [Native HLS | Proxy Relay]",
    "genre": "Sports",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/a/a9/Sky_Sports_Cricket_logo_2020.svg/512px-Sky_Sports_Cricket_logo_2020.svg.png",
    "source": "custom"
  },
  {
    "channel_id": "https://tvsen5.aynaott.com/TnMn5kZz8aLm/index.m3u8",
    "name": "T Sports HD [Native HLS | AynaOTT]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/5VOPFzs.png",
    "source": "custom"
  },
  {
    "channel_id": "https://bein-xtra-bein.amagi.tv/playlist.m3u8",
    "name": "beIN SPORTS XTRA [Native HLS | Amagi FAST]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/aH0PCPy.png",
    "source": "custom"
  },
  {
    "channel_id": "https://sportsgrid-tribal.amagi.tv/playlist.m3u8",
    "name": "SportsGrid 24x7 [Native HLS | Amagi FAST]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/CGXC5fp.png",
    "source": "custom"
  },
  {
    "channel_id": "http://59.103.38.46:8000/play/a125/index.m3u8",
    "name": "Unite8 Sports 1 [Native HLS + TS Chunks]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/5VOPFzs.png",
    "source": "custom"
  },
  {
    "channel_id": "http://59.103.38.46:8000/play/a126/index.m3u8",
    "name": "Unite8 Sports 2 [Native HLS + TS Chunks]",
    "genre": "Sports",
    "logo": "https://i.imgur.com/5VOPFzs.png",
    "source": "custom"
  },
  {
    "channel_id": "https://ntv1.akamaized.net/hls/live/2014075/NASA-NTV1-HLS/master.m3u8",
    "name": "NASA UHD 4K [Native HLS | 2160p HEVC]",
    "genre": "4K Ultra HD",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    "source": "custom"
  },
  {
    "channel_id": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    "name": "Big Buck Bunny 4K 60fps [Native HLS | 2160p 60fps]",
    "genre": "4K Ultra HD",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.bip.png",
    "source": "custom"
  },
  {
    "channel_id": "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
    "name": "Tears of Steel 4K UHD [Native HLS | fMP4 2160p]",
    "genre": "4K Ultra HD",
    "logo": "https://upload.wikimedia.org/wikipedia/commons/0/08/Tears_of_Steel_poster.jpg",
    "source": "custom"
  },
  {
    "channel_id": "https://mumt07.tangotv.in/zHjX9OFlTWENTYFOURNEWS/index.m3u8",
    "name": "24 News [Native HLS | TangoTV]",
    "genre": "Malayalam",
    "logo": "https://sund-images.sunnxt.com/202222/300x300_24News_202222_d63feca0-79ae-47ea-b75a-66c17d456f4c.png",
    "source": "custom"
  },
  {
    "channel_id": "https://amg13737-amg13737c1-amgplt0016.playout.now3.amagi.tv/playlist/amg13737-amg13737c1-amgplt0016/playlist.m3u8",
    "name": "Asianet News [Native HLS | Amagi CDN]",
    "genre": "Malayalam",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_ASIANET_NEWS/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://mmtvnews1.akamaized.net/v1/master/673630b269b766886555eebfddd4f27f3de3ab50/mmtvNewsCampaign1/index.m3u8",
    "name": "Manorama News [Native HLS | Akamai CDN]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/adjRrVx.png",
    "source": "custom"
  },
  {
    "channel_id": "https://yuppmedtaorire.akamaized.net/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/mathrubhuminews_nim_https/110322/mathrubhuminews/playlist.m3u8",
    "name": "Mathrubhumi News [Native HLS | Akamai / YuppTV]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/diQftzP.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1469/master.m3u8",
    "name": "Kairali News [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://dtil.tmsimg.com/assets/s143246_ld_h15_aa.png?lock=720x540",
    "source": "custom"
  },
  {
    "channel_id": "https://yuppmedtaorire.akamaized.net/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/janamtv_nim_https/140622/janamtv/playlist.m3u8",
    "name": "Janam TV [Native HLS | Akamai / YuppTV]",
    "genre": "Malayalam",
    "logo": "https://dtil.tmsimg.com/assets/s143221_ld_h15_aa.png?lock=720x540",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1481/master.m3u8",
    "name": "Media One [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_MEDIA_ONE/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://n18syndication.akamaized.net/bpk-tv/News18_Kerala_NW18_MOB/output01/master.m3u8",
    "name": "News18 Kerala [Native HLS | Network18 Akamai]",
    "genre": "Malayalam",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NEWS18_KERALA/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1629/master.m3u8",
    "name": "News Malayalam 24x7 [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_NEWS_MALAYALAM_24X7/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://segment.yuppcdn.net/050522/reporter/playlist.m3u8",
    "name": "Reporter TV [Native HLS | YuppCDN]",
    "genre": "Malayalam",
    "logo": "https://dtil.tmsimg.com/assets/s85096_ld_h15_aa.png?lock=720x540",
    "source": "custom"
  },
  {
    "channel_id": "https://bk7l298nyx53-hls-live.5centscdn.com/realnews/e7dee419f91aa9e65939d3677fb9c4f5.sdp/playlist.m3u8",
    "name": "Real News Kerala [Native HLS | 5centsCDN]",
    "genre": "Malayalam",
    "logo": "https://jiotvimages.cdn.jio.com/dare_images/images/Real_News_Kerala.png",
    "source": "custom"
  },
  {
    "channel_id": "https://ddash74r36xqp.cloudfront.net/master.m3u8",
    "name": "Amrita TV [Native HLS | CloudFront CDN]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/WdSjlPl.png",
    "source": "custom"
  },
  {
    "channel_id": "https://d2lk5u59tns74c.cloudfront.net/out/v1/c313674ffced4c9a90f1bba436df2b9b/index.m3u8",
    "name": "DD Malayalam [Native HLS | CloudFront CDN]",
    "genre": "Malayalam",
    "logo": "https://i.postimg.cc/BZjmjJJs/DD-Malayalam.png",
    "source": "custom"
  },
  {
    "channel_id": "https://yuppmedtaorire.akamaized.net/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/mazhavilmanorama_nim_https/050522/mazhavilmanorama/playlist.m3u8",
    "name": "Mazhavil Manorama [Native HLS | Akamai / YuppTV]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/fjgzW20.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-7.pishow.tv/live/1129/master.m3u8",
    "name": "Mazhavil Manorama HD [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/fjgzW20.png",
    "source": "custom"
  },
  {
    "channel_id": "https://yuppmedtaorire.akamaized.net/v1/master/a0d007312bfd99c47f76b77ae26b1ccdaae76cb1/flowers_nim_https/050522/flowers/playlist.m3u8",
    "name": "Flowers TV USA [Native HLS | Akamai / YuppTV]",
    "genre": "Malayalam",
    "logo": "https://upload.wikimedia.org/wikipedia/ml/1/1c/Flowers-Onam.png",
    "source": "custom"
  },
  {
    "channel_id": "https://mumt03.tangotv.in/Dsly5z3HASIANETMIDDLEEAST/index.m3u8",
    "name": "Asianet Middle East [Direct HTTP MPEG-TS | TangoTV]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/du9iZ0s.png",
    "source": "custom"
  },
  {
    "channel_id": "https://mumt01.tangotv.in/O5aw8Zn3KAIRALI/index.m3u8",
    "name": "Kairali TV [Native HLS | TangoTV CDN]",
    "genre": "Malayalam",
    "logo": "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Kairali_TV.svg/500px-Kairali_TV.svg.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1530/master.m3u8",
    "name": "Kairali We [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://xstreamcp-assets-msp.streamready.in/assets/LIVETV/LIVECHANNEL/LIVETV_LIVETVCHANNEL_KAIRALI_WE/images/LOGO_HD/image.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1467/master.m3u8",
    "name": "Jeevan TV [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://jiotvimages.cdn.jio.com/dare_images/images/Jeevan_TV.png",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-3.pishow.tv/live/1123/master.m3u8",
    "name": "Kappa TV [Native HLS | PiShow CDN]",
    "genre": "Malayalam",
    "logo": "https://jiotvimages.cdn.jio.com/dare_images/images/Kappa_TV.png",
    "source": "custom"
  },
  {
    "channel_id": "https://932y4x26ljv8-hls-live.5centscdn.com/victers/tv.stream/playlist.m3u8",
    "name": "KITE Victers [Native HLS | 5centsCDN]",
    "genre": "Malayalam",
    "logo": "https://i.imgur.com/kj4OEsb.png",
    "source": "custom"
  },
  {
    "channel_id": "https://d1ty2af03alkwd.cloudfront.net/index_4.m3u8",
    "name": "Zee Malayalam News [Native HLS | CloudFront CDN]",
    "genre": "Malayalam",
    "logo": "https://english.cdn.zeenews.com/images/logo/zee-malayalam-17.svg",
    "source": "custom"
  },
  {
    "channel_id": "https://cdn-6.pishow.tv/live/1243/master.m3u8",
    "name": "Chithiram Kids TV [Native HLS | PiShow CDN]",
    "genre": "Kids",
    "logo": "https://i.imgur.com/xv9cWSh.png",
    "source": "custom"
  },
  {
    "channel_id": "https://server.zillarbarta.com/zbcatun/video.m3u8",
    "name": "ZB Cartoon [Native HLS | ZillarBarta CDN]",
    "genre": "Kids",
    "logo": "https://i.imgur.com/z3npqO1.png",
    "source": "custom"
  },
  {
    "channel_id": "https://amg00627-amg00627c23-samsung-in-3870.playouts.now.amagi.tv/playlist/amg00627-banijayfast-mrbeanin-samsungin/playlist.m3u8",
    "name": "Mr. Bean Animated (India) [Native HLS | Amagi FAST]",
    "genre": "Kids",
    "logo": "https://static.wikia.nocookie.net/logopedia/images/2/25/Mr._Bean_Animated_Series_stacked_logo.png",
    "source": "custom"
  }
];

const channelsPath = path.join(__dirname, 'assets', 'channels.json');
let existing = [];
if (fs.existsSync(channelsPath)) {
  existing = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));
}

// Remove any prior custom user channels with same name or channel_id
const nonCustom = existing.filter(c => c.source !== 'custom');
const updated = [...userChannels, ...nonCustom];

fs.writeFileSync(channelsPath, JSON.stringify(updated, null, 2), 'utf-8');
console.log(`[✓] Added ${userChannels.length} user channels. Total catalog count: ${updated.length}`);
