require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

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
    console.log("Reading migration file...");
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260608000000_create_presentation_contracts.sql'), 'utf8');
    try {
        console.log("Executing SQL migration...");
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
