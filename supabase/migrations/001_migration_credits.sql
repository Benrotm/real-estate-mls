-- 1. Add credits column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50;

-- Update existing profiles strictly to 50 credits if they are NULL
UPDATE profiles SET credits = 50 WHERE credits IS NULL;

-- 2. Create platform_settings table
CREATE TABLE IF NOT EXISTS platform_settings (
    setting_key TEXT PRIMARY KEY,
    setting_value JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Note: We do not need RLS right now if we only query via Server Actions with service_role,
-- but if using standard anon client, here's the RLS:
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform settings are viewable by auth users" ON platform_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage platform_settings" ON platform_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Seed Initial Values
INSERT INTO platform_settings (setting_key, setting_value)
VALUES 
  ('ai_api_keys', '{}'::jsonb),
  ('feature_costs', '{}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
