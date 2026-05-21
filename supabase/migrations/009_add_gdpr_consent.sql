-- Migration: 009_add_gdpr_consent.sql
-- Purpose: Add gdpr_consent and gdpr_consent_date to profiles table

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_consent BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMPTZ;

-- Reload Schema to update PostgREST
NOTIFY pgrst, 'reload schema';
