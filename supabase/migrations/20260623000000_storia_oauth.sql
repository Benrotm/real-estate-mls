-- Create storia_tokens table
CREATE TABLE IF NOT EXISTS public.storia_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add storia_id to properties table to track published listing IDs
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS storia_id TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.storia_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own tokens" ON public.storia_tokens
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all tokens" ON public.storia_tokens
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );
