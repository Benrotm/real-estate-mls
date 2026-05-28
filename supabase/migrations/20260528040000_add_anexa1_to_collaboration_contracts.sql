-- Add Anexa 1 fields to collaboration_contracts
ALTER TABLE public.collaboration_contracts
ADD COLUMN IF NOT EXISTS anexa_data JSONB,
ADD COLUMN IF NOT EXISTS anexa_agent_signature TEXT,
ADD COLUMN IF NOT EXISTS anexa_owner_signature TEXT,
ADD COLUMN IF NOT EXISTS anexa_status VARCHAR(50) DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS anexa_signed_at TIMESTAMP WITH TIME ZONE;
