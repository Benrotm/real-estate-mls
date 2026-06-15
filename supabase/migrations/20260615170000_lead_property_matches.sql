-- Create lead_property_matches table
CREATE TABLE IF NOT EXISTS public.lead_property_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved' CHECK (status IN ('saved', 'dismissed', 'sent', 'interested', 'not_interested', 'visit_scheduled', 'negotiation')),
    agent_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(lead_id, property_id)
);

-- Add public_share_token to leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS public_share_token UUID DEFAULT gen_random_uuid();

-- Create RLS Policies for lead_property_matches
ALTER TABLE public.lead_property_matches ENABLE ROW LEVEL SECURITY;

-- Agents can view matches for their team's leads
CREATE POLICY "Agents can view matches for team leads"
    ON public.lead_property_matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            JOIN public.profiles lp ON l.agent_id = lp.id
            JOIN public.profiles up ON auth.uid() = up.id
            WHERE l.id = lead_property_matches.lead_id
            AND (
                l.agent_id = auth.uid() OR
                lp.agency_id = up.agency_id
            )
        )
    );

-- Agents can insert/update matches for their team's leads
CREATE POLICY "Agents can manage matches for team leads"
    ON public.lead_property_matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            JOIN public.profiles lp ON l.agent_id = lp.id
            JOIN public.profiles up ON auth.uid() = up.id
            WHERE l.id = lead_property_matches.lead_id
            AND (
                l.agent_id = auth.uid() OR
                (lp.agency_id = up.agency_id AND up.role IN ('manager', 'super_admin'))
                -- Adjust according to CRM update logic; allowing all team members or just managers. 
                -- We'll allow the owner or team members to save properties to a lead.
                OR (lp.agency_id = up.agency_id) 
            )
        )
    );

-- Public can update matches if they have the token (this is handled via server actions bypassing RLS, but if accessed directly, we keep it restricted to authenticated users to be safe).
-- Actually, it's better to rely on server actions (admin client) for public token updates to bypass RLS safely without exposing DB logic.


