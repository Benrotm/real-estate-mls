-- Create sequence for friendly IDs starting at 1
CREATE SEQUENCE IF NOT EXISTS property_friendly_id_seq;

-- Add friendly_id column property with default value allowing auto-generation
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS friendly_id TEXT DEFAULT 'P' || nextval('property_friendly_id_seq');

-- Ensure the ID is unique
CREATE UNIQUE INDEX IF NOT EXISTS properties_friendly_id_idx ON properties(friendly_id);

-- Optional: If you ever need to manually insert one, you can, otherwise it auto-generates.
-- The default value handles the backfill for existing rows automatically in Postgres.
