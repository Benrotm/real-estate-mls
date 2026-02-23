import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

let connectionString = process.env.DATABASE_URL;

if (connectionString && connectionString.includes('5432')) {
    connectionString = connectionString.replace(':5432/', ':6543/');
}

if (!connectionString) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
}

const client = new Client({
    connectionString,
});

async function run() {
    try {
        await client.connect();
        const sql = fs.readFileSync('supabase/migrations/20260223210740_add_fingerprint.sql', 'utf8');
        await client.query(sql);
        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await client.end();
    }
}

run();
