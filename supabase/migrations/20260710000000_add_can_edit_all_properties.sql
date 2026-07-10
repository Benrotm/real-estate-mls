-- Add can_edit_all_properties column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_edit_all_properties BOOLEAN DEFAULT false;

-- Redefine properties RLS policies to check for can_edit_all_properties
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON properties;

CREATE POLICY "Admins can view all properties"
ON properties FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_edit_all_properties FROM profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can update all properties"
ON properties FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_edit_all_properties FROM profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can delete all properties"
ON properties FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_edit_all_properties FROM profiles WHERE id = auth.uid()) = true
);
