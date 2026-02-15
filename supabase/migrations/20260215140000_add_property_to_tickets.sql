-- Add property_id to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL;

-- Enable RLS for this new column if needed (policies might already cover it, but let's check)
-- Existing policies cover "Select" for owner and admins, and "Insert" for owner.
-- Adding property_id doesn't change RLS policies structure unless we want to allow 
-- users to see tickets related to a property they don't own (which we generally don't for standard tickets, 
-- but maybe for reports? For now, standard RLS applies: user sees their own tickets).
