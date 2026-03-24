require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260324_agency_finances_activities.sql'), 'utf8');
    try {
        await client.query(sql);
        console.log("Migration executed successfully");
    } catch (e) {
        console.error("Migration failed", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
