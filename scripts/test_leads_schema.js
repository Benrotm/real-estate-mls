const { Client } = require('pg');
const client = new Client({ connectionString: 'postgres://postgres:Imobum2026%21@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres', ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'leads'"))
.then(res => { console.log(res.rows); client.end(); });
