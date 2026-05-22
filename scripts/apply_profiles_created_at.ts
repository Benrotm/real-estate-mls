import { Client } from 'pg';

const dbUrl = 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres';

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to database directly.');

        console.log('Altering profiles table to add created_at...');
        await client.query(`
            ALTER TABLE public.profiles 
            ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
        `);
        console.log('created_at column added successfully.');

        console.log('Reloading PostgREST schema...');
        await client.query(`
            NOTIFY pgrst, 'reload schema';
        `);
        console.log('Schema reload triggered.');

    } catch (err) {
        console.error('Error applying migration:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main();
