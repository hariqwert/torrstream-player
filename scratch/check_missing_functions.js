const fs = require('fs');
const path = require('path');

const code = fs.readFileSync(path.join(__dirname, '..', 'consumet.html'), 'utf8');

const scriptStart = code.indexOf('<script>');
const jsCode = scriptStart !== -1 ? code.substring(scriptStart + 8) : '';

const requiredFunctions = [
  'switchTab',
  'openSearchPalette',
  'closeSearchPalette',
  'executeSearch',
  'debounceSearch',
  'fetchIMDbItem',
  'scrollShelf',
  'loadMore',
  'applyFilters',
  'filterSports',
  'filterSportsCategory',
  'playCustomM3uStream',
  'handleEpgProviderChange',
  'fetchAndParseEpg',
  'toggleEpgView',
  'filterEpgGrid',
  'closeEpgChannelModal',
  'closeDetailsModal',
  'toggleDetailsTrailerPlay',
  'toggleDetailsTrailerMute',
  'openFullscreenPlayer',
  'openTorrentPlayer',
  'playSelectedTrailer',
  'toggleWatchlist',
  'loadSeasonEpisodes',
  'closePersonDetailsModal',
  'closeFullscreenPlayer',
  'playPreviousEpisode',
  'playNextEpisode',
  'toggleFullscreenTheater',
  'changeServerFromFullscreen',
  'startActualFullscreenPlayback',
  'closeTrailerPopup',
  'closeEpgProgramModal',
  'switchAnimeScheduleDay',
  'searchAndPlayItem',
  'openDetails',
  'openAnimeInfo',
  'handleInfoClick',
  'resolveAndPlayIMDb',
  'renderWatchlist',
  'loadMoviesHomeData',
  'loadTvHomeData',
  'loadAnimeCatalog',
  'loadSportsChannels',
  'fetchAnimeSection'
];

console.log('--- FUNCTION PRESENCE CHECK ---');
requiredFunctions.forEach(fn => {
  const hasFn = new RegExp(`function\\s+${fn}\\b|var\\s+${fn}\\s*=|let\\s+${fn}\\s*=|const\\s+${fn}\\s*=`).test(jsCode);
  console.log(`${fn}: ${hasFn ? 'PRESENT' : 'MISSING'}`);
});
