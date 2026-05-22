import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = `
-- 1. Alter profiles table to add referral field
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Create credit_transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow safe re-runs)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.credit_transactions;

CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage transactions" ON public.credit_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 3. Create credit_purchases table
CREATE TABLE IF NOT EXISTS public.credit_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reference_id TEXT UNIQUE NOT NULL,
    amount_ron NUMERIC NOT NULL,
    credits INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'cancelled')) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on credit_purchases
ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Users can update own purchases" ON public.credit_purchases;
DROP POLICY IF EXISTS "Admins can manage purchases" ON public.credit_purchases;

CREATE POLICY "Users can view own purchases" ON public.credit_purchases
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.credit_purchases
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchases" ON public.credit_purchases
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage purchases" ON public.credit_purchases
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 4. Seed referral_settings in platform_settings
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES ('referral_settings', '{"referrer_bonus": 15, "invitee_bonus": 10, "commission_percentage": 10}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
`;

async function run() {
    let connectionString = process.env.DATABASE_URL;
    if (connectionString && connectionString.includes('pooler.supabase.com')) {
        connectionString = 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres';
    }
    if (!connectionString) {
        console.error("DATABASE_URL is missing from .env.local");
        process.exit(1);
    }

    console.log("Connecting to Database...");
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("CONNECTED!");
        console.log("Applying credits & referral migration SQL...");
        await client.query(sql);
        console.log("MIGRATION APPLIED SUCCESSFULLY!");
    } catch (err: any) {
        console.error("Migration failed:", err.message);
    } finally {
        await client.end();
    }
}

run();
