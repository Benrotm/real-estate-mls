-- Disable Valuation Reports and Market Insights for Owner Free Plan
DO $$
BEGIN
    -- 1. Valuation Reports
    -- Ensure it exists first (seeded previously), then update to false
    IF EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'valuation_reports') THEN
        UPDATE public.plan_features 
        SET is_included = false 
        WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'valuation_reports';
    ELSE
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Free', 'valuation_reports', 'Valuation Reports', false, 20);
    END IF;

    -- 2. Market Insights
    IF EXISTS (SELECT 1 FROM public.plan_features WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'market_insights') THEN
        UPDATE public.plan_features 
        SET is_included = false 
        WHERE role = 'owner' AND plan_name = 'Free' AND feature_key = 'market_insights';
    ELSE
        INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
        VALUES ('owner', 'Free', 'market_insights', 'Market Insights', false, 30);
    END IF;

END $$;
