-- Fix Admin Roles
-- 1. Reset everyone to 'agent' first (safety default for this app)
UPDATE profiles 
SET role = 'agent' 
WHERE email != 'bensilion@gmail.com';

-- 2. Explicitly set Ben to super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'bensilion@gmail.com';

-- 3. Ensure distinct role for specific demo users if needed (Optional, skipping for now to keep it simple)
