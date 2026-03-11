-- Add days_on_market to property_sold_history
ALTER TABLE public.property_sold_history
ADD COLUMN IF NOT EXISTS days_on_market INTEGER;

-- Comment on column
COMMENT ON COLUMN public.property_sold_history.days_on_market IS 'Number of days the property was on the market before being sold';
