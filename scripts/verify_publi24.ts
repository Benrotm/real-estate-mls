
import { analyzePropertyPage } from '../app/lib/actions/smart-scrape';
import { scrapeProperty } from '../app/lib/actions/scrape';

const TEST_URL = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-3-camere/anunt/apartament-cu-3-cmarere-2-locuri-de-parcare-zona-torontal/i095129508f977f328085g3ii8h5h72h.html';

async function run() {
    console.log('--- 1. Testing Smart Mapper (analyzePropertyPage) ---');
    const analysis = await analyzePropertyPage(TEST_URL);

    if (analysis.success) {
        console.log(`Found ${analysis.candidates.length} candidates.`);

        // Check for Description
        const descCandidates = analysis.candidates.filter(c => c.label.toLowerCase().includes('description') || c.label.toLowerCase().includes('descriere'));
        if (descCandidates.length > 0) {
            console.log('✅ Description Candidates Found:');
            descCandidates.forEach(c => console.log(`   - [${c.confidence}] ${c.label}: ${c.value.substring(0, 50)}...`));
        } else {
            console.error('❌ No description candidates found!');
            // Log all candidates key/values for debugging
            // console.log(analysis.candidates.map(c => `${c.label}: ${c.value}`).join('\n'));
        }

        // Check for Price
        const priceCandidates = analysis.candidates.filter(c => c.label.toLowerCase().includes('price') || c.value.match(/[0-9]/) && c.label.includes('Pret'));
        if (priceCandidates.length > 0) {
            console.log('✅ Price Candidates Found:', priceCandidates.length);
        }

    } else {
        console.error('Analysis Failed:', analysis.error);
    }

    console.log('\n--- 2. Testing Extraction (scrapeProperty) ---');
    // Define some likely selectors for Publi24 based on common knowledge/analysis
    // We want to see if the "Append URL" logic works, which happens in properties.ts, not scrape.ts. 
    // BUT scrape.ts should return the URL in the object.

    // Simulating what Admin would pass after "Smart Map"
    // We assume some selectors were chosen. For the purpose of this test, we care about the returned object structure.
    const mockSelectors = {
        title: 'h1',
        description: '.description', // Standard Publi24
        price: '.price',
        location: '.location',
        // Add a "private_notes" selector if we had one, but we are testing the "Auto Append" which is post-scrape.
        // Actually, the user asked to "setup the scraper to ad to Private notes the link".
        // My implementation was: `private_notes: ... + url`.
        // So scrapeProperty just needs to return `url`.
    };

    const scrapeResult = await scrapeProperty(TEST_URL, mockSelectors);
    if (scrapeResult.data) {
        console.log('✅ Scrape Success');
        console.log('URL Field Present:', !!scrapeResult.data.url);
        console.log('URL Value:', scrapeResult.data.url);

        // We can't easily test createPropertyFromData here without a DB connection/user mocked.
        // But we can verify the URL is passed correctly.
    } else {
        console.error('Scrape Failed:', scrapeResult.error);
    }
}

run();
