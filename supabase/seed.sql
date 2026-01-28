-- Create a test user (this is tricky in seed because auth.users is protected, but locally we can insert)
-- Ideally we use the Supabase CLI's specialized seed functionality or just insert into public tables if we assume user exists.
-- But for local dev, we can try inserting into auth.users if we are superuser.
-- HOWEVER, inserting into auth.users is complex due to hashing.
-- Better approach: "Mock" data in public tables assuming a user ID exists, OR just provide properties and users can register.

-- Strategy: Insert properties for a "known" user ID that we will likely create or exists.
-- Or better, rely on the user to register a user, then we manually insert properties?
-- No, let's try to insert a property with a hardcoded owner_id and hope we can create that user or it exists.
-- The user ID '430ed9f0-3164-4346-a7e3-8124f35b5053' was in the mock data. Let's use that.

-- NOTE: If this fails foreign key constraints (because user doesn't exist in auth.users), the seed will fail.
-- WE will skip inserting properties in seed.sql if we can't guarantee the user exists.
-- But wait, we can insert into profiles? No, profiles takes foreign key from auth.users.
-- So we cannot seed profiles/properties without a user in auth.users.
-- Supabase local dev usually has a default user?
-- Let's NOT create a seed file that might crash the reset.
-- Instead, we will rely on MANUAL creation of data via the app.
-- I'll skip creating seed.sql for now to minimize risk of errors.

-- Actually, having a seed file is very helpful.
-- I'll create a minimal one that inserts PLANS, as those are public and needed.
-- Wait, 001 and 002 migration already insert plans?
-- 001 updates plans. 002 creates plans.
-- Let's check 002. It creates the table but doesn't seem to INSERT initial plans.
-- 001 *updates* plans assuming they exist?
-- This suggests there was a migration 000 or seed that populated plans.
-- If I reset DB, plans table might be empty!
-- I should check if plans are populated.
-- I will create seed.sql to populate PLANS just in case.

INSERT INTO public.plans (role, name, price, currency, description, listings_limit, featured_limit, is_popular)
VALUES 
('client', 'Free', 0, 'USD', 'Basic access', 0, 0, false),
('owner', 'Free', 0, 'USD', 'List one property', 1, 0, false),
('owner', 'Premium', 29.99, 'USD', 'List 10 properties', 10, 2, true),
('agent', 'Free', 0, 'USD', 'Starter for agents', 5, 0, false),
('agent', 'Professional', 99.99, 'USD', 'For serious agents', 100, 10, true)
ON CONFLICT DO NOTHING;
