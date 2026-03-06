import { NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { Client } from 'pg';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'super_admin' && user.email !== 'benoni.silion@blitz-timisoara.ro') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = new Client({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        await client.connect();

        const sql = `
            -- Relax RLS for scrape_jobs to include 'admin' role
            DROP POLICY IF EXISTS "Admins can manage scrape_jobs" ON public.scrape_jobs;
            CREATE POLICY "Admins can manage scrape_jobs" ON public.scrape_jobs
                FOR ALL
                USING (
                    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
                );

            -- Relax RLS for scrape_logs to include 'admin' role
            DROP POLICY IF EXISTS "Admins can manage scrape_logs" ON public.scrape_logs;
            CREATE POLICY "Admins can manage scrape_logs" ON public.scrape_logs
                FOR ALL
                USING (
                    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
                );
        `;

        await client.query(sql);
        await client.end();

        return NextResponse.json({ success: true, message: 'RLS Policies updated' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
