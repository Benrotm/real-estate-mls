require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('pooler.supabase.com')) {
    connectionString = 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres';
}

if (!connectionString) {
    console.error("DATABASE_URL is missing from .env.local");
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log("Connecting to database...");
    await client.connect();
    console.log("CONNECTED!");
    
    const sql = `
        CREATE OR REPLACE FUNCTION get_lead_id_by_short_id(short_id text)
        RETURNS uuid AS $$
        BEGIN
            RETURN (SELECT id FROM leads WHERE id::text LIKE (short_id || '%') LIMIT 1);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    try {
        console.log("Creating PostgreSQL function...");
        await client.query(sql);
        console.log("Function get_lead_id_by_short_id created successfully!");
    } catch (e) {
        console.error("Failed to create function:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
