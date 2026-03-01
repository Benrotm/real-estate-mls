const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load the HTML
const htmlPath = path.resolve(__dirname, '..', 'scraper-api-microservice', 'immoflux_slidepanel.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const $ = cheerio.load(html);

// Mock data object
let data = {
    owner_phone: ''
};

const url = 'https://blitz.immoflux.ro/approperties/123';
const customSelectors = {
    owner_phone: 'div.btn-icon:has(i.fa-phone)'
};

// Helper: Get Text
const getText = (sel) => {
    if (!sel) return undefined;
    return $(sel).first().text().trim() || undefined;
};

// --- LOGIC FROM scrape.ts (Simulated) ---

if (url.includes('immoflux.ro')) {
    // Phone Extraction (Immoflux specific cleaning)
    if (customSelectors?.owner_phone) {
        const rawPhone = getText(customSelectors.owner_phone);
        if (rawPhone) {
            data.owner_phone = rawPhone.replace(/\D/g, '');
        }
    }
}

console.log('--- PHONE EXTRACTION RESULTS ---');
console.log('Raw text targeted by selector:', getText(customSelectors.owner_phone));
console.log('Cleaned Phone:', data.owner_phone);

if (!data.owner_phone) {
    console.log('FAIL: Phone number not extracted. Checking if icon exists...');
    const icon = $('i.fa-phone');
    console.log('Icon found:', icon.length > 0);
    if (icon.length > 0) {
        console.log('Icon parent text:', icon.parent().text().trim());
    }
} else {
    console.log('SUCCESS: Phone number extracted correctly!');
}
