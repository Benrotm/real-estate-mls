-- Add social media distribution toggles to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS publish_whatsapp_groups boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_facebook_groups boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_facebook_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_instagram boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS publish_tiktok boolean DEFAULT false;

-- Create partial indexes for social publish toggles
CREATE INDEX IF NOT EXISTS idx_properties_publish_whatsapp_groups ON public.properties(publish_whatsapp_groups) WHERE publish_whatsapp_groups = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_facebook_groups ON public.properties(publish_facebook_groups) WHERE publish_facebook_groups = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_facebook_page ON public.properties(publish_facebook_page) WHERE publish_facebook_page = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_instagram ON public.properties(publish_instagram) WHERE publish_instagram = true;
CREATE INDEX IF NOT EXISTS idx_properties_publish_tiktok ON public.properties(publish_tiktok) WHERE publish_tiktok = true;
