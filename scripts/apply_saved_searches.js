const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

async function run() {
    console.log('Applying saved_searches migration...');

    // Use Direct Connection to avoid Pooler issues
    // Host: db.[project-ref].supabase.co
    const client = new Client({
        host: 'db.cwfhcrftwsxsovexkero.supabase.co',
        port: 5432,
        user: 'postgres',
        password: 'Imobum2026!',
        database: 'postgres',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlPath = path.join(__dirname, '../supabase/migrations/20260211_saved_searches.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running SQL...');
        await client.query(sql);

        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

run();
