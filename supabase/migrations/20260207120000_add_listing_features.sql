-- Add 'make_an_offer' and 'virtual_tour' features to plan_features

DO $$
DECLARE
    plan_record RECORD;
BEGIN
    FOR plan_record IN SELECT * FROM public.plans LOOP
        -- Make an Offer (Enabled for everyone by default for now, or restrict if needed)
        IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = plan_record.name AND role = plan_record.role AND feature_key = 'make_an_offer') THEN
            INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
            VALUES (plan_record.role, plan_record.name, 'make_an_offer', 'Make an Offer', 
                CASE WHEN plan_record.name = 'Free' THEN false ELSE true END, 
                20);
        END IF;

        -- Virtual Tour (Enabled for Pro/Premium/Enterprise)
        IF NOT EXISTS (SELECT 1 FROM public.plan_features WHERE plan_name = plan_record.name AND role = plan_record.role AND feature_key = 'virtual_tour') THEN
            INSERT INTO public.plan_features (role, plan_name, feature_key, feature_label, is_included, sort_order)
            VALUES (plan_record.role, plan_record.name, 'virtual_tour', 'Virtual Tour Hosting', 
                CASE WHEN plan_record.name = 'Free' THEN false ELSE true END, 
                21);
        END IF;
    END LOOP;
END $$;
