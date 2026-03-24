-- 1. Team Support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES auth.users(id);

CREATE TABLE IF NOT EXISTS public.team_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES auth.users(id) NOT NULL,
    invitee_email TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Basic RLS for team_invitations (Server-side API using Service Role will mostly manage this, but good practice to have)
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agency can see their invites" ON public.team_invitations FOR SELECT USING (auth.uid() = agency_id);


-- 2. Transactions & Deals Tracking
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) NOT NULL,
    agency_id UUID REFERENCES auth.users(id), 
    property_ref TEXT, 
    lead_ref TEXT, 
    transaction_type TEXT CHECK (transaction_type IN ('sale', 'rent')),
    transaction_value DECIMAL NOT NULL DEFAULT 0,
    commission_amount DECIMAL NOT NULL DEFAULT 0,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can see their own transactions" ON public.transactions FOR SELECT USING (auth.uid() = agent_id);
-- Agency admins view logic will be handled via server-side API or explicit agency checks.


-- 3. Expenses & Revenues (ROI Tracking)
CREATE TABLE IF NOT EXISTS public.financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    agency_id UUID REFERENCES auth.users(id),
    record_type TEXT CHECK (record_type IN ('expense', 'revenue')),
    category TEXT NOT NULL,
    amount DECIMAL NOT NULL DEFAULT 0,
    description TEXT,
    record_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own financial records" ON public.financial_records FOR SELECT USING (auth.uid() = user_id);


-- 4. Daily Activities Tracker
CREATE TABLE IF NOT EXISTS public.agent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES auth.users(id) NOT NULL,
    date DATE NOT NULL,
    activity_type TEXT NOT NULL, 
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(agent_id, date, activity_type) 
);

ALTER TABLE public.agent_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can see their own activities" ON public.agent_activities FOR SELECT USING (auth.uid() = agent_id);
