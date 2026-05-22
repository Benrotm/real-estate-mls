import { Client } from 'pg';

const dbUrl = 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres';

const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    try {
        const res = await client.query(`
            SELECT 
                conname, 
                pg_get_constraintdef(oid) as def 
            FROM pg_constraint 
            WHERE conrelid = 'property_offers'::regclass;
        `);
        console.log("Constraints:", res.rows);
    } catch (e: any) {
        console.error("Error:", e.message);
    } finally {
        await client.end();
    }
}
run();
