import * as cheerio from 'cheerio';

async function run() {
    const url = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-3-camere/anunt/apartament-cu-3-camere-decomandat-etaj-1-zona-flonta-id-v4116/0f91hd4d9619738he840ggi69egff126.html';
    const html = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }).then(r => r.text());
    const $ = cheerio.load(html);

    console.log('--- Custom Selectors ---');
    console.log('h1:', $('h1').text().trim());
    console.log('price:', $('.product-price > span:first-child').text().trim());
    console.log('currency:', $('.product-price > span:nth-child(2)').text().trim());
    console.log('desc:', $('.article-description').text().trim().substring(0, 50));
    console.log('location:', $('a.maincolor').text().trim());
    console.log('rooms:', $('div:contains("Numar camere") .attribute-value').text().trim());
    console.log('area:', $('div:contains("Suprafata utila") .attribute-value').text().trim());
    console.log('floor:', $('div:contains("Etaj") .attribute-value').text().trim());

    console.log('\\n--- Attribute Items directly ---');
    $('.attribute-item').each((_, el) => {
        const title = $(el).find('strong').text().trim();
        const value = $(el).find('.attribute-value').text().trim();
        console.log(`[${title}] -> [${value}]`);
    });
}
run().catch(console.error);
