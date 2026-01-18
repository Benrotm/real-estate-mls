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
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Public properties are viewable by everyone" ON properties
    FOR SELECT USING (true);

-- Policies for messages (Simplified for demo, usually would be restricted to agents/admins)
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Policies for appointments
CREATE POLICY "Users can insert appointments" ON appointments
    FOR INSERT WITH CHECK (true);
