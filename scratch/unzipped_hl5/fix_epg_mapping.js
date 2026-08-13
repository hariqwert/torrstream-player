const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /window\.epgChannels = allChannels;[\s\S]*?category: "Live"[\s\S]*?\}[\s\S]*?\];\s*\}[\s\S]*?\}/;

const replacement = `const normalizeName = (name) => name.replace(/\\[.*?\\]|\\(.*?\\)|\\|.*/g, '').replace(/\\b(hd|fhd|4k|sd)\\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    window.epgChannels = [];
                    window.epgProgrammesByChannel = {};
                    window.epgProgrammes = allProgrammes;

                    let baseChannels = window.allSportsChannels && window.allSportsChannels.length > 0 ? window.allSportsChannels : allChannels;

                    for (let i = 0; i < baseChannels.length; i++) {
                        const ch = baseChannels[i];
                        const cleanName = normalizeName(ch.name.replace(/⭐️/g, '').trim());
                        const chId = ch.id || ("mapped_" + i);

                        let matchedEpgIds = [];
                        if (baseChannels === window.allSportsChannels) {
                            let matchedEpgChan = allChannels.find(c => {
                                const cName = normalizeName(c.name);
                                if (!cName || !cleanName) return false;
                                if (cName === cleanName) return true;
                                if (cName.length > 4 && cleanName.includes(cName)) return true;
                                if (cleanName.length > 4 && cName.includes(cleanName)) return true;
                                return false;
                            });
                            
                            if (matchedEpgChan) {
                                matchedEpgIds.push(matchedEpgChan.id);
                            }
                        } else {
                            matchedEpgIds.push(ch.id);
                        }

                        const finalChan = {
                            id: chId,
                            name: ch.name.replace(/⭐️/g, '').trim(),
                            logo: (typeof getSportsLogo === 'function' ? getSportsLogo(ch) : (ch.logo || 'https://ui-avatars.com/api/?name='+encodeURIComponent(ch.name)+'&background=05070a&color=10b981&size=256&bold=true')),
                            url: ch.url || ch.stream_url
                        };
                        window.epgChannels.push(finalChan);
                        window.epgProgrammesByChannel[chId] = [];

                        if (matchedEpgIds.length > 0) {
                            for (const p of allProgrammes) {
                                if (matchedEpgIds.includes(p.channel)) {
                                    window.epgProgrammesByChannel[chId].push({...p, channel: chId});
                                }
                            }
                        }
                    }

                    // synthesize fallback for channels without EPG
                    const nowFallback = new Date();
                    nowFallback.setHours(0,0,0,0);
                    const todayStart = nowFallback.getTime();
                    const tomorrowStart = todayStart + 86400000;
                    const nextDayStart = tomorrowStart + 86400000;

                    for (const c of window.epgChannels) {
                        if (!window.epgProgrammesByChannel[c.id] || window.epgProgrammesByChannel[c.id].length === 0) {
                            window.epgProgrammesByChannel[c.id] = [
                                {
                                    id: c.id + '_dummy_1',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(todayStart),
                                    end: new Date(tomorrowStart - 1000),
                                    category: "Live"
                                },
                                {
                                    id: c.id + '_dummy_2',
                                    channel: c.id,
                                    title: c.name + " Live Broadcast",
                                    desc: "Live continuous broadcasting feed.",
                                    start: new Date(tomorrowStart),
                                    end: new Date(nextDayStart - 1000),
                                    category: "Live"
                                }
                            ];
                        }
                    }`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html, 'utf8');
console.log('done');
