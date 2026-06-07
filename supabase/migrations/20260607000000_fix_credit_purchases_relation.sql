-- Fix relation check in PostgREST between credit_purchases and profiles by adding a direct foreign key
ALTER TABLE public.credit_purchases 
DROP CONSTRAINT IF EXISTS fk_credit_purchases_profiles;

ALTER TABLE public.credit_purchases
ADD CONSTRAINT fk_credit_purchases_profiles
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;
