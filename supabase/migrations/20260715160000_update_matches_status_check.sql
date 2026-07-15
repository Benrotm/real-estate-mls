-- Update check constraint on lead_property_matches to allow 'to_verify' and 'sold' statuses
ALTER TABLE public.lead_property_matches 
DROP CONSTRAINT IF EXISTS lead_property_matches_status_check;

ALTER TABLE public.lead_property_matches 
ADD CONSTRAINT lead_property_matches_status_check 
CHECK (status IN ('saved', 'dismissed', 'sent', 'interested', 'not_interested', 'visit_scheduled', 'negotiation', 'sold', 'to_verify'));
