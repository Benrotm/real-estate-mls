-- Add featured_limit column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_limit INTEGER DEFAULT 0;
