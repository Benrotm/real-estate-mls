const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error("Missing DATABASE_URL in .env.local");
    process.exit(1);
}

async function run() {
    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Supabase/hosted DBs
        }
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL database successfully.");

        const sqlPath = path.join(__dirname, '../supabase/migrations/20260616120000_portal_activations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log("Executing migration SQL:\n", sql);

        await client.query(sql);
        console.log("Migration executed successfully!");

    } catch (err) {
        console.error("Failed to run migration:", err);
    } finally {
        await client.end();
    }
}

run();
