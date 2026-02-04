
-- Add private fields to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS private_notes TEXT,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN properties.private_notes IS 'Private notes visible only to owner and admin';
COMMENT ON COLUMN properties.documents IS 'Private documents/images visible only to owner and admin';
