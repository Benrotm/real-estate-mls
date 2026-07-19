-- Create service_categories table
CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'Target',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create service_providers table
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    cui_cif TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    category_slug TEXT NOT NULL REFERENCES public.service_categories(slug) ON DELETE CASCADE,
    document_url TEXT,
    city TEXT NOT NULL,
    radius_km INTEGER NOT NULL,
    description TEXT NOT NULL,
    orientative_prices TEXT,
    selected_plan TEXT NOT NULL, -- 'trial', 'standard', 'exclusivity'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Policies for service_categories
DROP POLICY IF EXISTS "Anyone can select service categories" ON public.service_categories;
CREATE POLICY "Anyone can select service categories" ON public.service_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage service categories" ON public.service_categories;
CREATE POLICY "Admins can manage service categories" ON public.service_categories
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- Policies for service_providers
DROP POLICY IF EXISTS "Anyone can select approved service providers" ON public.service_providers;
CREATE POLICY "Anyone can select approved service providers" ON public.service_providers
    FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Authenticated users can insert service provider requests" ON public.service_providers;
CREATE POLICY "Authenticated users can insert service provider requests" ON public.service_providers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage service providers" ON public.service_providers;
CREATE POLICY "Admins can manage service providers" ON public.service_providers
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_providers;

-- Seed Categories
INSERT INTO public.service_categories (title, slug, description, icon)
VALUES
('Notar public', 'notar-public', 'Programează vizite la notari parteneri pentru semnarea contractelor.', 'FileText'),
('Broker credite', 'broker-credite', 'Obține cel mai bun credit ipotecar prin intermediul simulatorului nostru.', 'Calculator'),
('Avocat specializat', 'avocat-specializat', 'Consultanță juridică completă pentru tranzacții în siguranță.', 'Shield'),
('Topometrist', 'topometrist', 'Măsurători cadastrale, intabulări și expertiză topografică.', 'Compass'),
('Evaluator ANEVAR', 'evaluator-anevar', 'Rapoarte oficiale de evaluare a proprietății tale.', 'TrendingUp'),
('Asigurări locuință', 'asigurari-locuinta', 'Asigurări obligatorii și facultative pentru imobilul tău.', 'Shield'),
('Servicii mutare', 'servicii-mutare', 'Transport autorizat, împachetare și manipulare mobilier.', 'Truck'),
('Curățenie', 'curatenie', 'Servicii profesionale de curățenie generală sau după constructor.', 'Sparkles'),
('Instalator', 'instalator', 'Intervenții rapide sanitare, termice și reparații instalații.', 'Hammer'),
('Centrale termice', 'centrale-termice', 'Montaj, autorizare ISCIR și service centrale.', 'Zap'),
('Designer interior', 'designer-interior', 'Staging imobiliar și proiectare design interior complet.', 'Palette'),
('Renovări / construcții', 'renovari-constructii', 'Amenajări interioare, finisaje și lucrări de renovare.', 'Hammer'),
('Expertiză tehnică', 'expertiza-tehnica', 'Verificare rezistență clădiri și rapoarte tehnice.', 'FileText'),
('Instalare Mobilier', 'instalare-mobilier', 'Montaj mobilier de bucătărie, living sau dormitor.', 'Armchair')
ON CONFLICT (slug) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon;
