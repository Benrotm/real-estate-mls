import * as cheerio from 'cheerio';

async function test() {
    const url = process.argv[2] || 'https://casadomi.ro/casa-vila-6-camere-de-vanzare-braytim-timisoara-367';
    console.log('Testing URL:', url);

    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });
    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('Page Title:', $('title').text());

    // 1. Check for standard gallery (Casadomi style)
    const galleryItems = $('.property-main-gallery-item img').length;
    console.log('Standard Gallery Items:', galleryItems);

    // 2. Check for Publi24 imageList
    let publi24Images = 0;
    $('script').each((_, el) => {
        const content = $(el).html() || '';
        if (content.includes('var imageList =')) {
            const match = content.match(/var\s+imageList\s*=\s*(\[[\s\S]*?\]);/);
            if (match && match[1]) {
                const json = JSON.parse(match[1]);
                if (Array.isArray(json)) publi24Images += json.length;
                console.log('Found static imageList:', json.length);
            } else if (content.includes('imageList.push')) {
                const pushMatches = Array.from(content.matchAll(/imageList\.push\(({[\s\S]*?})\);/g));
                if (pushMatches.length > 0) {
                    publi24Images += pushMatches.length;
                    console.log('Found dynamic imageList.push:', pushMatches.length);
                    // Log first match to verify structure
                    console.log('Sample push data:', pushMatches[0][1]);
                }
            }
        }
    });

    // 3. Check for specific Publi24 attributes
    const specs = {};
    $('.attribute-item').each((_, el) => {
        const label = $(el).find('.attribute-label strong').text().trim();
        const value = $(el).find('.attribute-value').text().trim();
        if (label) specs[label] = value;
    });
    console.log('Publi24 Specs Found:', Object.keys(specs).length > 0 ? specs : 'None');

    console.log('--- SUMMARY ---');
    console.log('Total Publi24 Images Found:', publi24Images);
}

test();
