-- Add owner ID series/number and CNP fields for contract to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS contract_owner_id text,
ADD COLUMN IF NOT EXISTS contract_owner_cnp text;
