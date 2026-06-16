CREATE TABLE IF NOT EXISTS portal_activations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    portal_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT now(),
    approved_at TIMESTAMPTZ,
    UNIQUE(user_id, portal_name)
);

ALTER TABLE portal_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activations" ON portal_activations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activations" ON portal_activations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activations" ON portal_activations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update activations" ON portal_activations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );