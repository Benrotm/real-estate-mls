-- Add days_on_market and private contact fields to property_sold_history
ALTER TABLE public.property_sold_history
ADD COLUMN IF NOT EXISTS days_on_market INTEGER,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS owner_phone TEXT,
ADD COLUMN IF NOT EXISTS private_documents JSONB DEFAULT '[]'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.property_sold_history.days_on_market IS 'Number of days the property was on the market before being sold';
COMMENT ON COLUMN public.property_sold_history.owner_name IS 'Private owner name at time of sale';
COMMENT ON COLUMN public.property_sold_history.owner_phone IS 'Private owner phone at time of sale';
COMMENT ON COLUMN public.property_sold_history.private_documents IS 'Private documents uploaded during sale report';
