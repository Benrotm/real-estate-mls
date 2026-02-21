import { scrapeAdvanced } from '../app/lib/actions/scrapeAdvanced';

async function run() {
    const urls = [
        'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-3-camere/anunt/apartament-cu-3-camere-decomandat-etaj-1-zona-flonta-id-v4116/0f91hd4d9619738he840ggi69egff126.html',
        'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-2-camere/anunt/apartament-de-vanzare-cu-2-camere-in-zona-giroc/e03d749d8345716dd96h57h500f8hi0d.html'
    ];

    for (const url of urls) {
        console.log('\n-----------------------------------');
        console.log('Testing Advanced Scrape on:', url);
        const result = await scrapeAdvanced(url, {});

        if (result.error) {
            console.error('Error:', result.error);
        } else {
            console.log('--- RESULTS ---');
            console.log('Phone:', result.data!.owner_phone);
            console.log('Title:', result.data!.title);
        }
    }
}

run().catch(console.error);
