-- Add property_id column to collaboration_contracts
ALTER TABLE public.collaboration_contracts 
ADD COLUMN IF NOT EXISTS property_id TEXT REFERENCES public.properties(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_contracts_property ON public.collaboration_contracts(property_id);
