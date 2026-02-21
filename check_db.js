require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    try {
        const jobsRes = await fetch(`${supabaseUrl}/rest/v1/scrape_jobs?select=*`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        const jobs = await jobsRes.json();
        console.log(`--- SCRAPE JOBS (${jobs.length}) ---`);
        console.log(jobs);

        const logsRes = await fetch(`${supabaseUrl}/rest/v1/scrape_logs?select=*`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        const logs = await logsRes.json();
        console.log(`\n--- SCRAPE LOGS (${logs.length}) ---`);
        console.log(logs.map(l => `[${l.job_id}] ${l.message}`));
    } catch (e) {
        console.error(e);
    }
}
check();
