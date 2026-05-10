
const { runSoldImmofluxScrape } = require('./sold_immoflux');
require('dotenv').config({ path: '../.env.local' });
const fs = require('fs');

async function trigger() {
    try {
        const credsFile = fs.readFileSync('.immoflux_creds.json', 'utf8');
        const creds = JSON.parse(credsFile);

        const dummyReq = {
            body: {
                jobId: 'manual-' + Date.now(),
                config: { 
                url: 'https://blitz.immoflux.ro/properties/list',
                stadiu_filter: ['Tranzactionata'],
                region_filter: ['Timis'],
                city_filter: ['Timisoara']
            },
                mode: 'full',
                immofluxUser: creds.u,
                immofluxPass: creds.p,
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
            }
        };

        const dummyRes = {
            status: (code) => {
                console.log('Status:', code);
                return { json: (data) => console.log('Response:', data) };
            },
            json: (data) => console.log('Response:', data)
        };

        console.log('Starting Scrape...');
        await runSoldImmofluxScrape(dummyReq, dummyRes);
        console.log('Scrape Cycle Complete.');
    } catch (err) {
        console.error('Trigger Error:', err);
    }
}

trigger();
