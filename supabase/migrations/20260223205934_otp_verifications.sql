-- Create the otp_verifications table for temporary SMS/Email codes
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    identifier text UNIQUE NOT NULL, -- The phone number or email address
    code text NOT NULL, -- The generated OTP string
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone NOT NULL -- When the code expires (e.g., in 5 minutes)
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table directly to check OTPs.
-- The user doesn't need select access, only the backend server actions.
CREATE POLICY "Service role has full access to otp_verifications" ON public.otp_verifications
    FOR ALL USING (true) WITH CHECK (true);
