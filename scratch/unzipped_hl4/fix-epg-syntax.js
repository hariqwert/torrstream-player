const fs = require('fs');
let html = fs.readFileSync('consumet.html', 'utf8');

const regex = /for \(let i = 0; i < rawProgrammes\.length; i\+\+\) \{[\s\S]*?let matchedEpgIds = \[\];/m;

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

                        let matchedEpgIds = [];`;

html = html.replace(regex, replacement);
fs.writeFileSync('consumet.html', html);
