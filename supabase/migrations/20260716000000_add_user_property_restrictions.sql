-- Migration: 20260716000000_add_user_property_restrictions.sql
-- Add is_approved column and access matrix restrictions table.

-- 1. Add is_approved to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;

-- 2. Create user_property_restrictions table
CREATE TABLE IF NOT EXISTS public.user_property_restrictions (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    allowed_types text[] DEFAULT '{}'::text[],
    allowed_transactions text[] DEFAULT '{}'::text[],
    allowed_cities text[] DEFAULT '{}'::text[],
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.user_property_restrictions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Allow select for self" ON public.user_property_restrictions;
CREATE POLICY "Allow select for self" ON public.user_property_restrictions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins all" ON public.user_property_restrictions;
CREATE POLICY "Allow admins all" ON public.user_property_restrictions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
        )
    );

-- 5. Re-create / update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_limit INTEGER;
    default_featured_limit INTEGER;
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    user_email TEXT;
    user_phone TEXT;
    referred_by_id UUID := NULL;
    registration_open_val BOOLEAN := true;
    is_user_approved BOOLEAN := true;
BEGIN
    -- Extract metadata
    user_role := new.raw_user_meta_data->>'role';
    first_name := new.raw_user_meta_data->>'first_name';
    last_name := new.raw_user_meta_data->>'last_name';
    user_email := new.email;
    user_phone := new.raw_user_meta_data->>'phone';

    -- Default to 'client' if role is missing/invalid
    IF user_role IS NULL OR user_role NOT IN ('client', 'agent', 'owner', 'developer') THEN
        user_role := 'client';
    END IF;

    -- Check if registration is open or requires admin approval
    BEGIN
        SELECT COALESCE(
            CASE 
                WHEN value::text = 'true' OR value::text = '"true"' THEN true
                WHEN value::text = 'false' OR value::text = '"false"' THEN false
                ELSE true
            END, 
            true
        )
        INTO registration_open_val
        FROM public.admin_settings
        WHERE key = 'registration_open'
        LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
        registration_open_val := true;
    END;

    IF NOT registration_open_val THEN
        is_user_approved := false;
    END IF;

    -- Fetch Plan Limits for the 'Free' tier of this role
    SELECT listings_limit, featured_limit
    INTO default_limit, default_featured_limit
    FROM public.plans
    WHERE role = user_role AND name = 'Free'
    LIMIT 1;

    -- Fallbacks
    IF default_limit IS NULL THEN
        IF user_role = 'agent' THEN default_limit := 5;
        ELSIF user_role = 'owner' THEN default_limit := 1;
        ELSE default_limit := 0; -- client
        END IF;
    END IF;

    -- Safe cast referred_by to UUID
    IF new.raw_user_meta_data->>'referred_by' IS NOT NULL AND new.raw_user_meta_data->>'referred_by' != '' THEN
        BEGIN
            referred_by_id := (new.raw_user_meta_data->>'referred_by')::UUID;
        EXCEPTION WHEN OTHERS THEN
            referred_by_id := NULL;
        END;
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        email,
        phone,
        listings_limit,
        bonus_listings,
        plan_tier,
        referred_by,
        is_approved
    )
    VALUES (
        new.id,
        user_role,
        TRIM(BOTH ' ' FROM (COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))),
        user_email,
        user_phone,
        default_limit,
        0,
        'free',
        referred_by_id,
        is_user_approved
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Seed admin_settings defaults
INSERT INTO public.admin_settings (key, value, description)
VALUES 
    ('properties_page_public', 'true', 'Toggle if properties catalog and detail views are public or registered users only'),
    ('registration_open', 'true', 'Toggle if registration is open to everyone or requires admin approval before login')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
