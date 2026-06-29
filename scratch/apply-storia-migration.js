require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
}

// Convert pooler URL to direct database connection if pooler is used
if (dbUrl.includes('pooler.supabase.com')) {
    dbUrl = dbUrl.replace('postgres.cwfhcrftwsxsovexkero', 'postgres')
                 .replace('aws-0-eu-central-1.pooler.supabase.com', 'db.cwfhcrftwsxsovexkero.supabase.co');
}

const client = new Client({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    console.log("Connecting to Database...");
    await client.connect();
    console.log("Reading migration SQL...");
    const sqlPath = path.join(__dirname, '../supabase/migrations/20260623000000_storia_oauth.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    try {
        console.log("Executing migration...");
        await client.query(sql);
        console.log("Migration executed successfully!");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    } finally {
        await client.end();
    }
}
run();
