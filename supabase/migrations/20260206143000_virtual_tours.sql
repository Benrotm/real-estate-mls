-- Create virtual_tours table
CREATE TABLE IF NOT EXISTS public.virtual_tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
    tour_data JSONB DEFAULT '{}'::JSONB,
    thumbnail_url TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.virtual_tours ENABLE ROW LEVEL SECURITY;

-- Policies for virtual_tours
CREATE POLICY "Public tours are viewable by everyone" 
ON public.virtual_tours FOR SELECT 
USING (status = 'active');

CREATE POLICY "Owners can view their own tours" 
ON public.virtual_tours FOR SELECT 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their own tours" 
ON public.virtual_tours FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own tours" 
ON public.virtual_tours FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own tours" 
ON public.virtual_tours FOR DELETE 
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view and edit all tours"
ON public.virtual_tours FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Create Storage Bucket for Virtual Tours
INSERT INTO storage.buckets (id, name, public)
VALUES ('virtual-tours', 'virtual-tours', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Virtual Tours Images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'virtual-tours');

CREATE POLICY "Users can upload virtual tour images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'virtual-tours' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own virtual tour images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'virtual-tours' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own virtual tour images"
ON storage.objects FOR DELETE
USING (bucket_id = 'virtual-tours' AND auth.uid() = owner);
