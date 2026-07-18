-- Drop the check constraint and recreate it to allow country, county, city, area
ALTER TABLE public.system_locations DROP CONSTRAINT IF EXISTS system_locations_type_check;

ALTER TABLE public.system_locations 
ADD CONSTRAINT system_locations_type_check 
CHECK (type IN ('country', 'county', 'city', 'area'));

-- Seed Country Romania
INSERT INTO public.system_locations (type, name, latitude, longitude) 
VALUES ('country', 'România', 45.943161, 24.96676)
ON CONFLICT DO NOTHING;

-- Link Timiș county to Romania
DO $$
DECLARE
    v_country_id UUID;
    v_county_id UUID;
BEGIN
    SELECT id INTO v_country_id FROM public.system_locations WHERE name = 'România' AND type = 'country' LIMIT 1;
    
    IF v_country_id IS NOT NULL THEN
        -- Insert County
        INSERT INTO public.system_locations (type, name, parent_id, latitude, longitude) 
        VALUES ('county', 'Timiș', v_country_id, 45.75372, 21.22571)
        ON CONFLICT DO NOTHING;
        
        SELECT id INTO v_county_id FROM public.system_locations WHERE name = 'Timiș' AND type = 'county' LIMIT 1;
        
        -- Link all existing cities (which currently have parent_id IS NULL) to Timiș county
        IF v_county_id IS NOT NULL THEN
            UPDATE public.system_locations
            SET parent_id = v_county_id
            WHERE type = 'city' AND parent_id IS NULL;
        END IF;
    END IF;
END $$;
