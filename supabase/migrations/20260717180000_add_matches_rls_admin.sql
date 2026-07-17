-- Admins can view all matches
DROP POLICY IF EXISTS "Admins can view all matches" ON public.lead_property_matches;
CREATE POLICY "Admins can view all matches"
ON public.lead_property_matches FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM public.profiles WHERE id = auth.uid()) = true
);

-- Admins can manage all matches (Insert, Update, Delete)
DROP POLICY IF EXISTS "Admins can manage all matches" ON public.lead_property_matches;
CREATE POLICY "Admins can manage all matches"
ON public.lead_property_matches FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin' OR
  (SELECT can_view_all_leads FROM public.profiles WHERE id = auth.uid()) = true
);
