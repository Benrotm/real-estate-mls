-- Add property ownership fields to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS already_owns_properties BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS owned_properties_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ownership_purpose_investment BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ownership_purpose_personal BOOLEAN DEFAULT FALSE;
