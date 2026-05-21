import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const dbUrl = 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres';

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function applyMigration() {
    try {
        await client.connect();
        console.log('Connected to database.');

        const sqlFilePath = path.resolve(process.cwd(), 'supabase/migrations/009_add_gdpr_consent.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Applying 009_add_gdpr_consent.sql...');
        await client.query(sql);
        console.log('Done.');

        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyMigration();
