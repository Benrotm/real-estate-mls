-- Migration: 20260723000000_ai_pipeline_activity_calendar.sql

-- 1. Create user_activity_logs table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'login', 'logout', 'page_view', 'button_click', 'credit_deduction', 'status_change'
    page_path TEXT,
    button_id TEXT,
    description TEXT,
    credits_used INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users insert own activity" ON public.user_activity_logs;
CREATE POLICY "Allow users insert own activity" ON public.user_activity_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users view own activity" ON public.user_activity_logs;
CREATE POLICY "Allow users view own activity" ON public.user_activity_logs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins all activity" ON public.user_activity_logs;
CREATE POLICY "Allow admins all activity" ON public.user_activity_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 2. Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    login_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_active_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    ended_at TIMESTAMPTZ,
    ip_address TEXT,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow users write own session" ON public.user_sessions;
CREATE POLICY "Allow users write own session" ON public.user_sessions
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins view all sessions" ON public.user_sessions;
CREATE POLICY "Allow admins view all sessions" ON public.user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- 3. Update lead_property_matches check constraint & add flag column
ALTER TABLE public.lead_property_matches
ADD COLUMN IF NOT EXISTS is_want_to_see_again BOOLEAN DEFAULT false;

ALTER TABLE public.lead_property_matches 
DROP CONSTRAINT IF EXISTS lead_property_matches_status_check;

ALTER TABLE public.lead_property_matches 
ADD CONSTRAINT lead_property_matches_status_check 
CHECK (status IN (
    'saved', 'dismissed', 'sent', 'interested', 'not_interested', 
    'visit_scheduled', 'negotiation', 'sold', 'to_verify',
    'to_call', 'to_recall', 'to_visit', 'thinking', 'winner'
));

-- 4. Create client_calendar_events table
CREATE TABLE IF NOT EXISTS public.client_calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL, -- 'De Sunat', 'De Resunat', 'De Vizionat'
    event_date TIMESTAMPTZ NOT NULL,
    details TEXT,
    property_title TEXT,
    property_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_calendar_events_user ON public.client_calendar_events(user_id);

ALTER TABLE public.client_calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow self manage calendar events" ON public.client_calendar_events;
CREATE POLICY "Allow self manage calendar events" ON public.client_calendar_events
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow admins view all calendar events" ON public.client_calendar_events;
CREATE POLICY "Allow admins view all calendar events" ON public.client_calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin')
        )
    );

NOTIFY pgrst, 'reload schema';
