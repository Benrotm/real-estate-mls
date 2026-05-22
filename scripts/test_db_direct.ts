import { Client } from 'pg';

async function main() {
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        console.log("Connected directly!");
        const res = await client.query("SELECT NOW()");
        console.log("Result:", res.rows[0]);
    } catch (e: any) {
        console.error("Direct connection failed:", e.message);
    } finally {
        await client.end();
    }
}
main();
