
-- Drop the old constraint
ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;

-- Add the new constraint with 'Hotel Regime'
ALTER TABLE properties ADD CONSTRAINT properties_listing_type_check 
CHECK (listing_type IN ('For Sale', 'For Rent', 'Hotel Regime'));
