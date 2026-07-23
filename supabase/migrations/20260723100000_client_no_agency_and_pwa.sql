-- Migration: 20260723100000_client_no_agency_and_pwa.sql

-- 1. Add find_self_from_owner and wants_agent_help to profiles & leads
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS find_self_from_owner BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_agent_help BOOLEAN DEFAULT true;

ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS find_self_from_owner BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wants_agent_help BOOLEAN DEFAULT true;

-- 2. Update handle_new_user trigger to handle 'client_no_agency'
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
    find_self_val BOOLEAN := true;
    wants_help_val BOOLEAN := true;
BEGIN
    -- Extract metadata
    user_role := new.raw_user_meta_data->>'role';
    first_name := new.raw_user_meta_data->>'first_name';
    last_name := new.raw_user_meta_data->>'last_name';
    user_email := new.email;
    user_phone := new.raw_user_meta_data->>'phone';

    -- Default to 'client' if role is missing/invalid
    IF user_role IS NULL OR user_role NOT IN ('client', 'client_no_agency', 'agent', 'owner', 'developer') THEN
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

    IF NOT registration_open_val OR user_role = 'client_no_agency' THEN
        is_user_approved := false;
    END IF;

    -- Fetch Plan Limits
    SELECT listings_limit, featured_limit
    INTO default_limit, default_featured_limit
    FROM public.plans
    WHERE (role = user_role OR (user_role = 'client_no_agency' AND role = 'client')) AND name = 'Free'
    LIMIT 1;

    -- Fallbacks
    IF default_limit IS NULL THEN
        IF user_role = 'agent' THEN default_limit := 5;
        ELSIF user_role = 'owner' THEN default_limit := 1;
        ELSE default_limit := 0; -- client / client_no_agency
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

    -- Extract custom checkboxes if provided in metadata, default BOTH to true
    IF new.raw_user_meta_data->>'find_self_from_owner' IS NOT NULL THEN
        find_self_val := (new.raw_user_meta_data->>'find_self_from_owner')::BOOLEAN;
    END IF;

    IF new.raw_user_meta_data->>'wants_agent_help' IS NOT NULL THEN
        wants_help_val := (new.raw_user_meta_data->>'wants_agent_help')::BOOLEAN;
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
        is_approved,
        find_self_from_owner,
        wants_agent_help
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
        is_user_approved,
        find_self_val,
        wants_help_val
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Seed default admin_setting for client_no_agency referral commission
INSERT INTO public.admin_settings (key, value, description)
VALUES ('referral_client_no_agency_commission_percentage', '15', 'Procent comision din consumul de credite al clienților fără agenție invitați')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
