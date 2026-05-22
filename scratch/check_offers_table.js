require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOffersTable() {
    console.log("Checking columns of property_offers table...");
    // Let's run a select query from information_schema via RPC or inspect a record
    const { data: cols, error: colsErr } = await supabase
        .rpc('execute_sql_query', { 
            query_text: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'property_offers';"
        });

    if (colsErr) {
        console.warn("RPC execute_sql_query failed, falling back to selecting one row: ", colsErr.message);
        const { data, error } = await supabase
            .from('property_offers')
            .select('*')
            .limit(1);
        if (error) {
            console.error("Error querying property_offers:", error.message);
        } else {
            console.log("Columns present in retrieved row:", data.length > 0 ? Object.keys(data[0]) : "No rows in table to inspect");
        }
    } else {
        console.log("Columns in property_offers:", cols);
    }
}

checkOffersTable();
