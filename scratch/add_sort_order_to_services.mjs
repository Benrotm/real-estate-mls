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
            ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 99;
        `;
        
        console.log('Executing DDL...');
        await client.query(sql);
        console.log('Column sort_order added successfully!');
    } catch (e) {
        console.error('Error executing DDL:', e);
    } finally {
        await client.end();
    }
}

run();
