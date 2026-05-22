require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase.rpc('execute_sql_query', {
        query_text: "SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'property_offers'::regclass;"
    });
    if (error) {
        // fall back to reading check constraints via raw SQL lookup if execute_sql_query doesn't exist, but wait, execute_sql_query didn't exist in the cache.
        // Let's write a database query or try calling execute_sql_query (maybe it works if we use the admin client, or maybe it was just not found because we didn't define it).
        // Let's try to query using schema tables or a direct query. Actually, we can run a select on property_offers status by inserting a dummy status if we want, or look up information_schema.
        console.log("Error querying constraints:", error.message);
    } else {
        console.log("Constraints:", data);
    }
}
run();
