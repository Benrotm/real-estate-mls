-- Create table for crowdsourced sold price history
CREATE TABLE IF NOT EXISTS public.property_sold_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    sold_price NUMERIC(12, 2) NOT NULL,
    sold_date DATE NOT NULL,
    notes TEXT,
    reporter_id UUID REFERENCES auth.users(id), -- Nullable if we allow anonymous reports later, but for now specific users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_verified BOOLEAN DEFAULT false -- Optional: admin verification
);

-- Index for querying sold history by property
CREATE INDEX IF NOT EXISTS idx_property_sold_history_property_id ON public.property_sold_history(property_id);
-- Index for comparable adjustments (recent sales)
CREATE INDEX IF NOT EXISTS idx_property_sold_history_date ON public.property_sold_history(sold_date);


-- Create table for caching environmental metrics (Air Quality, Solar, etc.)
CREATE TABLE IF NOT EXISTS public.property_environmental_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL UNIQUE,
    air_quality_index INTEGER, -- AQI
    air_quality_category TEXT, -- 'Good', 'Moderate', etc.
    solar_potential_score INTEGER, -- 0-100 score? or raw KWh? Let's genericize.
    solar_yearly_potential_kwh NUMERIC,
    pollen_level_score INTEGER, -- 0-5
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for lookup
CREATE INDEX IF NOT EXISTS idx_property_env_metrics_prop_id ON public.property_environmental_metrics(property_id);


-- Add preference to profiles to enable/disable this feature view
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS smart_valuation_enabled BOOLEAN DEFAULT true;


-- RLS Policies

-- property_sold_history:
ALTER TABLE public.property_sold_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view verified sold history (or all for now?)
CREATE POLICY "Everyone can view sold history" ON public.property_sold_history
    FOR SELECT USING (true);

-- Only authenticated users can insert (maybe restrict to agents later)
CREATE POLICY "Auth users can insert sold history" ON public.property_sold_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- property_environmental_metrics:
ALTER TABLE public.property_environmental_metrics ENABLE ROW LEVEL SECURITY;

-- Everyone can view metrics
CREATE POLICY "Everyone can view environmental metrics" ON public.property_environmental_metrics
    FOR SELECT USING (true);

-- System service role usually updates this, but allow auth users to trigger update if needed (logic handled in server action)
CREATE POLICY "Service role manages environmental metrics" ON public.property_environmental_metrics
    FOR ALL USING (auth.role() = 'service_role');
