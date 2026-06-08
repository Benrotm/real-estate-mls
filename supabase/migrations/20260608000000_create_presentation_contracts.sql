-- Migration: 20260608000000_create_presentation_contracts.sql
-- Purpose: Add verification fields to leads table and create presentation_contracts table.

-- 1. Add fields to public.leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS id_document_type TEXT,
ADD COLUMN IF NOT EXISTS id_series_number TEXT,
ADD COLUMN IF NOT EXISTS cnp TEXT;

-- 2. Create presentation_contracts table
CREATE TABLE IF NOT EXISTS public.presentation_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE,
    contract_number TEXT NOT NULL,
    contract_serial TEXT NOT NULL DEFAULT 'VZN',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'signed')),
    negotiated_commission_type TEXT CHECK (negotiated_commission_type IN ('percent', 'fixed')),
    negotiated_commission_buy NUMERIC,
    negotiated_commission_rent NUMERIC,
    calculated_commission NUMERIC,
    property_price NUMERIC,
    agent_details JSONB NOT NULL,
    client_details JSONB NOT NULL,
    agent_signature TEXT,
    client_signature TEXT,
    is_locked BOOLEAN DEFAULT false,
    delete_requested BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    signed_at TIMESTAMPTZ
);

-- 3. Enable Realtime for presentation_contracts
ALTER PUBLICATION supabase_realtime ADD TABLE public.presentation_contracts;

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_presentation_contracts_agent ON public.presentation_contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_presentation_contracts_status ON public.presentation_contracts(status);
CREATE INDEX IF NOT EXISTS idx_presentation_contracts_property ON public.presentation_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_presentation_contracts_lead ON public.presentation_contracts(lead_id);

-- 5. Enable RLS
ALTER TABLE public.presentation_contracts ENABLE ROW LEVEL SECURITY;

-- 6. Policies (Allow public access to specific contract via UUID - signing pages need client/agent access without explicit login in some contexts, but let's match collaboration_contracts policies exactly)
CREATE POLICY "Public read access to presentation contracts" ON public.presentation_contracts
    FOR SELECT USING (true);

CREATE POLICY "Public update access to presentation contracts" ON public.presentation_contracts
    FOR UPDATE USING (true);

CREATE POLICY "Public insert access to presentation contracts" ON public.presentation_contracts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete access to presentation contracts" ON public.presentation_contracts
    FOR DELETE USING (true);

-- 7. Reload Schema to update PostgREST
NOTIFY pgrst, 'reload schema';
