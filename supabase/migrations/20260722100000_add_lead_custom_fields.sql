-- Add move_in_date, occupants_info, and liked_listings_links to leads table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS move_in_date DATE,
ADD COLUMN IF NOT EXISTS occupants_info TEXT,
ADD COLUMN IF NOT EXISTS liked_listings_links TEXT;
