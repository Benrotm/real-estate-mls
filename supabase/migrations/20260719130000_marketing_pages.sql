CREATE TABLE IF NOT EXISTS public.marketing_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_key TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    subtitle TEXT,
    sections JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.marketing_pages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Marketing pages are viewable by everyone" ON public.marketing_pages;
CREATE POLICY "Marketing pages are viewable by everyone" ON public.marketing_pages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage marketing pages" ON public.marketing_pages;
CREATE POLICY "Admins can manage marketing pages" ON public.marketing_pages
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- Seed initial data
INSERT INTO public.marketing_pages (page_key, title, subtitle, sections)
VALUES
(
    'clients',
    'Găsește Proprietatea Perfectă la Prețul Corect',
    'Platforma MLS completă pentru cumpărători. Contactează proprietarii direct, accesează tururi virtuale și rapoarte de piață reală.',
    '[
        {
            "id": "c1",
            "title": "Tururi Virtuale 3D",
            "desc": "Vizualizează proprietățile în detaliu direct de acasă.",
            "icon": "Video",
            "bg_gradient": "from-violet-800 via-purple-800 to-indigo-950",
            "items": [
                "Economisește timp evitând vizionări inutile.",
                "Walkthrough interactiv 360° la rezoluție maximă.",
                "Detalii tehnice complete ale imobilului."
            ],
            "cta_text": "Vezi Proprietăți",
            "cta_link": "/properties"
        },
        {
            "id": "c2",
            "title": "Contact Direct cu Proprietarii",
            "desc": "Fără intermediari și comisioane ascunse.",
            "icon": "Users",
            "bg_gradient": "from-blue-800 via-indigo-800 to-slate-950",
            "items": [
                "Date de contact verificate ale proprietarilor.",
                "Chat securizat integrat în platformă.",
                "Negocieri transparente directe."
            ],
            "cta_text": "Creează Cont Gratuit",
            "cta_link": "/auth/signup"
        },
        {
            "id": "c3",
            "title": "Evaluări Reale de Piață",
            "desc": "Nu plăti mai mult decât face.",
            "icon": "TrendingUp",
            "bg_gradient": "from-emerald-800 via-teal-800 to-cyan-950",
            "items": [
                "Rapoarte bazate pe tranzacții reale recente.",
                "Preț mediu pe metru pătrat în zonă.",
                "Evoluția pieței locale."
            ],
            "cta_text": "Vezi Evaluări",
            "cta_link": "/properties"
        }
    ]'::jsonb
),
(
    'owners',
    'Vinde sau Închiriază Proprietatea ta Rapid',
    'Accesează instrumente AI de evaluare, creează tururi 3D și intră în contact direct cu clienții interesați ACTIV acum.',
    '[
        {
            "id": "o1",
            "title": "Evaluare Instantanee și Predictibilitate",
            "desc": "Află prețul corect și timpul estimat de vânzare.",
            "icon": "TrendingUp",
            "bg_gradient": "from-violet-800 via-purple-800 to-indigo-950",
            "items": [
                "Vezi cotațiile de preț în funcție de concurență.",
                "Statistici detaliate despre clienți căutători.",
                "Strategii de vânzare personalizate."
            ],
            "cta_text": "Evaluează Proprietate",
            "cta_link": "/properties"
        },
        {
            "id": "o2",
            "title": "Calculator Servicii & Comisioane",
            "desc": "Transparență totală în promovarea proprietății tale.",
            "icon": "Calculator",
            "bg_gradient": "from-orange-800 via-amber-800 to-stone-950",
            "items": [
                "Alege serviciile dorite (promovare, acte, broker).",
                "Calculează comisionul final în mod dinamic.",
                "Obține cotația completă sub formă de document."
            ],
            "cta_text": "Deschide Calculator",
            "cta_link": "/calculator-comisioane"
        }
    ]'::jsonb
),
(
    'brokers',
    'MLS Avanasat & CRM pentru Profesioniști',
    'Soluția supremă pentru brokeri, agenții și dezvoltatori imobiliari. Automatizează matching-ul și sporește performanța echipei.',
    '[
        {
            "id": "b1",
            "title": "CRM & Matching Engine",
            "desc": "Gestionează lead-urile și proprietățile eficient.",
            "icon": "Target",
            "bg_gradient": "from-violet-800 via-purple-800 to-indigo-950",
            "items": [
                "Matching automat între portofoliu și cererile active.",
                "Pipeline vizual de tranzacții.",
                "Notificări în timp real pe WhatsApp."
            ],
            "cta_text": "Începe Acum",
            "cta_link": "/auth/signup"
        },
        {
            "id": "b2",
            "title": "Managementul Echipei și ROI",
            "desc": "Urmărește performanța și optimizează costurile.",
            "icon": "Shield",
            "bg_gradient": "from-blue-800 via-indigo-800 to-slate-950",
            "items": [
                "Monitorizare activități zilnice ale agenților.",
                "Repartizare automată de lead-uri.",
                "Rapoarte ROI detaliate."
            ],
            "cta_text": "Creează Cont Agency",
            "cta_link": "/auth/signup"
        }
    ]'::jsonb
)
ON CONFLICT (page_key) DO UPDATE
SET title = EXCLUDED.title,
    subtitle = EXCLUDED.subtitle,
    sections = EXCLUDED.sections;
