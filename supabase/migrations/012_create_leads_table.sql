-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    
    -- Contact Info
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Status
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'viewing', 'negotiation', 'closed', 'lost')),
    source TEXT,
    notes TEXT,

    -- Preferences (Mirroring Property Criteria)
    preference_type TEXT CHECK (preference_type IN ('Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Investment', 'Business', 'Other')),
    preference_listing_type TEXT CHECK (preference_listing_type IN ('For Sale', 'For Rent')),
    
    preference_location_county TEXT,
    preference_location_city TEXT,
    preference_location_area TEXT,
    
    budget_min DECIMAL,
    budget_max DECIMAL,
    currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'RON')),
    
    preference_rooms_min INT,
    preference_rooms_max INT,
    preference_bedrooms_min INT,
    
    preference_surface_min DECIMAL, -- Usable area preference
    
    preference_partitioning TEXT,
    preference_comfort TEXT,
    
    preference_features JSONB DEFAULT '[]'::JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_leads_agent ON leads(agent_id);
CREATE INDEX idx_leads_status ON leads(status);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view own leads" ON leads
    FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can insert own leads" ON leads
    FOR INSERT WITH CHECK (auth.uid() = agent_id);

CREATE POLICY "Agents can update own leads" ON leads
    FOR UPDATE USING (auth.uid() = agent_id);

CREATE POLICY "Agents can delete own leads" ON leads
    FOR DELETE USING (auth.uid() = agent_id);

-- Admins
CREATE POLICY "Admins can view all leads" ON leads
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
