-- Add can_view_all_leads column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS can_view_all_leads BOOLEAN DEFAULT false;

-- Redefine leads RLS policies to check for can_view_all_leads
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON leads;

CREATE POLICY "Admins can view all leads"
ON leads FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can update all leads"
ON leads FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM profiles WHERE id = auth.uid()) = true
);

CREATE POLICY "Admins can delete all leads"
ON leads FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM profiles WHERE id = auth.uid()) = true
);

-- Lead Notes policies for Admins and Privileged Users
DROP POLICY IF EXISTS "Admins can manage all lead notes" ON lead_notes;
CREATE POLICY "Admins can manage all lead notes"
ON lead_notes FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM profiles WHERE id = auth.uid()) = true
);

-- Lead Activities policies for Admins and Privileged Users
DROP POLICY IF EXISTS "Admins can manage all lead activities" ON lead_activities;
CREATE POLICY "Admins can manage all lead activities"
ON lead_activities FOR ALL
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM profiles WHERE id = auth.uid()) = true
);
