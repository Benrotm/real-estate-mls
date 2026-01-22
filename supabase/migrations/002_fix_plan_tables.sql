-- Enable extension just in case, or use gen_random_uuid() which is built-in
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; 

-- Re-create plans table with safely
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT CHECK (role IN ('owner', 'client', 'agent', 'developer')),
    name TEXT NOT NULL,
    price DECIMAL NOT NULL DEFAULT 0,
    currency TEXT DEFAULT 'USD',
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    button_text TEXT DEFAULT 'Get Started',
    full_price_label TEXT,
    listings_limit INTEGER DEFAULT 1,
    featured_limit INTEGER DEFAULT 0
);

-- Re-create plan_features table
CREATE TABLE IF NOT EXISTS public.plan_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT CHECK (role IN ('owner', 'client', 'agent', 'developer')),
    plan_name TEXT NOT NULL, 
    feature_key TEXT NOT NULL,
    feature_label TEXT NOT NULL,
    is_included BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0
);

-- Ensure RLS is enabled
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public plans are viewable by everyone" ON public.plans;
CREATE POLICY "Public plans are viewable by everyone" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage plans" ON public.plans;
CREATE POLICY "Admins can manage plans" ON public.plans FOR ALL USING (true);

DROP POLICY IF EXISTS "Plan features are viewable by everyone" ON public.plan_features;
CREATE POLICY "Plan features are viewable by everyone" ON public.plan_features FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage plan features" ON public.plan_features;
CREATE POLICY "Admins can manage plan features" ON public.plan_features FOR ALL USING (true);
