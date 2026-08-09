import express, { Request, Response } from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

router.get('/search', async (req: Request, res: Response) => {
    const query = req.query.q as string;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const searchUrl = `https://malayalamsubtitles.org/?s=${encodeURIComponent(query)}`;
        const response = await axios.get(searchUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.5' }, validateStatus: () => true });
        
        if (response.status === 403 || response.data.includes('Just a moment...')) {
            return res.json({ error: 'Search blocked by Cloudflare. Please try again later or use the exact movie name.' });
        }

        const $ = cheerio.load(response.data);

        const results: any[] = [];
        
        // Msone usually has articles inside main or specific classes
        $('article').each((i, el) => {
            const titleElement = $(el).find('.entry-title a');
            const title = titleElement.text().trim();
            const link = titleElement.attr('href');
            const image = $(el).find('img').attr('src');
            
            if (title && link) {
                results.push({ title, link, image });
            }
        });

        res.json({ results });
    } catch (error: any) {
        console.error('Subtitle search error:', error.message);
        res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
});

router.get('/download', async (req: Request, res: Response) => {
    const postUrl = req.query.url as string;
    if (!postUrl || !postUrl.startsWith('https://malayalamsubtitles.org/')) {
        return res.status(400).json({ error: 'Valid Post URL from malayalamsubtitles.org is required' });
    }

    try {
        let response = await axios.get(postUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            validateStatus: () => true // Don't throw on 403
        });

        // Fallback to web archive if blocked by Cloudflare
        if (response.status === 403 || response.status === 520 || response.data.includes('Just a moment...')) {
            console.log(`Cloudflare blocked ${postUrl}. Attempting Web Archive fallback...`);
            const archiveUrl = `https://web.archive.org/web/2/${postUrl}`;
            try {
                response = await axios.get(archiveUrl, { validateStatus: () => true });
            } catch (archiveErr) {
                console.warn('Web archive fallback failed');
            }
        }

        const $ = cheerio.load(response.data);
        let downloadLink = '';
        
        // 1. Try to find the link in onclick="window.location.href='...'"
        const onclickMatch = response.data.match(/onclick=["']window\.location\.href=['"]([^'"]+)['"]/i);
        if (onclickMatch && onclickMatch[1]) {
            downloadLink = onclickMatch[1];
            // Clean up if it's a web archive URL
            if (downloadLink.includes('web.archive.org') && downloadLink.includes('http')) {
                const match = downloadLink.match(/https?:\/\/.*/);
                if (match) {
                    // It might match the first http which is web.archive.org, we want the second one
                    const originalUrlMatch = downloadLink.match(/web\.archive\.org\/web\/\d+\/(https?:\/\/.*)/);
                    if (originalUrlMatch) {
                        downloadLink = originalUrlMatch[1];
                    }
                }
            }
        } else {
            // 2. Try to find wpdmdl=\d+ anywhere in the HTML
            const wpdmdlMatch = response.data.match(/wpdmdl=\d+/i);
            if (wpdmdlMatch) {
                downloadLink = `https://malayalamsubtitles.org/?${wpdmdlMatch[0]}`;
            }
        }
        
        if (!downloadLink) {
            // Find anchor tags that contain wpdmdl or zip or srt
            $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('wpdmdl=') || href.includes('.zip') || href.includes('.srt') || href.includes('download'))) {
                const text = $(el).text().toLowerCase();
                if (href.includes('wpdmdl=') || text.includes('download') || text.includes('zip') || text.includes('srt') || $(el).hasClass('download-button')) {
                    downloadLink = href;
                    return false; // Break the loop
                }
            }
        });

        // Backup plan for download buttons
        if (!downloadLink) {
            const buttons = $('a.wp-block-button__link'); // Common in WP
            buttons.each((i, el) => {
                const text = $(el).text().toLowerCase();
                const href = $(el).attr('href');
                if (href && (href.includes('wpdmdl=') || text.includes('download'))) {
                    downloadLink = href || '';
                }
            });
        }

        if (!downloadLink) {
            console.warn('Download link not found, possibly due to Cloudflare protection. Returning post URL as fallback.');
            return res.json({ downloadUrl: postUrl });
        }
        } // Close the outer if(!downloadLink) block

        res.json({ downloadUrl: downloadLink });
    } catch (error: any) {
        console.error('Subtitle download error:', error.message);
        res.status(500).json({ error: 'Failed to extract download link' });
    }
});

export default router;
