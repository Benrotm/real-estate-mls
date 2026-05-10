require('dotenv').config({ path: '../.env.local' });
const fetch = require('node-fetch');

(async () => {
    try {
        const response = await fetch('http://localhost:8080/api/run-dynamic-scrape-sold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: "test-job-id-1234",
                pageNum: 1,
                config: { url: "https://blitz.immoflux.ro/approperties" },
                mode: "bulk",
                supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
                supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
            })
        });
        const data = await response.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error pinging localhost:", e);
    }
})();
