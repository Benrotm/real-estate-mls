-- Seed system features for all existing plans
-- Keys: leads_access, valuation_reports, market_insights
-- Default: TRUE (to maintain existing access)

DO $$
DECLARE
    plan_record RECORD;
BEGIN
    FOR plan_record IN SELECT * FROM public.plans LOOP
        -- Leads Access
        IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = plan_record.name AND role = plan_record.role AND feature_key = 'leads_access') THEN
            INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
            VALUES (plan_record.role, plan_record.name, 'leads_access', 'Leads Access', true, 10);
        END IF;

        -- Valuation Reports
        IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = plan_record.name AND role = plan_record.role AND feature_key = 'valuation_reports') THEN
            INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
            VALUES (plan_record.role, plan_record.name, 'valuation_reports', 'Valuation Reports', true, 11);
        END IF;

        -- Market Insights
        IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = plan_record.name AND role = plan_record.role AND feature_key = 'market_insights') THEN
            INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
            VALUES (plan_record.role, plan_record.name, 'market_insights', 'Market Insights', true, 12);
        END IF;
    END LOOP;
END $$;
