-- Migration: 004_fix_registration_trigger.sql
-- Purpose: Automatically create a profile for new users with correct Role and Plan Limits.

-- 0. Ensure profiles table has necessary columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS listings_limit INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free';


-- 1. Create or Replace the Function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_limit INTEGER;
    default_featured_limit INTEGER;
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Extract metadata
    user_role := new.raw_user_meta_data->>'role';
    first_name := new.raw_user_meta_data->>'first_name';
    last_name := new.raw_user_meta_data->>'last_name';

    -- Default to 'client' if role is missing/invalid
    IF user_role IS NULL OR user_role NOT IN ('client', 'agent', 'owner', 'developer') THEN
        user_role := 'client';
    END IF;

    -- Fetch Plan Limits for the 'Free' tier of this role
    -- We assume a plan named 'Free' exists for each role from Migration 001
    SELECT listings_limit, featured_limit
    INTO default_limit, default_featured_limit
    FROM public.plans
    WHERE role = user_role AND name = 'Free'
    LIMIT 1;

    -- Fallbacks if no plan found (safety net)
    IF default_limit IS NULL THEN
        IF user_role = 'agent' THEN default_limit := 5;
        ELSIF user_role = 'owner' THEN default_limit := 1;
        ELSE default_limit := 0; -- client
        END IF;
    END IF;

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        listings_limit,
        bonus_listings,
        plan_tier
    )
    VALUES (
        new.id,
        user_role,
        TRIM(BOTH ' ' FROM (COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))),
        default_limit,
        0, -- bonus starts at 0
        'free'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create the Trigger
-- Drop first to ensure idempotency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill (Optional - strictly for dev environments where users might exist without profiles)
-- This tries to insert profiles for existing users who might be missing them.
-- DO NOT RUN THIS IN PRODUCTION blindly if you have complex logic.
-- INSERT INTO public.profiles (id, role, full_name, listings_limit, plan_tier)
-- SELECT 
--     id, 
--     COALESCE(raw_user_meta_data->>'role', 'client'),
--     'Existing User',
--     1,
--     'free'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM public.profiles)
-- ON CONFLICT DO NOTHING;
