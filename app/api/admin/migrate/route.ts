
import { Pool } from 'pg';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (secret !== 'force_migration_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
        return NextResponse.json({ error: 'Missing DATABASE_URL' }, { status: 500 });
    }

    const pool = new Pool({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase/Vercel mostly
    });

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Allow public SELECT on virtual_tours
            await client.query(`DROP POLICY IF EXISTS "Public tours are viewable by everyone" ON public.virtual_tours;`);
            await client.query(`CREATE POLICY "Public tours are viewable by everyone" ON public.virtual_tours FOR SELECT USING (true);`);

            await client.query('COMMIT');
            return NextResponse.json({ success: true, message: 'Migration applied' });
        } catch (e: any) {
            await client.query('ROLLBACK');
            return NextResponse.json({ error: e.message }, { status: 500 });
        } finally {
            client.release();
        }
    } catch (e: any) {
        return NextResponse.json({ error: 'Connection failed: ' + e.message }, { status: 500 });
    } finally {
        await pool.end();
    }
}
