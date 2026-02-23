-- Add fingerprint column to prevent duplicates
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS fingerprint text,
ADD COLUMN IF NOT EXISTS is_duplicate boolean DEFAULT false;

-- Create an index to quickly look up duplicates by fingerprint
CREATE INDEX IF NOT EXISTS idx_properties_fingerprint ON public.properties(fingerprint);
