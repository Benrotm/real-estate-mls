async function trigger() {
    console.log('Triggering Immoflux Scraper on imobum.com...');
    try {
        const res = await fetch('https://www.imobum.com/api/admin/start-bulk-import', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `sb-dtyrztovnduapkhokgjk-auth-token=${process.env.SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({
                scraperConfigId: 'f7091490-b18c-4de2-bc57-046dd1fe51a2',
                mode: 'history',
                pageLimit: 1
            })
        });
        console.log('Status:', res.status);
        console.log('Response:', await res.text());
    } catch (e) {
        console.error('Trigger error:', e);
    }
}

trigger();
