-- Relax RLS for scrape_jobs to include 'admin' role
DROP POLICY IF EXISTS "Admins can manage scrape_jobs" ON public.scrape_jobs;
CREATE POLICY "Admins can manage scrape_jobs" ON public.scrape_jobs
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- Relax RLS for scrape_logs to include 'admin' role
DROP POLICY IF EXISTS "Admins can manage scrape_logs" ON public.scrape_logs;
CREATE POLICY "Admins can manage scrape_logs" ON public.scrape_logs
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
