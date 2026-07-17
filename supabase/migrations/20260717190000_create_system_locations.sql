-- Create system_locations table
CREATE TABLE IF NOT EXISTS public.system_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('city', 'area')),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_locations ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Publicly readable for all (including unauthenticated guests on the invite questionnaire)
DROP POLICY IF EXISTS "System locations are publicly readable" ON public.system_locations;
CREATE POLICY "System locations are publicly readable"
    ON public.system_locations FOR SELECT
    USING (true);

-- ALL policy: Restricted to super_admin roles
DROP POLICY IF EXISTS "Superadmins can manage system locations" ON public.system_locations;
CREATE POLICY "Superadmins can manage system locations"
    ON public.system_locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'super_admin'
        )
    );

-- Seed default cities
INSERT INTO public.system_locations (type, name) VALUES
('city', 'Timișoara'),
('city', 'Dumbrăvița'),
('city', 'Giroc'),
('city', 'Ghiroda'),
('city', 'Moșnița Nouă'),
('city', 'Săcălaz'),
('city', 'Sânandrei'),
('city', 'Sânmihaiu Român'),
('city', 'Giarmata'),
('city', 'Remetea Mare'),
('city', 'Dudeștii Noi'),
('city', 'Becicherecu Mic'),
('city', 'Șag'),
('city', 'Orțișoara'),
('city', 'Pișchia'),
('city', 'Bucovăț')
ON CONFLICT (name) DO NOTHING;

-- Seed default areas/neighbourhoods
INSERT INTO public.system_locations (type, name) VALUES
('area', 'Aradului'),
('area', 'Bastion'),
('area', 'Blașcovici'),
('area', 'Braytim'),
('area', 'Bucovina'),
('area', 'Buziașului'),
('area', 'Centru / Cetate'),
('area', 'Ciarda Roșie'),
('area', 'Circumvalațiunii'),
('area', 'Complexul Studențesc'),
('area', 'Dacia'),
('area', 'Dâmbovița'),
('area', 'Elisabetin'),
('area', 'Fabric'),
('area', 'Fratelia'),
('area', 'Freidorf'),
('area', 'Ghiroda Nouă'),
('area', 'Girocului'),
('area', 'Iosefin'),
('area', 'Kuncz'),
('area', 'Lipovei'),
('area', 'Martirilor'),
('area', 'Mehala'),
('area', 'Modern'),
('area', 'Olimpia–Stadion'),
('area', 'Plopi'),
('area', 'Ronaț'),
('area', 'Soarelui'),
('area', 'Steaua'),
('area', 'Șagului'),
('area', 'Telegrafului'),
('area', 'Tipografilor'),
('area', 'Torontalului'),
('area', 'UMT–Pădurea Verde'),
('area', 'Take Ionescu'),
('area', 'Simion Bărnuțiu'),
('area', 'Calea Urseni'),
('area', 'Zona Odobescu'),
('area', 'Zona Medicină'),
('area', 'Eso'),
('area', 'Planetei'),
('area', 'Vatra Satului')
ON CONFLICT (name) DO NOTHING;
