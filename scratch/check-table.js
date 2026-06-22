const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function check() {
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.efa89711-bcc1-404e-9cb2-b9c8d48f97d4&select=*`, {
            headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }
        });
        const status = res.status;
        console.log(`HTTP Status: ${status}`);
        if (status === 200) {
            const data = await res.json();
            console.log('profile data:', JSON.stringify(data, null, 2));
        } else {
            const errText = await res.text();
            console.log('Error output:', errText);
        }
    } catch (e) {
        console.error(e);
    }
}
check();
