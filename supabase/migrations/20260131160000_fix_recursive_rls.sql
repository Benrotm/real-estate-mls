-- Ensure users can ALWAYS see their own profile to avoid recursive admin checks
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Ensure Admins can view ALL profiles (re-apply to be safe)
-- Note: 'true' condition for super_admins is handled by the data check, 
-- but we need to ensure the subquery doesn't recurse infinitely for the admin themselves.
-- The 'Users can view own profile' policy handles the admin's own row.
-- This policy handles OTHER rows.

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
