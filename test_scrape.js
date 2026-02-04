const fs = require('fs');
const cheerio = require('cheerio');

// Read the downloaded HTML file
const html = fs.readFileSync('casadomi_source.html', 'utf-8');
const $ = cheerio.load(html);

const imagesSet = new Set();
const addImage = (url) => {
    if (!url) return;
    if (url.startsWith('//')) url = 'https:' + url;
    if (url.startsWith('/')) url = 'https://casadomi.ro' + url;
    imagesSet.add(url);
};

console.log('Searching for Casadomi gallery...');
const casadomiGallery = $('#property-main-gallery');
console.log('Gallery found:', casadomiGallery.length);

if (casadomiGallery.length > 0) {
    // Find both images and anchor links in the gallery items
    const items = casadomiGallery.find('.property-main-gallery-item');
    console.log('Items found:', items.length);

    items.each((_, el) => {
        const img = $(el).find('img').attr('src');
        const link = $(el).find('a').attr('href');

        console.log(`Item: img=${img}, link=${link}`);

        // Prefer link if it looks like an image, mainly looking for 'big__' for high res
        if (link && /\.(jpg|jpeg|png|webp)$/i.test(link)) {
            addImage(link);
        } else if (img) {
            // Try to construct high-res url if it's a thumbnail (starts with small__)
            let highRes = img;
            if (img.includes('small__')) {
                highRes = img.replace('small__', 'big__');
            }
            addImage(highRes);
        }
    });
}

console.log('--- Found Images ---');
console.log(Array.from(imagesSet));
