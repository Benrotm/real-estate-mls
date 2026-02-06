import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createClient } from '@/app/lib/supabase/server';

export async function GET() {
    // 1. Check Admin Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Run Migration using Server Env Vars
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.SUPABASE_DB_URL;

    if (!connectionString) {
        return NextResponse.json({ error: 'No database connection string found in server environment.' }, { status: 500 });
    }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const sql = `
            -- Create virtual_tours table
            CREATE TABLE IF NOT EXISTS public.virtual_tours (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
                title TEXT NOT NULL,
                description TEXT,
                property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
                tour_data JSONB DEFAULT '{}'::JSONB,
                thumbnail_url TEXT,
                status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Enable RLS
            ALTER TABLE public.virtual_tours ENABLE ROW LEVEL SECURITY;

            -- Policies (Dropping first to avoid errors if they partially exist)
            DROP POLICY IF EXISTS "Public tours are viewable by everyone" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Owners can view their own tours" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Owners can insert their own tours" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Owners can update their own tours" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Owners can delete their own tours" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Admins can view all tours" ON public.virtual_tours;
            DROP POLICY IF EXISTS "Admins can delete any tour" ON public.virtual_tours;

            CREATE POLICY "Public tours are viewable by everyone" ON public.virtual_tours FOR SELECT USING (status = 'active');
            CREATE POLICY "Owners can view their own tours" ON public.virtual_tours FOR SELECT USING (auth.uid() = owner_id);
            CREATE POLICY "Owners can insert their own tours" ON public.virtual_tours FOR INSERT WITH CHECK (auth.uid() = owner_id);
            CREATE POLICY "Owners can update their own tours" ON public.virtual_tours FOR UPDATE USING (auth.uid() = owner_id);
            CREATE POLICY "Owners can delete their own tours" ON public.virtual_tours FOR DELETE USING (auth.uid() = owner_id);
            CREATE POLICY "Admins can view all tours" ON public.virtual_tours FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')));
            CREATE POLICY "Admins can delete any tour" ON public.virtual_tours FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')));

            -- Storage
            INSERT INTO storage.buckets (id, name, public) VALUES ('virtual-tours', 'virtual-tours', true) ON CONFLICT (id) DO NOTHING;

            DROP POLICY IF EXISTS "Virtual Tours Images are publicly accessible" ON storage.objects;
            DROP POLICY IF EXISTS "Owners can upload tour images" ON storage.objects;
            DROP POLICY IF EXISTS "Owners can update their tour images" ON storage.objects;
            DROP POLICY IF EXISTS "Owners can delete their tour images" ON storage.objects;

            CREATE POLICY "Virtual Tours Images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'virtual-tours');
            CREATE POLICY "Owners can upload tour images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'virtual-tours' AND auth.uid()::text = (storage.foldername(name))[1]);
            CREATE POLICY "Owners can update their tour images" ON storage.objects FOR UPDATE USING (bucket_id = 'virtual-tours' AND auth.uid()::text = (storage.foldername(name))[1]);
            CREATE POLICY "Owners can delete their tour images" ON storage.objects FOR DELETE USING (bucket_id = 'virtual-tours' AND auth.uid()::text = (storage.foldername(name))[1]);
        `;

        await client.query(sql);
        await client.end();

        return NextResponse.json({ success: true, message: 'Migration executed successfully!' });
    } catch (err: any) {
        if (client) await client.end();
        console.error('Migration failed:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
