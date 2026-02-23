-- Create the admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies (Only admins can read/write, or public can read if needed? Usually just read for system)
-- Anyone can read the settings (so the UI can check if verification is required)
CREATE POLICY "Settings are viewable by everyone" ON public.admin_settings
    FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can update settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Insert default values
INSERT INTO public.admin_settings (key, value, description)
VALUES 
    ('require_ownership_verification', 'true', 'Require owners to verify via SMS or Email when importing a listing'),
    ('enable_anti_duplicate_intelligence', 'true', 'Enable address and feature hashing to prevent duplicate imports')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE PROCEDURE update_admin_settings_updated_at_column();
