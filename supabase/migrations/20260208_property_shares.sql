-- Property Shares Table (Share button click tracking)
-- Migration: 20260208_property_shares.sql

CREATE TABLE IF NOT EXISTS property_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id TEXT REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    share_method TEXT, -- 'whatsapp', 'facebook', 'twitter', 'email', 'copy', 'native'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_shares_property ON property_shares(property_id);
CREATE INDEX IF NOT EXISTS idx_property_shares_created_at ON property_shares(created_at);

-- RLS Policies
ALTER TABLE property_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record property shares" ON property_shares
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can view their property shares" ON property_shares
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_shares.property_id AND properties.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
