-- Add limit columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS listings_limit INTEGER DEFAULT 1;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS featured_limit INTEGER DEFAULT 0;

-- Update existing plans with reasonable defaults (optional but good for consistency)
UPDATE plans SET listings_limit = 1, featured_limit = 0 WHERE role = 'owner' AND name = 'Free';
UPDATE plans SET listings_limit = 10, featured_limit = 2 WHERE role = 'owner' AND name = 'Premium';
UPDATE plans SET listings_limit = 5, featured_limit = 0 WHERE role = 'agent' AND name = 'Free';
UPDATE plans SET listings_limit = 100, featured_limit = 10 WHERE role = 'agent' AND name = 'Professional';
