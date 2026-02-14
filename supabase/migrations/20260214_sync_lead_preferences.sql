-- Add missing preference fields to leads table to match property add form
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS preference_baths_min INT,
ADD COLUMN IF NOT EXISTS preference_year_built_min INT,
ADD COLUMN IF NOT EXISTS preference_floor_min INT,
ADD COLUMN IF NOT EXISTS preference_floor_max INT,
ADD COLUMN IF NOT EXISTS preference_surface_max DECIMAL,
ADD COLUMN IF NOT EXISTS preference_building_type TEXT,
ADD COLUMN IF NOT EXISTS preference_interior_condition TEXT,
ADD COLUMN IF NOT EXISTS preference_furnishing TEXT;
