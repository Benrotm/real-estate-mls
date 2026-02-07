-- update RLS policy to allow viewing of all tours (so shared links work even if draft)
DROP POLICY IF EXISTS "Public tours are viewable by everyone" ON public.virtual_tours;

CREATE POLICY "Public tours are viewable by everyone" 
ON public.virtual_tours FOR SELECT 
USING (true);
