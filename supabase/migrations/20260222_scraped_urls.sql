-- Create a table specifically to track which Publi24 listings have already been scraped
-- This allows us to run cron jobs without accidentally inserting duplicates.

CREATE TABLE IF NOT EXISTS public.scraped_urls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'skipped'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast querying during the pre-scrape bulk check
CREATE INDEX IF NOT EXISTS idx_scraped_urls_url ON public.scraped_urls(url);
CREATE INDEX IF NOT EXISTS idx_scraped_urls_status ON public.scraped_urls(status);

-- Enable RLS
ALTER TABLE public.scraped_urls ENABLE ROW LEVEL SECURITY;

-- Admins can view and manage
CREATE POLICY "Admins can manage scraped_urls" ON public.scraped_urls
    FOR ALL
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
    );
