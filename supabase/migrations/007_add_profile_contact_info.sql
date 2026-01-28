-- Migration: 007_add_profile_contact_info.sql
-- Purpose: Add email, phone, and avatar_url to profiles table to fix search errors.

-- 1. Add columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Update the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_limit INTEGER;
    default_featured_limit INTEGER;
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    user_email TEXT;
BEGIN
    -- Extract metadata
    user_role := new.raw_user_meta_data->>'role';
    first_name := new.raw_user_meta_data->>'first_name';
    last_name := new.raw_user_meta_data->>'last_name';
    user_email := new.email; -- Get email from auth.users (new.email)

    -- Default to 'client' if role is missing/invalid
    IF user_role IS NULL OR user_role NOT IN ('client', 'agent', 'owner', 'developer') THEN
        user_role := 'client';
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

    -- Insert into profiles
    INSERT INTO public.profiles (
        id,
        role,
        full_name,
        email, -- Insert email
        listings_limit,
        bonus_listings,
        plan_tier
    )
    VALUES (
        new.id,
        user_role,
        TRIM(BOTH ' ' FROM (COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))),
        user_email, -- Insert email
        default_limit,
        0,
        'free'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Backfill email for existing profiles (Optional, best effort)
-- We cannot easily join auth.users here regularly without specific permissions, 
-- but if running as superuser (migration), we can.
-- However, avoiding complex backfills in migration scripts is safer if auth schema usage is restricted.
-- Assuming new users will work. Existing users might need a manual fix or re-login update logic.
