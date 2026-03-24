require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
    connectionString: "postgres://postgres:Imobum2026%21@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/20260325_recurring_expenses.sql'), 'utf8');
    try {
        await client.query(sql);
        console.log("Recurring Expenses Migration executed successfully");
    } catch (e) {
        console.error("Migration failed", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
