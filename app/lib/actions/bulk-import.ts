'use server';

import * as cheerio from 'cheerio';

export async function getPubli24Links(categoryUrl: string, page: number = 1): Promise<{ success: boolean; links: string[]; error?: string }> {
    try {
        if (!categoryUrl) {
            return { success: false, links: [], error: 'URL is required' };
        }

        // Handle pagination
        const urlObj = new URL(categoryUrl);
        urlObj.searchParams.set('pag', page.toString());
        const fetchUrl = urlObj.toString();

        console.log(`[BulkImport] Fetching ${fetchUrl}`);

        const response = await fetch(fetchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            return { success: false, links: [], error: `Failed to fetch page ${page}: ${response.statusText}` };
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        const links: string[] = [];

        // Selector identified in research: .article-item a
        // We need to be careful to get the MAIN link of the item, usually on the title
        // .article-item h2 a or just the first a inside .article-item

        $('.article-item').each((_, el) => {
            // Try specific title link first
            let href = $(el).find('h2 a').attr('href');

            // Fallback to any link if h2 not found
            if (!href) {
                href = $(el).find('a').first().attr('href');
            }

            if (href) {
                // Ensure absolute URL
                if (href.startsWith('/')) {
                    href = new URL(href, 'https://www.publi24.ro').toString();
                }

                // Only unique links
                if (!links.includes(href)) {
                    links.push(href);
                }
            }
        });

        return { success: true, links };

    } catch (error: any) {
        console.error('[BulkImport] Error:', error);
        return { success: false, links: [], error: error.message };
    }
}
