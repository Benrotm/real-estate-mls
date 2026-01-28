-- Add enhanced fields to properties table
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS building_type TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS interior_condition TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS furnishing TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS youtube_video_url TEXT;

-- Create indexes for new filterable columns
CREATE INDEX IF NOT EXISTS idx_properties_building_type ON public.properties(building_type);
CREATE INDEX IF NOT EXISTS idx_properties_interior_condition ON public.properties(interior_condition);
CREATE INDEX IF NOT EXISTS idx_properties_furnishing ON public.properties(furnishing);
