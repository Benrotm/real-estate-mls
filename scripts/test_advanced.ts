import { scrapeAdvanced } from '../app/lib/actions/scrapeAdvanced';

async function run() {
    const url = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-2-camere/anunt/denya-forest-7-bloc-nzeb-apartament-2-camere-comision-0/43530ei590947439d62h0e822687d7f6.html';

    console.log('Testing Advanced Scrape on:', url);
    const result = await scrapeAdvanced(url, {});

    if (result.error) {
        console.error('Error:', result.error);
    } else {
        console.log('--- ADVANCED SCRAPE RESULTS ---');
        console.log('Phone:', result.data!.owner_phone);
        console.log('Title:', result.data!.title);
    }
}

run().catch(console.error);
