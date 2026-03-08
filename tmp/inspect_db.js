const { Client } = require('pg');

const client = new Client({
    connectionString: "postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres"
});

async function inspect() {
    try {
        await client.connect();
        console.log('--- DB INSPECTION ---');

        // 1. Current DB
        const dbRes = await client.query('SELECT current_database(), current_schema(), current_user');
        console.log('Context:', dbRes.rows[0]);

        // 2. List Tables in public
        const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', tablesRes.rows.map(r => r.table_name).join(', '));

        // 3. Inspect Notifications if exists
        const hasNotif = tablesRes.rows.some(r => r.table_name === 'notifications');
        if (hasNotif) {
            const columnsRes = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications'");
            console.log('Notifications Columns:', columnsRes.rows);
        } else {
            console.log('Notifications table NOT FOUND');
        }

    } catch (err) {
        console.error('Inspection Error:', err);
    } finally {
        await client.end();
    }
}

inspect();
