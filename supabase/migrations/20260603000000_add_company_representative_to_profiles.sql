-- Migration: 20260603000000_add_company_representative_to_profiles.sql
-- Purpose: Add company_representative TEXT column to profiles table.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_representative TEXT;

-- Reload Schema to update PostgREST
NOTIFY pgrst, 'reload schema';
