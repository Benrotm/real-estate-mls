-- 1. Ensure all users have a profile (Backfill)
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name,
    'super_admin' as role
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 2. Force Promote Everyone (Again, just to be sure)
UPDATE public.profiles
SET role = 'super_admin'
WHERE role != 'super_admin';

-- 3. Fix Profiles RLS: Allow Admins to View ALL Profiles
-- This ensures the 'owner:profiles()' join works in the All Properties list
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
