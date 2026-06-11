const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load the HTML
const htmlPath = path.resolve(__dirname, '..', 'scraper-api-microservice', 'immoflux_slidepanel.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Cleanup
$('style, noscript, iframe, svg, nav, footer, header').remove();

const data = {};
const fullBodyText = $('body').text();

// Description Extraction - Handle unstructured text nodes
let descH4 = $('h4').filter((_, el) => $(el).text().trim().toLowerCase() === 'descriere');
if (descH4.length === 0) {
    descH4 = $('.example-title').filter((_, el) => $(el).text().trim().toLowerCase().includes('descriere'));
}
if (descH4.length > 0) {
    const parentContents = descH4.parent().contents();
    const startIndex = parentContents.index(descH4);
    if (startIndex !== -1) {
        const descParts = [];
        for (let i = startIndex + 1; i < parentContents.length; i++) {
            const node = parentContents.eq(i);
            const tagName = node.prop('tagName')?.toLowerCase();
            if (tagName === 'h4' || tagName === 'h3' || tagName === 'script' || tagName === 'style') {
                break;
            }
            if (node.hasClass('site-action') || node.hasClass('slidePanel-actions')) {
                break;
            }
            
            if (node[0].type === 'text') {
                const rawText = node[0].data;
                if (rawText) descParts.push(rawText);
            } else {
                const text = node.text();
                if (text) descParts.push(text);
            }
        }
        if (descParts.length > 0) {
            data.description = descParts.join('').trim();
        }
    }
}

// Fallback for description if sibling traversal is empty or did not work
if (!data.description) {
    const container = $('.slidePanel-inner-section');
    if (container.length > 0) {
        const fullText = container.text().trim();
        const descMatch = fullText.match(/Descriere\s*:?\s*([\s\S]+)/i);
        if (descMatch && descMatch[1]) {
            let immoDesc = descMatch[1].trim();
            const cutOffMatch = immoDesc.match(/([\s\S]+?)(?:\s+Detalii suplimentare|\s+Caracteristici|\s+Dotari|\s*Zona|$)/i);
            data.description = cutOffMatch ? cutOffMatch[1].trim() : immoDesc;
        }
    }
}

// Specs extraction (Immoflux-specific)
const areaMatch = fullBodyText.match(/(?:Suprafata utila|Suprafață utilă)\s*:\s*([\d.,]+)/i);
if (areaMatch) {
    data.area_usable = parseFloat(areaMatch[1].replace(',', '.'));
}

const yearMatch = fullBodyText.match(/(?:An constructie|An construcție)\s*:\s*(\d{4})/i);
if (yearMatch) {
    data.year_built = parseInt(yearMatch[1], 10);
}

const roomsMatch = fullBodyText.match(/Camere\s*:\s*(\d+)/i);
if (roomsMatch && !data.rooms) {
    data.rooms = parseInt(roomsMatch[1], 10);
}

const baiMatch = fullBodyText.match(/(?:Bai|Băi)\s*:\s*(\d+)/i);
if (baiMatch) {
    data.bathrooms = parseInt(baiMatch[1], 10);
}

const balcMatch = fullBodyText.match(/Balcoane\s*:\s*(\d+)/i);
if (balcMatch) {
    data.area_terrace = parseInt(balcMatch[1], 10);
}

const floorMatch = fullBodyText.match(/Etaj\s*:\s*(\d+)/i);
if (floorMatch) {
    data.floor = parseInt(floorMatch[1], 10);
}

const regimMatch = fullBodyText.match(/[Rr]egim(?:\s+de)?\s+(?:inaltime|înălțime|in[aă]l[tț]ime)[:\s]*P\s*\+\s*(\d+)/i);
if (regimMatch) {
    data.total_floors = parseInt(regimMatch[1], 10);
} else {
    const pPlusMatch = fullBodyText.match(/P\s*\+\s*(\d+)\s*(?:E|etaj)/i);
    if (pPlusMatch) {
        data.total_floors = parseInt(pPlusMatch[1], 10);
    }
}

console.log('--- EXTRACTION RESULTS ---');
console.log('Description:\n', data.description);
console.log('--------------------------');
console.log('Area Usable (sqm):', data.area_usable);
console.log('Year Built:', data.year_built);
console.log('Rooms:', data.rooms);
console.log('Bathrooms:', data.bathrooms);
console.log('Floor:', data.floor);
console.log('Total Floors:', data.total_floors);
