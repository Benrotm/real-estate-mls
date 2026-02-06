import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        console.error('❌ No database connection string found in environment variables (checked DATABASE_URL, POSTGRES_URL, SUPABASE_DB_URL).');
        process.exit(1);
    }

    // Fix for Supabase Transaction Pooler (port 6543) vs Session (5432)
    // Sometimes 'pg' needs ssl: true for hosted dbs
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase usually
    });

    try {
        await client.connect();
        console.log('✅ Connected to database.');

        const sqlPath = path.join(__dirname, '../supabase/migrations/20260206143000_virtual_tours.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log(`Executing migration from ${sqlPath}...`);

        // Simple split by statement if needed, but client.query usually handles multiple statements
        await client.query(sql);

        console.log('✅ Migration executed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
