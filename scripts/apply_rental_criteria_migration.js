const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260712000000_add_rental_matching_rules.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to database. Applying rental criteria migration...");
        await client.query(sql);
        console.log("Migration applied successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
