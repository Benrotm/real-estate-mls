-- Create collaboration_contracts table
CREATE TABLE IF NOT EXISTS public.collaboration_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    contract_number TEXT NOT NULL,
    contract_serial TEXT NOT NULL DEFAULT 'IMB',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'signed')),
    language TEXT DEFAULT 'ro' CHECK (language IN ('ro', 'en')),
    agent_details JSONB NOT NULL,
    form_data JSONB NOT NULL,
    agent_signature TEXT,
    owner_signature TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    signed_at TIMESTAMPTZ
);

-- Enable Realtime for collaboration_contracts
ALTER PUBLICATION supabase_realtime ADD TABLE public.collaboration_contracts;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_collaboration_contracts_agent ON public.collaboration_contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_contracts_status ON public.collaboration_contracts(status);

-- Enable RLS
ALTER TABLE public.collaboration_contracts ENABLE ROW LEVEL SECURITY;

-- Policies (Allow public access to specific contract via UUID)
CREATE POLICY "Public read access to collaboration contracts" ON public.collaboration_contracts
    FOR SELECT USING (true);

CREATE POLICY "Public update access to collaboration contracts" ON public.collaboration_contracts
    FOR UPDATE USING (true);

CREATE POLICY "Public insert access to collaboration contracts" ON public.collaboration_contracts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Public delete access to collaboration contracts" ON public.collaboration_contracts
    FOR DELETE USING (true);
