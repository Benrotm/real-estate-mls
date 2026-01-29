-- Add new columns for enhanced listing details
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS social_media_url TEXT;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS personal_property_id TEXT;

-- Enable Storage for Property Images
-- Attempt to create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to property images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'property-images' );

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated Users Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'property-images' );

-- Policy: Allow users to update/delete their own images (optional but good)
CREATE POLICY "Users Update Own Images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'property-images' AND auth.uid() = owner );

CREATE POLICY "Users Delete Own Images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'property-images' AND auth.uid() = owner );
