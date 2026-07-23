-- Migration: 20260723110000_instant_ai_activation_setting.sql

-- Seed default credit cost for instant AI activation
INSERT INTO public.admin_settings (key, value, description)
VALUES ('instant_ai_activation_cost', '5', 'Costul în credite pentru activarea instantă cu AI a potrivirilor')
ON CONFLICT (key) DO NOTHING;

NOTIFY pgrst, 'reload schema';
