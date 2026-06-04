-- Add lock and delete requested fields to collaboration_contracts
ALTER TABLE public.collaboration_contracts
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS delete_requested BOOLEAN DEFAULT false;
