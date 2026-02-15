
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const client = new Client({
    host: 'db.cwfhcrftwsxsovexkero.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Imobum2026!',
    database: 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
});

async function promoteToSuperAdmin() {
    try {
        await client.connect();

        // Find user ID
        const res = await client.query(`
      SELECT id FROM auth.users WHERE email = 'testuseragent@a.a';
    `);

        if (res.rows.length === 0) {
            console.log('User testuseragent@a.a not found.');
            return;
        }

        const userId = res.rows[0].id;
        console.log('Test User ID:', userId);

        // Update profile to super_admin
        await client.query(`
        UPDATE profiles SET role = 'super_admin' WHERE id = $1;
    `, [userId]);

        console.log('Promoted testuseragent@a.a to super_admin.');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

promoteToSuperAdmin();
