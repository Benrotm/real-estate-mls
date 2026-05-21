import { Client } from 'pg';

const sql = `
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
        referred_by
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
        referred_by_id
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function run() {
    console.log("Connecting to Database directly to update handle_new_user trigger...");
    const client = new Client({
        connectionString: 'postgres://postgres:Imobum2026!@db.cwfhcrftwsxsovexkero.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("CONNECTED!");
        await client.query(sql);
        console.log("TRIGGER UPDATED SUCCESSFULLY!");
    } catch (err: any) {
        console.error("Failed to update trigger:", err.message);
    } finally {
        await client.end();
    }
}

run();
