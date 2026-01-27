
-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Main Types
    type TEXT CHECK (type IN ('Apartment', 'House', 'Commercial', 'Industrial', 'Land', 'Investment', 'Business', 'Other')),
    listing_type TEXT CHECK (listing_type IN ('For Sale', 'For Rent')),
    
    -- Location
    location_county TEXT,
    location_city TEXT,
    location_area TEXT, -- Neighborhood/Area
    address TEXT,
    latitude DECIMAL,
    longitude DECIMAL,
    
    -- Financials
    price DECIMAL NOT NULL,
    currency TEXT DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'RON')),
    
    -- Specs
    rooms INT,          -- Total rooms
    bedrooms INT,
    bathrooms INT,
    
    area_usable DECIMAL, -- mp utili
    area_built DECIMAL,  -- mp construiti
    
    year_built INT,
    floor INT,           -- Current floor
    total_floors INT,    -- Total floors in building
    
    -- Details
    partitioning TEXT,   -- decomandat, semidecomandat, etc.
    comfort TEXT,        -- 1, 2, lux, etc.
    
    -- Features (JSONB to store array of strings or flags)
    features JSONB DEFAULT '[]'::JSONB, 
    -- checkboxes like: video, virtual_tour, commission_0, exclusive, luxury, hotel_regime, foreclosure (executare silita)
    
    -- Media
    images TEXT[] DEFAULT '{}',
    video_url TEXT,
    virtual_tour_url TEXT,
    
    -- Meta
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'sold', 'draft')),
    promoted BOOLEAN DEFAULT false,
    views_count INT DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common filters
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_type ON properties(type);
CREATE INDEX idx_properties_listing_type ON properties(listing_type);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_location ON properties(location_city, location_area);
CREATE INDEX idx_properties_rooms ON properties(rooms);
CREATE INDEX idx_properties_status ON properties(status);

-- RLS Policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Everyone can view active properties
CREATE POLICY "Public properties are viewable by everyone" ON properties
    FOR SELECT USING (status = 'active');

-- Owners can view all their own properties
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (auth.uid() = owner_id);

-- Owners can insert their own properties
CREATE POLICY "Users can create properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Owners can update their own properties
CREATE POLICY "Users can update own properties" ON properties
    FOR UPDATE USING (auth.uid() = owner_id);

-- Owners can delete their own properties
CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (auth.uid() = owner_id);

-- Admins can view/edit all properties (optional, good for management)
CREATE POLICY "Admins can view all properties" ON properties
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
    );
