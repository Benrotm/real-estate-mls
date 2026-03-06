const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function fixRLS() {
    // Try forcing port 6543 (Transaction Pooler)
    const dbUrl = process.env.DATABASE_URL.replace(':5432/', ':6543/');
    console.log('Using DB URL (port 6543):', dbUrl.replace(/:([^:@]+)@/, ':****@'));

    const client = new Client({
        connectionString: dbUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('Connected to DB successfully');

        console.log('Updating scrape_jobs policy...');
        await client.query('DROP POLICY IF EXISTS "Admins can manage scrape_jobs" ON public.scrape_jobs');
        await client.query(`
            CREATE POLICY "Admins can manage scrape_jobs" ON public.scrape_jobs
            FOR ALL
            USING (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
            )
        `);

        console.log('Updating scrape_logs policy...');
        await client.query('DROP POLICY IF EXISTS "Admins can manage scrape_logs" ON public.scrape_logs');
        await client.query(`
            CREATE POLICY "Admins can manage scrape_logs" ON public.scrape_logs
            FOR ALL
            USING (
                (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
            )
        `);

        console.log('RLS policies updated successfully');
    } catch (err) {
        console.error('Connection/Execution Error:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
    } finally {
        await client.end();
    }
}

fixRLS();
