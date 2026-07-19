-- Create calculator_requests table
CREATE TABLE IF NOT EXISTS public.calculator_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    property_value NUMERIC NOT NULL,
    selected_model TEXT NOT NULL,
    is_exclusive BOOLEAN NOT NULL,
    exclusivity_days INTEGER NOT NULL,
    selected_services JSONB NOT NULL,
    calculations JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.calculator_requests ENABLE ROW LEVEL SECURITY;

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.calculator_requests;

-- RLS Policies
CREATE POLICY "Anyone can insert calculator requests" ON public.calculator_requests
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view calculator requests" ON public.calculator_requests
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );
