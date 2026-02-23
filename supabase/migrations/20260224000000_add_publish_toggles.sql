-- Add portal distribution toggles to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS publish_imobiliare boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_storia boolean DEFAULT false;

-- Create an index to quickly filter properties that need to be published
CREATE INDEX IF NOT EXISTS idx_properties_publish_imobiliare ON public.properties(publish_imobiliare) WHERE publish_imobiliare = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_storia ON public.properties(publish_storia) WHERE publish_storia = true;
