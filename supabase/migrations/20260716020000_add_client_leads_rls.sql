-- Allow users to view leads matching their profile email
DROP POLICY IF EXISTS "Users can view leads matching their email" ON public.leads;
CREATE POLICY "Users can view leads matching their email"
    ON public.leads FOR SELECT
    USING (
        email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    );

-- Allow users to view and manage matches for leads matching their profile email
DROP POLICY IF EXISTS "Users can view matches for leads matching their email" ON public.lead_property_matches;
CREATE POLICY "Users can view matches for leads matching their email"
    ON public.lead_property_matches FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_property_matches.lead_id
            AND l.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can manage matches for leads matching their email" ON public.lead_property_matches;
CREATE POLICY "Users can manage matches for leads matching their email"
    ON public.lead_property_matches FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.leads l
            WHERE l.id = lead_property_matches.lead_id
            AND l.email = (SELECT email FROM public.profiles WHERE id = auth.uid())
        )
    );
