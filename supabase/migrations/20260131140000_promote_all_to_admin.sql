-- Promote all existing users to super_admin to ensure access in dev/demo environment
UPDATE profiles 
SET role = 'super_admin' 
WHERE role != 'super_admin';

-- Ensure future inserts of 'admin@imobum.com' (if any) get super_admin
-- (This is handled by the trigger logic usually, but here we just fix existing)
