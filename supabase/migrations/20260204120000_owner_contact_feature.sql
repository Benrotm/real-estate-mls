-- Add owner contact fields to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT;

COMMENT ON COLUMN properties.owner_name IS 'Private owner name, visible to admins and premium users';
COMMENT ON COLUMN properties.owner_phone IS 'Private owner phone, visible to admins and premium users';

-- Insert 'view_owner_contact' feature if not exists
-- We assume 'plan_features' table exists from previous context
INSERT INTO plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
VALUES 
    ('agent', 'Professional', 'view_owner_contact', 'View Owner Contact Info', true, 5),
    ('agent', 'Free', 'view_owner_contact', 'View Owner Contact Info', false, 5),
    ('owner', 'Premium', 'view_owner_contact', 'View Owner Contact Info', true, 5),
    ('owner', 'Free', 'view_owner_contact', 'View Owner Contact Info', false, 5)
ON CONFLICT DO NOTHING;
