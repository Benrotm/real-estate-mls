import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { scrapeProperty } from '../app/lib/actions/scrape';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const url = 'https://www.publi24.ro/anunturi/imobiliare/de-vanzare/apartamente/apartamente-3-camere/anunt/apartament-cu-3-camere-decomandat-etaj-1-zona-flonta-id-v4116/0f91hd4d9619738he840ggi69egff126.html';

    // 1. Fetch DB config
    const { data, error } = await supabase.from('scraper_configs').select('selectors').eq('domain', 'publi24.ro').single();
    if (error) {
        console.error("Error fetching config:", error);
        return;
    }

    const customSelectors = data.selectors;
    console.log("Using Custom Selectors:", customSelectors);

    // 2. Run scrape
    console.log(`\nScraping URL: ${url}`);
    const result = await scrapeProperty(url, customSelectors);

    if (result.error) {
        console.error("Scrape Error:", result.error);
    } else {
        const d = result.data;
        console.log("\n--- Scrape Success ---");
        console.log(`Rooms: ${d?.rooms}`);
        console.log(`Area Usable: ${d?.area_usable}`);
        console.log(`Floor: ${d?.floor}`);
        console.log(`Total Floors: ${d?.total_floors}`);
        console.log(`Price: ${d?.price} ${d?.currency}`);
        console.log(`Bathrooms: ${d?.bathrooms}`);
        console.log(`Year Built: ${d?.year_built}`);
        console.log(`Partitioning: ${d?.partitioning}`);
    }
}

run();
