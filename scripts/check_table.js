const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const PIN = "Imobum2026!";
const PROJECT_REF = "cwfhcrftwsxsovexkero";

const client = new Client({
    host: `db.${PROJECT_REF}.supabase.co`,
    port: 5432,
    user: 'postgres',
    password: PIN,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'leads';
    `);
    console.log(res.rows);
    await client.end();
}
run();
