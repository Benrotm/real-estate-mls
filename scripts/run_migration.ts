import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

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
    'supabase/migrations/20260615180000_fix_matches_rls.sql',
    'supabase/migrations/20260710000000_add_can_edit_all_properties.sql',
    'supabase/migrations/20260715000000_add_can_view_all_leads.sql',
    'supabase/migrations/20260715160000_update_matches_status_check.sql',
    'supabase/migrations/20260716000000_add_user_property_restrictions.sql',
    'supabase/migrations/20260716000001_create_property_matrix_stats_rpc.sql',
    'supabase/migrations/20260716010000_add_signup_notification.sql',
    'supabase/migrations/20260716020000_add_client_leads_rls.sql',
    'supabase/migrations/20260717180000_add_matches_rls_admin.sql',
    'supabase/migrations/20260717190000_create_system_locations.sql',
    'supabase/migrations/20260731000000_add_is_archived_columns.sql'
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
                const sql = fs.readFileSync(migration, 'utf8');
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
