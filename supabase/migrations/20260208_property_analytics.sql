-- Property Analytics Schema
-- Migration: 20260208_property_analytics.sql

-- 1. Property Page Views (tracking visits)
CREATE TABLE IF NOT EXISTS property_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    session_hash TEXT -- For deduplication (hashed session/IP)
);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- 2. Property Favorites (users saving properties)
CREATE TABLE IF NOT EXISTS property_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_property_favorites_property ON property_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_property_favorites_user ON property_favorites(user_id);

-- 3. Property Inquiries (contact form submissions)
CREATE TABLE IF NOT EXISTS property_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_inquiries_property ON property_inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_property_inquiries_created_at ON property_inquiries(created_at);

-- 4. Property Offers (Make an Offer submissions)
CREATE TABLE IF NOT EXISTS property_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    offer_amount DECIMAL NOT NULL,
    currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'RON')),
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_offers_property ON property_offers(property_id);
CREATE INDEX IF NOT EXISTS idx_property_offers_status ON property_offers(status);

-- RLS Policies

-- Property Views: Anyone can insert, owners/admins can read
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record property views" ON property_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can view their property views" ON property_views
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_views.property_id AND properties.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Property Favorites: Users manage own favorites
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites" ON property_favorites
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Property owners can see who favorited" ON property_favorites
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_favorites.property_id AND properties.owner_id = auth.uid())
    );

-- Property Inquiries: Anyone can submit, owners can read
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit inquiries" ON property_inquiries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Property owners can view inquiries" ON property_inquiries
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_inquiries.property_id AND properties.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

-- Property Offers: Logged in users can submit, owners can read/update
ALTER TABLE property_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit offers" ON property_offers
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own offers" ON property_offers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view and manage offers" ON property_offers
    FOR ALL USING (
        EXISTS (SELECT 1 FROM properties WHERE properties.id = property_offers.property_id AND properties.owner_id = auth.uid())
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
