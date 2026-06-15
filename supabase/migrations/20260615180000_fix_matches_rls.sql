-- Drop flawed policies
DROP POLICY IF EXISTS "Agents can view matches for team leads" ON public.lead_property_matches;
DROP POLICY IF EXISTS "Agents can manage matches for team leads" ON public.lead_property_matches;

-- Create correct policies utilizing get_user_team_members
CREATE POLICY "Agents can view matches for team leads"
    ON public.lead_property_matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_property_matches.lead_id
            AND auth.uid() IN (SELECT get_user_team_members(l.agent_id))
        )
    );

CREATE POLICY "Agents can manage matches for team leads"
    ON public.lead_property_matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_property_matches.lead_id
            AND auth.uid() IN (SELECT get_user_team_members(l.agent_id))
        )
    );
