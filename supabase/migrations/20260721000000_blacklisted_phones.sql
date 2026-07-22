-- Create blacklisted_phones table if it does not exist
CREATE TABLE IF NOT EXISTS public.blacklisted_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    normalized_phone TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Create index on normalized_phone for fast matching
CREATE INDEX IF NOT EXISTS idx_blacklisted_phones_norm ON public.blacklisted_phones(normalized_phone);

-- Grant privileges
GRANT ALL ON public.blacklisted_phones TO postgres, service_role, authenticated;
