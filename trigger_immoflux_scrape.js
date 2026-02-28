const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function startScrape() {
    const { data: settings } = await supabase.from('admin_settings').select('value').eq('key', 'immoflux_integration').single();
    let config = settings.value;
    if (typeof config === 'string') config = JSON.parse(config);

    const jobId = `job_${Date.now()}`;
    await supabase.from('scrape_jobs').insert([{
        id: jobId,
        status: 'running',
        platform: 'immoflux',
        started_at: new Date().toISOString()
    }]);

    console.log("Triggering Render API with Job ID:", jobId);
    console.log("Config keys:", Object.keys(config));

    const res = await fetch('https://imobum-scraper-api.onrender.com/api/run-dynamic-scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SCRAPER_API_KEY}`
        },
        body: JSON.stringify({
            categoryUrl: config.url || 'https://blitz.immoflux.ro/approperties?page=1',
            jobId: jobId,
            pageNum: 1,
            delayMin: config.delayMin || 2000,
            delayMax: config.delayMax || 5000,
            mode: 'once',
            linkSelector: config.linkSelector || 'a.btn-outline-primary',
            extractSelectors: config.mapping || {},
            proxyConfig: null,
            webhookBaseUrl: 'https://imobum.com',
            immofluxUser: process.env.IMMOFLUX_USER || 'benoni.silion@blitz-timisoara.ro',
            immofluxPass: process.env.IMMOFLUX_PASS || 'EDwohI#6Oi',
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
        })
    });

    if (res.ok) {
        console.log("Render Microservice accepted the payload and is scraping Page 1!");
        console.log("Waiting 30 seconds for logs...");
        setTimeout(async () => {
            const { data: logs } = await supabase.from('scrape_logs').select('message, created_at, level').eq('job_id', jobId).order('created_at', { ascending: false }).limit(20);
            logs.reverse().forEach(l => console.log(`[${new Date(l.created_at).toLocaleTimeString()}] ${l.level}: ${l.message}`));
        }, 30000);
    } else {
        console.error("Render rejected:", res.status, await res.text());
    }
}

startScrape();
