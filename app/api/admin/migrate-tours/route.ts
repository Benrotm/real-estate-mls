import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { createClient } from '@/app/lib/supabase/server';

export async function GET() {
    // Return HTML form
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Database Migration Tool</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 min-h-screen flex items-center justify-center">
        <div class="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
            <h1 class="text-2xl font-bold mb-4 text-gray-800">Database Migration Tool</h1>
            <p class="mb-4 text-gray-600">The server needs your database password to run the setup script.</p>
            
            <form method="POST" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Database Password</label>
                    <input type="password" name="password" required class="w-full p-2 border rounded focus:ring-2 focus:ring-indigo-500" placeholder="Enter your database password">
                    <p class="text-xs text-gray-400 mt-1">If you forgot it, reset it in Supabase > Project Settings > Database.</p>
                </div>
                <button type="submit" class="w-full bg-indigo-600 text-white py-2 rounded font-semibold hover:bg-indigo-700 transition">Run Migration</button>
            </form>
        </div>
    </body>
    </html>
    `;
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const password = formData.get('password') as string;

    if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Hardcode known project details from user's earlier context
    const PROJECT_REF = 'cwfhcrftwsxsovexkero';
    const connectionString = `postgresql://postgres:${encodeURIComponent(password)}@db.${PROJECT_REF}.supabase.co:5432/postgres`;

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

        return NextResponse.json({ success: true, message: 'Migration executed successfully! You can now create tours.' });
    } catch (err: any) {
        if (client) await client.end();
        console.error('Migration failed:', err);
        return NextResponse.json({ error: `Migration failed: ${err.message}` }, { status: 500 });
    }
}
