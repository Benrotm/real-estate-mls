require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDb() {
    console.log("Checking property_sold_history table...");
    const { data, error } = await supabase
        .from('property_sold_history')
        .select('id, days_on_market')
        .limit(1);

    if (error) {
        console.error("Error querying property_sold_history:", error.message);
    } else {
        console.log("Query successful, days_on_market column exists.", data);
    }
}

checkDb();
