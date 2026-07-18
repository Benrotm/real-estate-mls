-- Drop unique constraint on name so identical area names can exist in different cities
ALTER TABLE public.system_locations DROP CONSTRAINT IF EXISTS system_locations_name_key;

-- Add parent_id self-reference to associate areas with cities
ALTER TABLE public.system_locations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.system_locations(id) ON DELETE CASCADE;

-- Add latitude and longitude coordinate columns
ALTER TABLE public.system_locations ADD COLUMN IF NOT EXISTS latitude NUMERIC(9, 6);
ALTER TABLE public.system_locations ADD COLUMN IF NOT EXISTS longitude NUMERIC(9, 6);

-- Set default coordinates for Timișoara
UPDATE public.system_locations 
SET latitude = 45.75372, longitude = 21.22571 
WHERE name = 'Timișoara' AND type = 'city';

-- Automatically link existing seeded areas to Timișoara city
DO $$
DECLARE
    v_city_id UUID;
BEGIN
    SELECT id INTO v_city_id FROM public.system_locations WHERE name = 'Timișoara' AND type = 'city' LIMIT 1;
    
    IF v_city_id IS NOT NULL THEN
        UPDATE public.system_locations 
        SET parent_id = v_city_id 
        WHERE type = 'area' AND parent_id IS NULL;
    END IF;
END $$;
