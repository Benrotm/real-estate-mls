require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.log("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Reading migration SQL...");
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260623000000_storia_oauth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log("Calling RPC exec_sql...");
    let { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    // If that fails, try 'exec_sql' with parameter name 'sql'
    if (error) {
        console.log("Trying alternative parameter name 'sql'...");
        const res = await supabase.rpc('exec_sql', { sql: sql });
        data = res.data;
        error = res.error;
    }

    if (error) {
        console.error("RPC failed:", error.message, error);
        process.exit(1);
    } else {
        console.log("Migration executed successfully via RPC!");
    }
}
run();
