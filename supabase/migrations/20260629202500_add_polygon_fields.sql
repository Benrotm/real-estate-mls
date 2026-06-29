-- Add polygon fields for area matching
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preference_location_polygon JSONB;
ALTER TABLE saved_searches ADD COLUMN IF NOT EXISTS location_polygon JSONB;
