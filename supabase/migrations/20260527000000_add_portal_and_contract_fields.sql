-- Add portal toggles and contract confidential data columns to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS publish_romimo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_homezz boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_imobiliarepret boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_country text,
ADD COLUMN IF NOT EXISTS contract_city text,
ADD COLUMN IF NOT EXISTS contract_street text,
ADD COLUMN IF NOT EXISTS contract_building text,
ADD COLUMN IF NOT EXISTS contract_floor text,
ADD COLUMN IF NOT EXISTS contract_apartment text,
ADD COLUMN IF NOT EXISTS contract_cf_topo text;

-- Add indexes for portal toggles
CREATE INDEX IF NOT EXISTS idx_properties_publish_romimo ON public.properties(publish_romimo) WHERE publish_romimo = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_homezz ON public.properties(publish_homezz) WHERE publish_homezz = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_imobiliarepret ON public.properties(publish_imobiliarepret) WHERE publish_imobiliarepret = true;
