const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load the HTML
const htmlPath = path.resolve(__dirname, '..', 'scraper-api-microservice', 'immoflux_slidepanel.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Mock data object
let data = {
    title: 'Apartament 2 camere',
    address: 'TM Timisoara',
    location_city: 'TM Timisoara',
    location_area: ''
};

const url = 'https://blitz.immoflux.ro/approperties/123';

function addImage(src) {
    if (!data.images) data.images = [];
    data.images.push(src);
}

// --- LOGIC FROM scrape.ts ---

// 3f. Specific Site Logic (Immoflux.ro)
if (url.includes('immoflux.ro')) {
    // Description Extraction - Handle unstructured text nodes via container regex
    const container = $('.slidePanel-inner-section');
    if (container.length > 0) {
        const fullText = container.text().trim();
        const descMatch = fullText.match(/Descriere\s*:?\s*([\s\S]+)/i);
        if (descMatch && descMatch[1]) {
            let immoDesc = descMatch[1].trim();
            const cutOffMatch = immoDesc.match(/([\s\S]+?)(?:\s+Detalii suplimentare|\s+Caracteristici|\s+Dotari|\s*Zona|$)/i);
            if (cutOffMatch && cutOffMatch[1]) {
                data.description = cutOffMatch[1].trim();
            } else {
                data.description = immoDesc;
            }
        }
    }

    // Location Refinement
    const rawCity = data.location_city || data.address || '';
    if (rawCity && rawCity.toLowerCase().startsWith('tm ')) {
        data.location_city = rawCity.replace(/^tm\s+/i, '').trim();
        data.location_county = 'Timis';
        data.address = `${data.location_city}, ${data.location_area || ''}, Timis, Romania`.replace(/,\s*,/g, ',');
    }

    // Image Extraction (Prioritize href for high-res)
    $('.owl-carousel .item a').each((_, el) => {
        const highRes = $(el).attr('href');
        if (highRes) addImage(highRes);
    });
}

console.log('--- EXTRACTION RESULTS ---');
console.log('City:', data.location_city);
console.log('County:', data.location_county);
console.log('Description Snippet:', data.description ? data.description.substring(0, 100) + '...' : 'NULL');
console.log('Image Count:', data.images ? data.images.length : 0);
if (data.images && data.images.length > 0) {
    console.log('First Image URL:', data.images[0]);
}
