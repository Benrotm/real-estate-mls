-- Safely insert/update plan features using DO block
DO $$
BEGIN
    -- 1. Insert 'Pro' plan features for Owner if they don't exist
    IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Pro' AND feature_key = 'leads_access') THEN
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Pro', 'leads_access', 'Leads Access', true, 10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Pro' AND feature_key = 'valuation_reports') THEN
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Pro', 'valuation_reports', 'Valuation Reports', true, 20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Pro' AND feature_key = 'market_insights') THEN
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Pro', 'market_insights', 'Market Insights', true, 30);
    END IF;

    -- 2. Update 'Free' plan to DISABLE leads_access for Owners
    -- Ensure the record exists first (it should from seed, but let's be safe)
    IF EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'leads_access') THEN
        UPDATE public.plan_features 
        SET is_included = false 
        WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'leads_access';
    ELSE
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Free', 'leads_access', 'Leads Access', false, 10);
    END IF;

END $$;
