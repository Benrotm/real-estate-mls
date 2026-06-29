import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Read the connection string from .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const dbUrlMatch = envFile.match(/DATABASE_URL=(.+)/);

if (!dbUrlMatch) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

// Ensure the connection string forces port 6543 (session pooler for DDL) 
// or use the direct connection string. 5432 with transaction pooling might fail on DDL.
// Actually, let's just try the provided URL first.
let dbUrl = dbUrlMatch[1].trim();
// Supabase pooling with pg requires ssl=true, but we can just use the exact connection string
if (!dbUrl.includes('sslmode=require')) {
    dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'sslmode=require';
}

const client = new Client({ 
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database.');
        
        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260629202500_add_polygon_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');
        
        console.log('Executing migration...');
        await client.query(sql);
        console.log('Migration executed successfully!');
    } catch (e) {
        console.error('Error executing migration:', e);
    } finally {
        await client.end();
    }
}

run();
