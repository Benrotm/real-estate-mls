-- Create properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    listing_type TEXT CHECK (listing_type IN ('For Sale', 'For Rent')),
    currency TEXT CHECK (currency IN ('USD', 'EUR')),
    title TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    lat DECIMAL,
    lng DECIMAL,
    price DECIMAL NOT NULL,
    beds INTEGER,
    baths INTEGER,
    sqft INTEGER,
    year_built INTEGER,
    property_type TEXT CHECK (property_type IN ('Apartment', 'House', 'Land', 'Commercial', 'Industrial', 'Business')),
    stories INTEGER,
    floor INTEGER,
    interior_rating INTEGER CHECK (interior_rating >= 1 AND interior_rating <= 10),
    lot_size DECIMAL,
    total_floors INTEGER,
    building_type TEXT,
    interior_condition TEXT,
    furnishing TEXT,
    virtual_tour_type TEXT,
    valuation_estimated_price DECIMAL,
    valuation_confidence INTEGER,
    valuation_last_updated TIMESTAMP WITH TIME ZONE,
    features TEXT[],
    images TEXT[],
    virtual_tour_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    agent_id UUID REFERENCES auth.users(id),
    owner_id UUID REFERENCES auth.users(id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    property_id UUID REFERENCES properties(id),
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    sender_phone TEXT,
    message_body TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    property_id UUID REFERENCES properties(id),
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    property_id UUID REFERENCES properties(id),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Create profiles table (Extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    role TEXT CHECK (role IN ('owner', 'client', 'agent', 'developer', 'admin', 'super_admin')) DEFAULT 'owner',
    plan_tier TEXT CHECK (plan_tier IN ('free', 'pro', 'enterprise')) DEFAULT 'free',
    listings_limit INTEGER DEFAULT 1,
    listings_count INTEGER DEFAULT 0,
    full_name TEXT,
    avatar_url TEXT
);

-- Create plans table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT CHECK (role IN ('owner', 'client', 'agent', 'developer')),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    button_text TEXT DEFAULT 'Get Started',
    full_price_label TEXT -- For display like "$29/month" if complex
);

-- Create plan_features table for dynamic pricing matrix
CREATE TABLE plan_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT CHECK (role IN ('owner', 'client', 'agent', 'developer')),
    plan_name TEXT NOT NULL, 
    -- We can link to plan_id optionally, but keeping string mapping for simplicity in this migration
    -- plan_id UUID REFERENCES plans(id), 
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    is_included BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Public properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

-- ... (Existing policies)

-- Policies for plans
CREATE POLICY "Public plans are viewable by everyone" ON plans
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage plans" ON plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );


-- Policies for messages (Simplified for demo, usually would be restricted to agents/admins)
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Policies for appointments
CREATE POLICY "Users can insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policies for plan_features
CREATE POLICY "Plan features are viewable by everyone" ON plan_features
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage plan features" ON plan_features
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan_tier, listings_limit)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', 'owner', 'free', 1);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger binding would normally be here, but Supabase auth triggers 
-- are often managed in the dashboard or via distinct migrations.
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
