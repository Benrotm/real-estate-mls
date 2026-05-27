-- Create proposal_contracts table
CREATE TABLE IF NOT EXISTS public.proposal_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    agent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contract_number TEXT NOT NULL,
    contract_serial TEXT NOT NULL DEFAULT 'PROP',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'signed')),
    language TEXT DEFAULT 'ro' CHECK (language IN ('ro', 'en')),
    client_details JSONB,
    agent_details JSONB,
    property_details JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    signed_at TIMESTAMPTZ
);

-- Enable Realtime for proposal_contracts
ALTER PUBLICATION supabase_realtime ADD TABLE public.proposal_contracts;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_contracts_lead ON public.proposal_contracts(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposal_contracts_property ON public.proposal_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_proposal_contracts_agent ON public.proposal_contracts(agent_id);
CREATE INDEX IF NOT EXISTS idx_proposal_contracts_client ON public.proposal_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_proposal_contracts_status ON public.proposal_contracts(status);

-- Enable RLS
ALTER TABLE public.proposal_contracts ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Agents can manage own proposal contracts" ON public.proposal_contracts
    FOR ALL USING (auth.uid() = agent_id);

CREATE POLICY "Clients can view and update own proposal contracts" ON public.proposal_contracts
    FOR ALL USING (
        auth.uid() = client_id OR 
        EXISTS (
            SELECT 1 FROM public.leads 
            WHERE leads.id = proposal_contracts.lead_id 
            AND leads.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY "Admins can manage all proposal contracts" ON public.proposal_contracts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'super_admin')
        )
    );
