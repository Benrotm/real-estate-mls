require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log("Adding days_on_market column...");

    // Note: Standard supabase-js client cannot execute arbitrary DDL queries
    // like ALTER TABLE through the Rest API. We have to use the postgres function 
    // 'exec_sql' if we created one, or we can use the rpc endpoint if available.
    // Let's first try a workaround or checking if we can just define a function.

    // Actively avoiding raw SQL via client if it doesn't work.
    // Actually, Supabase service role often can't run DDL from js client unless via RPC.
    // Let's create an RPC or execute SQL if `exec_sql` exists, or tell user to do it.

    const query = `
    ALTER TABLE public.property_sold_history
    ADD COLUMN IF NOT EXISTS days_on_market INTEGER;
    COMMENT ON COLUMN public.property_sold_history.days_on_market IS 'Number of days the property was on the market before being sold';
  `;

    // Trying to see if there's a generic sql execution rpc
    let { data, error } = await supabase.rpc('exec_sql', { sql: query });

    if (error) {
        console.error("RPC failed, trying raw query...", error.message);
        // There is no native raw query over REST for DDL.
        console.log("Cannot execute DDL over REST API. User must run this in Supabase SQL editor:");
        console.log(query);
    } else {
        console.log("Migration applied successfully!");
    }
}

runMigration();
