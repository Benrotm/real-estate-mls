
-- Create property_events table
CREATE TABLE IF NOT EXISTS public.property_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id TEXT REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- e.g. "Open House", "Virtual Tour Event"
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    event_type TEXT DEFAULT 'open_house', -- 'open_house', 'virtual', 'private'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public Read (Everyone can see events for active properties)
CREATE POLICY "Public events are viewable by everyone"
    ON public.property_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_events.property_id
            -- AND status = 'active' -- Optional: only show events for active properties
        )
    );

-- 2. Owner Write (Owners can manage their own events)
CREATE POLICY "Owners can insert their own events"
    ON public.property_events
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_events.property_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their own events"
    ON public.property_events
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_events.property_id
            AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete their own events"
    ON public.property_events
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.properties
            WHERE id = property_events.property_id
            AND owner_id = auth.uid()
        )
    );

-- 3. Admin Access (Admins can do everything)
CREATE POLICY "Admins have full access to property_events"
    ON public.property_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'admin' OR role = 'super_admin')
        )
    );
