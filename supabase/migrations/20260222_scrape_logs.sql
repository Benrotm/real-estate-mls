-- Migration: 20260222_scrape_logs.sql
-- Description: Creates tables to track bulk scrape jobs and stream live terminal logs to the frontend via Supabase Realtime.

-- 1. Create scrape_jobs table
CREATE TABLE IF NOT EXISTS public.scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'running', -- 'running', 'stopped', 'completed', 'failed'
    pages_to_scrape INTEGER DEFAULT 1,
    delay_ms INTEGER DEFAULT 12000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status ON public.scrape_jobs(status);

-- Enable RLS for jobs
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scrape_jobs" ON public.scrape_jobs
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- 2. Create scrape_logs table
CREATE TABLE IF NOT EXISTS public.scrape_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.scrape_jobs(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    log_level TEXT DEFAULT 'info', -- 'info', 'warn', 'error', 'success'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_job_id ON public.scrape_logs(job_id);

-- Enable RLS for logs
ALTER TABLE public.scrape_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scrape_logs" ON public.scrape_logs
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );

-- 3. Enable Supabase Realtime for the scrape_logs table
-- This allows the NextJS frontend to subscribe and emulate a live terminal
alter publication supabase_realtime add table public.scrape_logs;
alter publication supabase_realtime add table public.scrape_jobs;
