-- Fix for missing default value on properties.id
ALTER TABLE public.properties ALTER COLUMN id SET DEFAULT gen_random_uuid();
