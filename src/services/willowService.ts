import axios from 'axios';
import { fetchPrimeEvents, PrimeEvent } from './primeService';

export interface WillowEvent {
    id: string;
    matchId: string;
    title: string;
    rawTitle: string;
    name: string;
    synopsis?: string;
    status: 'LIVE' | 'UPCOMING';
    isLive: boolean;
    time?: string;
    timeIST?: string;
    thumbnail: string;
    cover_image?: string;
    matchUrl: string;
    streamUrl?: string;
    stream_url?: string;
    drmKey?: string;
    clearkey?: string;
    sportName: string;
    sportEmoji: string;
    category: string;
    league: string;
    source: 'willow';
    isWillow: boolean;
    playUrl: string;
    canWatch: boolean;
    countdown?: string;
    channels?: Array<{
        channelName: string;
        language: string;
        isEnglish: boolean;
        userHasChannel: boolean;
        userChannelUrl: string;
        playUrl: string;
    }>;
}

const WILLOW_JSON_URL = 'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.json';
const WILLOW_BACKUP_JSON_URL = 'https://raw.githubusercontent.com/srhady/willow-event/refs/heads/main/live_sports.json';
const WILLOW_FALLBACK_JSON_URL = 'https://raw.githubusercontent.com/drmlive/willow-live-events/main/willow.json';
const WILLOW_M3U_URLS = [
    'https://raw.githubusercontent.com/sportlive18/Sportlink-wtf/main/willow.m3u',
    'https://raw.githubusercontent.com/sportlive18/Willow-Cricbuzz-Prime-Video-Sport-Live-Event-Auto-Updated-Playlist/main/willow.m3u',
    'https://raw.githubusercontent.com/doctor-8trange/nexphi0/refs/heads/main/data/icc.m3u'
];

let cachedWillowEvents: WillowEvent[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function fetchWillowEvents(forceRefresh = false): Promise<WillowEvent[]> {
    const now = Date.now();
    if (!forceRefresh && cachedWillowEvents.length > 0 && (now - lastFetchTime < CACHE_TTL_MS)) {
        return cachedWillowEvents;
    }

    const urls = [WILLOW_JSON_URL, WILLOW_BACKUP_JSON_URL, WILLOW_FALLBACK_JSON_URL];
    let matches: any[] = [];

    for (const u of urls) {
        try {
            const res = await axios.get(u, {
                timeout: 6000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
            });
            const list = res.data?.Matches || res.data?.matches || (Array.isArray(res.data) ? res.data : []);
            if (Array.isArray(list) && list.length > 0) {
                matches = list;
                break;
            }
        } catch (err: any) {
            console.warn(`[WillowService] Warning fetching ${u}:`, err?.message || err);
        }
    }

    if (matches.length === 0) {
        return cachedWillowEvents;
    }

    let primeEvents: PrimeEvent[] = [];
    try {
        primeEvents = await fetchPrimeEvents(false);
    } catch (_) {}

    const events: WillowEvent[] = matches.map((m: any, idx: number) => {
        const matchId = String(m.match_id || `willow_${idx + 1}`);
        const isLive = String(m.status || '').toUpperCase() === 'LIVE';
        const title = m.title || m.synopsis || `Willow Match #${idx + 1}`;
        const rawStream = (m.stream_url_alpha || m.stream_url || '').trim();
        const drmKey = (m.drm_key || '').trim();
        const thumbnail = m.cover_image || 'https://www.willow.tv/images/willow-logo.png';
        
        let playUrl = '';
        let resolvedStream = rawStream;
        let resolvedDrmKey = drmKey;

        if (rawStream) {
            const encodedStream = encodeURIComponent(rawStream);
            const keyParam = drmKey ? `&clearkey=${encodeURIComponent(drmKey)}` : '';
            playUrl = `/play_consumet.php?channel_id=willow_${matchId}&name=${encodeURIComponent(title)}&url=${encodedStream}${keyParam}&source=willow&type=hls`;
        } else {
            // Check if there is an active Amazon Prime stream for this match (e.g. India vs West Indies)
            const titleLower = title.toLowerCase();
            const primeMatch = primeEvents.find(p => {
                if (!p.streamUrl) return false;
                const pTitle = p.title.toLowerCase();
                if (titleLower.includes('india') && pTitle.includes('india')) return true;
                if (titleLower.includes('west indies') && pTitle.includes('west indies')) return true;
                if (titleLower.includes('champions') && pTitle.includes('champions')) return true;
                return false;
            });

            if (primeMatch && primeMatch.streamUrl) {
                resolvedStream = primeMatch.streamUrl;
                resolvedDrmKey = primeMatch.drmKey;
                playUrl = primeMatch.playUrl;
            } else {
                // Live/Upcoming fallback: fallback to Willow TV live channel stream
                playUrl = `/play_consumet.php?channel_id=willow_${matchId}&name=${encodeURIComponent(title)}&url=${encodeURIComponent('/live.php?token=STALKER_PRO&id=dlhd-willow-hd&m3u=1')}&source=willow&type=hls`;
            }
        }

        return {
            id: `willow_${matchId}`,
            matchId: matchId,
            title: title,
            rawTitle: title,
            name: title,
            synopsis: m.synopsis || title,
            status: isLive ? 'LIVE' : 'UPCOMING',
            isLive: isLive,
            time: m.time || (isLive ? 'LIVE NOW' : 'UPCOMING'),
            timeIST: m.time || (isLive ? 'LIVE NOW' : 'UPCOMING'),
            thumbnail: thumbnail,
            cover_image: thumbnail,
            matchUrl: m.match_url || '',
            streamUrl: resolvedStream,
            stream_url: resolvedStream,
            drmKey: resolvedDrmKey,
            clearkey: resolvedDrmKey,
            sportName: 'Cricket',
            sportEmoji: '🏏',
            category: 'cricket',
            league: 'Willow Cricket Event',
            source: 'willow',
            isWillow: true,
            playUrl: playUrl,
            canWatch: true,
            countdown: isLive ? 'LIVE NOW' : (m.time || 'UPCOMING'),
            channels: [{
                channelName: 'Willow Cricket HD',
                language: 'English',
                isEnglish: true,
                userHasChannel: true,
                userChannelUrl: resolvedStream || '/live.php?token=STALKER_PRO&id=dlhd-willow-hd&m3u=1',
                playUrl: playUrl
            }]
        };
    });

    cachedWillowEvents = events;
    lastFetchTime = now;
    console.log(`[WillowService] Successfully loaded ${events.length} Willow cricket events.`);
    return events;
}
