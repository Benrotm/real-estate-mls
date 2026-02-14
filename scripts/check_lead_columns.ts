import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkColumns() {
    console.log('Checking columns...');

    // Extracted from environment variables
    const password = 'Imobum2026!';
    const projectRef = 'cwfhcrftwsxsovexkero';
    const connectionString = `postgres://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_name = 'leads';
        `);

        if (res.rows.length > 0) {
            console.log('Columns found:', res.rows.map(r => `${r.column_name}: ${r.data_type}`));
        } else {
            console.log('Column "preference_features" NOT found in "leads" table.');
        }

    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await client.end();
    }
}

checkColumns();
