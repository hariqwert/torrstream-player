const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /for \(let i = 0; i < rawProgrammes\.length; i\+\+\) \{[\s\S]*?\{.*?id: c\.id \+ '_dummy_1',/m;

const replacement = `for (let i = 0; i < rawProgrammes.length; i++) {
                            const p = rawProgrammes[i];
                            allProgrammes.push({
                                channel: p.channel,
                                start: parseXmltvDate(p.start),
                                end: parseXmltvDate(p.end),
                                title: p.title,
                                desc: p.desc,
                                category: p.category
                            });
                            // Yield occasionally
                            if (i % 10000 === 0) await new Promise(r => setTimeout(r, 0));
                        }
                    } catch (e) {
                        console.error("Failed to load EPG from server", e);
                    }

                    if (allChannels.length === 0) {
                        throw new Error("No channels found in provided XMLTV EPG sources.");
                    }

                    const normalizeName = (name) => name.replace(/\\[.*?\\]|\\(.*?\\)|\\|.*/g, '').replace(/\\b(hd|fhd|4k|sd)\\b/gi, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
                    window.epgChannels = [];
                    window.epgProgrammesByChannel = {};
                    window.epgProgrammes = allProgrammes;

                    let baseChannels = window.allSportsChannels && window.allSportsChannels.length > 0 ? window.allSportsChannels : allChannels;

                    const groupedProgrammes = {};
                    for (const p of allProgrammes) {
                        if (!groupedProgrammes[p.channel]) groupedProgrammes[p.channel] = [];
                        groupedProgrammes[p.channel].push(p);
                    }

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
                            for (const mId of matchedEpgIds) {
                                if (groupedProgrammes[mId]) {
                                    window.epgProgrammesByChannel[chId].push(...groupedProgrammes[mId].map(p => ({...p, channel: chId})));
                                }
                            }
                        }
                        
                        if (i % 50 === 0) await new Promise(r => setTimeout(r, 0));
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
                                    id: c.id + '_dummy_1',`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html);
