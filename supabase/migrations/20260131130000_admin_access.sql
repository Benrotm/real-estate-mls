-- Enable Super Admin access to Leads and Properties

-- LEADS
DROP POLICY IF EXISTS "Admins can view all leads" ON leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON leads;
DROP POLICY IF EXISTS "Admins can delete all leads" ON leads;

CREATE POLICY "Admins can view all leads"
ON leads FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can update all leads"
ON leads FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can delete all leads"
ON leads FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

-- PROPERTIES
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete all properties" ON properties;

CREATE POLICY "Admins can view all properties"
ON properties FOR SELECT
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can update all properties"
ON properties FOR UPDATE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can delete all properties"
ON properties FOR DELETE
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
);
