const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected to the database!");

        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260603000000_add_company_representative_to_profiles.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');
        console.log("Read SQL migration file from:", migrationPath);

        // Execute the migration SQL
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (e) {
        console.error("Migration execution failed:", e.message);
    } finally {
        await client.end();
    }
}
main();
