import { scrapeProperty } from '../app/lib/actions/scrape';

async function main() {
    // Test with a known real estate listing or a generic page with OG tags
    // Using a sample URL that is likely to have OG tags (e.g., a news article or generic site if a real estate one isn't stable)
    // For now, let's try to scrape a known real estate site if possible, or just a generic one to test OG fallback.
    const url = 'https://www.imobum.com'; // Self-test or external

    console.log(`Scraping ${url}...`);
    const result = await scrapeProperty(url);

    if (result.error) {
        console.error('Error:', result.error);
    } else {
        console.log('Success! Scraped Data:', JSON.stringify(result.data, null, 2));
    }
}

main().catch(console.error);
