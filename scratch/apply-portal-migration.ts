import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const PIN = "Imobum2026!";
const PROJECT_REF = "cwfhcrftwsxsovexkero";

const configs = [
    // Pooler - Transaction mode (6543)
    {
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: PIN,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    },
    // Pooler - Session mode (5432)
    {
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 5432,
        user: `postgres.${PROJECT_REF}`,
        password: PIN,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    },
    // Direct connection
    {
        host: `db.${PROJECT_REF}.supabase.co`,
        port: 5432,
        user: 'postgres',
        password: PIN,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    }
];

const MIGRATIONS = [
    'supabase/migrations/20260616120000_portal_activations.sql'
];

async function run() {
    for (const config of configs) {
        console.log(`\n--- Attempting connection to ${config.host}:${config.port} (User: ${config.user}) ---`);
        const client = new Client(config);

        try {
            await client.connect();
            console.log("CONNECTED!");

            for (const migration of MIGRATIONS) {
                console.log(`Applying ${migration}...`);
                const sqlPath = path.join(__dirname, '..', migration);
                const sql = fs.readFileSync(sqlPath, 'utf8');
                await client.query(sql);
                console.log(`SUCCESS: ${migration}`);
            }

            console.log("\n✅ ALL MIGRATIONS APPLIED SUCCESSFULLY!");
            await client.end();
            return;
        } catch (err: any) {
            console.error(`FAILED: ${err.message}`);
            try { await client.end(); } catch { }
        }
    }

    console.error("\n❌ ALL CONNECTION ATTEMPTS FAILED.");
    process.exit(1);
}

run();
