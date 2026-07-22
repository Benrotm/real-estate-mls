import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config({ path: '.env.local' });

const PIN = "Imobum2026!";
const PROJECT_REF = "cwfhcrftwsxsovexkero";

const configs = [
    {
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: 6543,
        user: `postgres.${PROJECT_REF}`,
        password: PIN,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    },
    {
        host: `db.${PROJECT_REF}.supabase.co`,
        port: 5432,
        user: 'postgres',
        password: PIN,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    }
];

async function run() {
    for (const config of configs) {
        console.log(`Connecting to ${config.host}:${config.port}...`);
        const client = new Client(config);
        try {
            await client.connect();
            console.log("Connected to DB!");

            const sql = fs.readFileSync('supabase/migrations/20260721000000_blacklisted_phones.sql', 'utf8');
            await client.query(sql);
            console.log("SUCCESS: Applied blacklisted_phones migration!");

            await client.end();
            return;
        } catch (err: any) {
            console.error(`Attempt failed: ${err.message}`);
            try { await client.end(); } catch { }
        }
    }
    console.error("Migration failed on all connections.");
}

run();
