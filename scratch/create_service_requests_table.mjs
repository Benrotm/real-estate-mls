import pg from 'pg';

const { Client } = pg;

const client = new Client({
    user: 'postgres',
    host: 'db.cwfhcrftwsxsovexkero.supabase.co',
    database: 'postgres',
    password: 'Imobum2026!',
    port: 5432,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');
        
        const sql = `
            CREATE TABLE IF NOT EXISTS service_requests (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                client_name TEXT NOT NULL,
                client_phone TEXT NOT NULL,
                category_slug TEXT NOT NULL,
                category_title TEXT NOT NULL,
                request_details TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TIMESTAMPTZ NOT NULL DEFAULT now()
            );
        `;
        
        console.log('Executing DDL...');
        await client.query(sql);
        console.log('Table service_requests created successfully!');
    } catch (e) {
        console.error('Error executing DDL:', e);
    } finally {
        await client.end();
    }
}

run();
