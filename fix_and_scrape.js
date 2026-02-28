const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixAndScrape() {
    const { data: settings } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    let config = settings.value;
    if (typeof config === 'string') config = JSON.parse(config);

    // FIX THE URL: Remove the hardcoded '?page=xx'
    const newUrl = config.url.split('?')[0];
    config.url = newUrl;
    config.last_page_scraped = 0; // ensure reset

    await supabase.from('admin_settings').update({ value: config }).eq('key', 'immoflux_integration');
    console.log("Fixed Base URL to:", newUrl);

    // Trigger Scrape
    const jobId = `job_${Date.now()}`;
    await supabase.from('scrape_jobs').insert([{ id: jobId, status: 'running', platform: 'immoflux', started_at: new Date().toISOString() }]);

    const res = await fetch('https://imobum-scraper-api.onrender.com/api/run-dynamic-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.SCRAPER_API_KEY}` },
        body: JSON.stringify({
            categoryUrl: newUrl,
            jobId: jobId,
            pageNum: 1,
            delayMin: 2000,
            delayMax: 3500,
            mode: 'once',
            linkSelector: config.linkSelector || 'a',
            extractSelectors: config.mapping || {},
            proxyConfig: null,
            webhookBaseUrl: 'https://www.imobum.com',
            immofluxUser: process.env.IMMOFLUX_USER || 'benoni.silion@blitz-timisoara.ro',
            immofluxPass: process.env.IMMOFLUX_PASS || 'EDwohI#6Oi',
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        })
    });

    if (res.ok) {
        console.log("Scrape triggered successfully on Page 1!");
        console.log("Waiting 30 seconds for logs...");
        setTimeout(async () => {
            const { data: logs } = await supabase.from('scrape_logs').select('message, created_at').eq('job_id', jobId).order('created_at', { ascending: false }).limit(20);
            logs.reverse().forEach(l => console.log(`[${new Date(l.created_at).toLocaleTimeString()}] ${l.message}`));

            const { data: props } = await supabase.from('properties').select('id, title').order('created_at', { ascending: false }).limit(3);
            console.log("New Properties:", props);
        }, 30000);
    } else {
        console.error("Render rejected:", res.status, await res.text());
    }
}

fixAndScrape();
