-- Add is_archived columns to profiles and leads tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
